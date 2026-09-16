import { prisma } from "@/lib/prisma";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type SlotWindow = { startTime: string; endTime: string; slotMinutes: number };

function generateSlotsForWindow(
  day: Date,
  now: Date,
  window: SlotWindow,
  bookedSet: Set<string>,
  out: { iso: string; time: string }[]
) {
  const startMin = timeToMinutes(window.startTime);
  const endMin = timeToMinutes(window.endTime);

  for (
    let m = startMin;
    m + window.slotMinutes <= endMin;
    m += window.slotMinutes
  ) {
    const slotDate = new Date(day);
    slotDate.setHours(0, m, 0, 0);

    if (slotDate <= now) continue;

    const iso = slotDate.toISOString();
    if (bookedSet.has(iso)) continue;

    out.push({
      iso,
      time: `${String(slotDate.getHours()).padStart(2, "0")}:${String(
        slotDate.getMinutes()
      ).padStart(2, "0")}`,
    });
  }
}

export type AvailableDay = {
  dateISO: string;
  label: string;
  slots: { iso: string; time: string }[];
};

export async function getAvailability(
  professionalId: string,
  daysAhead = 14
): Promise<AvailableDay[]> {
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + daysAhead);

  const [schedules, extraDays, licenses, booked] = await Promise.all([
    prisma.scheduleSlot.findMany({ where: { professionalId } }),
    prisma.extraDay.findMany({
      where: { professionalId, date: { gte: rangeStart, lt: rangeEnd } },
    }),
    prisma.license.findMany({
      where: {
        professionalId,
        startDate: { lte: rangeEnd },
        endDate: { gte: rangeStart },
      },
    }),
    prisma.appointment.findMany({
      where: {
        professionalId,
        status: "BOOKED",
        date: { gte: rangeStart, lt: rangeEnd },
      },
      select: { date: true },
    }),
  ]);

  if (schedules.length === 0 && extraDays.length === 0) return [];

  const bookedSet = new Set(booked.map((b) => b.date.toISOString()));

  const days: AvailableDay[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const day = new Date(rangeStart);
    day.setDate(day.getDate() + i);
    const dayOfWeek = day.getDay();

    const dayIsLicensed = licenses.some(
      (l) => l.startDate <= day && l.endDate >= day
    );
    if (dayIsLicensed) continue;

    const daySchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);
    const dayExtraDays = extraDays.filter((e) => sameCalendarDay(e.date, day));

    const slots: { iso: string; time: string }[] = [];

    for (const schedule of daySchedules) {
      generateSlotsForWindow(day, now, schedule, bookedSet, slots);
    }
    for (const extraDay of dayExtraDays) {
      generateSlotsForWindow(day, now, extraDay, bookedSet, slots);
    }

    if (slots.length > 0) {
      slots.sort((a, b) => a.time.localeCompare(b.time));
      days.push({
        dateISO: day.toISOString().slice(0, 10),
        label: `${DAY_NAMES[dayOfWeek]} ${String(day.getDate()).padStart(
          2,
          "0"
        )}/${String(day.getMonth() + 1).padStart(2, "0")}`,
        slots,
      });
    }
  }

  return days;
}

// Revalidación server-side al momento de reservar: chequea que la fecha no
// caiga dentro de una Licencia activa, y que esté dentro de un ScheduleSlot
// semanal o de un ExtraDay puntual para ese día.
export async function isSlotAvailableForBooking(
  professionalId: string,
  date: Date
): Promise<boolean> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const activeLicense = await prisma.license.findFirst({
    where: {
      professionalId,
      startDate: { lte: dayStart },
      endDate: { gte: dayStart },
    },
  });
  if (activeLicense) return false;

  const dayOfWeek = date.getDay();
  const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;

  const schedules = await prisma.scheduleSlot.findMany({
    where: { professionalId, dayOfWeek },
  });
  if (schedules.some((s) => timeStr >= s.startTime && timeStr < s.endTime)) {
    return true;
  }

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const extraDays = await prisma.extraDay.findMany({
    where: { professionalId, date: { gte: dayStart, lt: dayEnd } },
  });

  return extraDays.some(
    (e) => timeStr >= e.startTime && timeStr < e.endTime
  );
}
