import { requireSpecialist } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getDaySlotsForProfessional } from "@/lib/availability";
import { markOwnArrived, markOwnCalled, markOwnCompleted } from "@/actions/specialist";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DatePicker } from "@/components/DatePicker";
import { WeeklyHoursStrip } from "@/components/WeeklyHoursStrip";
import { DaySlotGrid } from "@/components/DaySlotGrid";
import { dayParam, parseDayParam, parseMonthParam } from "@/components/AppointmentCalendar";

const DAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

function formatDayLabel(date: Date) {
  return `${DAY_NAMES[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export default async function ProfesionalSalaEsperaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  const { professional } = await requireSpecialist();
  const { date: dateParamValue, month: monthParamValue } = await searchParams;

  const day = parseDayParam(dateParamValue);
  const month = monthParamValue ? parseMonthParam(monthParamValue) : new Date(day.getFullYear(), day.getMonth(), 1);
  const basePath = "/profesional/sala-espera";
  const returnTo = `${basePath}?date=${dayParam(day)}`;

  const [daySlots, weekSchedules] = await Promise.all([
    getDaySlotsForProfessional(professional.id, day),
    prisma.scheduleSlot.findMany({ where: { professionalId: professional.id } }),
  ]);

  return (
    <div>
      <AutoRefresh />
      <h1 className="text-2xl font-semibold tracking-tight">Sala de espera</h1>
      <p className="mt-1 text-muted">Tus turnos, en vivo.</p>

      <div className="mt-4 flex flex-wrap items-start gap-6">
        <DatePicker month={month} selectedDate={day} basePath={basePath} />

        <div className="flex-1">
          <p className="font-medium">{formatDayLabel(day)}</p>
          <div className="mt-3">
            <WeeklyHoursStrip schedules={weekSchedules} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DaySlotGrid
          slots={daySlots}
          returnTo={returnTo}
          markArrivedAction={markOwnArrived}
          markCalledAction={markOwnCalled}
          markCompletedAction={markOwnCompleted}
        />
      </div>
    </div>
  );
}
