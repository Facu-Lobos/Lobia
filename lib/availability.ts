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

export type DaySlot = {
  time: string;
  iso: string;
  appointment: {
    id: string;
    patientId: string;
    patientName: string;
    healthInsurance: string | null;
    status: "BOOKED" | "CANCELLED";
    arrivedAt: Date | null;
    calledAt: Date | null;
    completedAt: Date | null;
  } | null;
};

type AppointmentForSlot = {
  id: string;
  patientId: string;
  date: Date;
  status: "BOOKED" | "CANCELLED";
  arrivedAt: Date | null;
  calledAt: Date | null;
  completedAt: Date | null;
  patient: { name: string; healthInsurance: string | null };
};

function buildDaySlots(
  dayStart: Date,
  windows: SlotWindow[],
  appointments: AppointmentForSlot[]
): DaySlot[] {
  const byIso = new Map(appointments.map((a) => [a.date.toISOString(), a]));
  const slots: DaySlot[] = [];
  const seen = new Set<string>();

  for (const window of windows) {
    const startMin = timeToMinutes(window.startTime);
    const endMin = timeToMinutes(window.endTime);

    for (
      let m = startMin;
      m + window.slotMinutes <= endMin;
      m += window.slotMinutes
    ) {
      const slotDate = new Date(dayStart);
      slotDate.setMinutes(m);
      const iso = slotDate.toISOString();
      if (seen.has(iso)) continue;
      seen.add(iso);

      const appt = byIso.get(iso);
      slots.push({
        iso,
        time: `${String(slotDate.getHours()).padStart(2, "0")}:${String(
          slotDate.getMinutes()
        ).padStart(2, "0")}`,
        appointment: appt
          ? {
              id: appt.id,
              patientId: appt.patientId,
              patientName: appt.patient.name,
              healthInsurance: appt.patient.healthInsurance,
              status: appt.status,
              arrivedAt: appt.arrivedAt,
              calledAt: appt.calledAt,
              completedAt: appt.completedAt,
            }
          : null,
      });
    }
  }

  // Turnos que caen fuera de cualquier ventana de horario (ej. se sacaron
  // antes de que se borrara ese horario) igual se muestran, al final.
  for (const appt of appointments) {
    const iso = appt.date.toISOString();
    if (seen.has(iso)) continue;
    seen.add(iso);
    slots.push({
      iso,
      time: `${String(appt.date.getHours()).padStart(2, "0")}:${String(
        appt.date.getMinutes()
      ).padStart(2, "0")}`,
      appointment: {
        id: appt.id,
        patientId: appt.patientId,
        patientName: appt.patient.name,
        healthInsurance: appt.patient.healthInsurance,
        status: appt.status,
        arrivedAt: appt.arrivedAt,
        calledAt: appt.calledAt,
        completedAt: appt.completedAt,
      },
    });
  }

  slots.sort((a, b) => a.time.localeCompare(b.time));
  return slots;
}

// A diferencia de getAvailability/isSlotAvailableForBooking (para reservar,
// sólo futuro y sólo libres), esto arma la grilla completa de un día puntual
// para uso interno (sala de espera): todos los slots del horario del
// profesional ese día, ocupados o no, pasados o futuros.
export async function getDaySlotsForProfessional(
  professionalId: string,
  day: Date
): Promise<DaySlot[]> {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const dayOfWeek = dayStart.getDay();

  const [schedules, extraDays, license, appointments] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { professionalId, dayOfWeek },
    }),
    prisma.extraDay.findMany({
      where: { professionalId, date: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.license.findFirst({
      where: {
        professionalId,
        startDate: { lte: dayStart },
        endDate: { gte: dayStart },
      },
    }),
    prisma.appointment.findMany({
      where: {
        professionalId,
        status: { in: ["BOOKED", "CANCELLED"] },
        date: { gte: dayStart, lt: dayEnd },
      },
      include: { patient: true },
    }),
  ]);

  if (license) return [];

  return buildDaySlots(dayStart, [...schedules, ...extraDays], appointments);
}

// Misma grilla que getDaySlotsForProfessional, pero para varios profesionales
// a la vez con sólo 4 consultas en total (en vez de 4 por profesional) —
// pensado para la vista "Todos los profesionales" de sala de espera, para no
// disparar decenas de queries concurrentes contra el pooler de Supabase.
export async function getDaySlotsForProfessionals(
  professionalIds: string[],
  day: Date
): Promise<Map<string, DaySlot[]>> {
  const result = new Map<string, DaySlot[]>();
  if (professionalIds.length === 0) return result;

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const dayOfWeek = dayStart.getDay();

  const [schedules, extraDays, licenses, appointments] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { professionalId: { in: professionalIds }, dayOfWeek },
    }),
    prisma.extraDay.findMany({
      where: { professionalId: { in: professionalIds }, date: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.license.findMany({
      where: {
        professionalId: { in: professionalIds },
        startDate: { lte: dayStart },
        endDate: { gte: dayStart },
      },
    }),
    prisma.appointment.findMany({
      where: {
        professionalId: { in: professionalIds },
        status: { in: ["BOOKED", "CANCELLED"] },
        date: { gte: dayStart, lt: dayEnd },
      },
      include: { patient: true },
    }),
  ]);

  const licensedIds = new Set(licenses.map((l) => l.professionalId));

  for (const id of professionalIds) {
    if (licensedIds.has(id)) {
      result.set(id, []);
      continue;
    }
    const windows = [
      ...schedules.filter((s) => s.professionalId === id),
      ...extraDays.filter((e) => e.professionalId === id),
    ];
    const apptsForProf = appointments.filter((a) => a.professionalId === id);
    result.set(id, buildDaySlots(dayStart, windows, apptsForProf));
  }

  return result;
}
