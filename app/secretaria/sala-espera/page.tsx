import { requireSecretary } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getDaySlotsForProfessional } from "@/lib/availability";
import { markArrived, markCalled, markCompleted } from "@/actions/appointment-management";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DatePicker } from "@/components/DatePicker";
import { WeeklyHoursStrip } from "@/components/WeeklyHoursStrip";
import { DaySlotGrid } from "@/components/DaySlotGrid";
import { MultiProfessionalGrid } from "@/components/MultiProfessionalGrid";
import { dayParam, parseDayParam, parseMonthParam } from "@/components/AppointmentCalendar";

const DAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

function formatDayLabel(date: Date) {
  return `${DAY_NAMES[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export default async function SecretariaSalaEsperaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string; profesionalId?: string }>;
}) {
  const { institutionId } = await requireSecretary();
  const { date: dateParamValue, month: monthParamValue, profesionalId } = await searchParams;

  const day = parseDayParam(dateParamValue);
  const month = monthParamValue ? parseMonthParam(monthParamValue) : new Date(day.getFullYear(), day.getMonth(), 1);

  const institutionFilter = institutionId ? { institutionId } : {};
  const qs = profesionalId ? `&profesionalId=${profesionalId}` : "";
  const basePath = "/secretaria/sala-espera";
  const returnTo = `${basePath}?date=${dayParam(day)}${qs}`;

  const professionals = await prisma.professional.findMany({
    where: institutionFilter,
    orderBy: { fullName: "asc" },
  });

  const selectedProfessional = profesionalId
    ? professionals.find((p) => p.id === profesionalId)
    : null;

  const [daySlots, weekSchedules, allProfessionalsData] = await Promise.all([
    selectedProfessional
      ? getDaySlotsForProfessional(selectedProfessional.id, day)
      : Promise.resolve(null),
    selectedProfessional
      ? prisma.scheduleSlot.findMany({ where: { professionalId: selectedProfessional.id } })
      : Promise.resolve([]),
    !selectedProfessional
      ? Promise.all(
          professionals.map(async (p) => ({
            professional: { id: p.id, fullName: p.fullName },
            slots: await getDaySlotsForProfessional(p.id, day),
            schedules: await prisma.scheduleSlot.findMany({ where: { professionalId: p.id } }),
          }))
        )
      : Promise.resolve(null),
  ]);

  return (
    <div>
      <AutoRefresh />
      <h1 className="text-2xl font-semibold tracking-tight">Sala de espera</h1>
      <p className="mt-1 text-muted">En vivo, por día y profesional.</p>

      <div className="mt-4 flex flex-wrap items-start gap-6">
        <DatePicker
          month={month}
          selectedDate={day}
          basePath={basePath}
          extraQuery={qs}
        />

        <div className="flex-1">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="date" value={dayParam(day)} />
            <div>
              <label htmlFor="profesionalId" className="text-sm font-medium">
                Profesional
              </label>
              <select
                id="profesionalId"
                name="profesionalId"
                defaultValue={profesionalId ?? ""}
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              >
                <option value="">Todos</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
            >
              Ver
            </button>
          </form>

          <p className="mt-3 font-medium">{formatDayLabel(day)}</p>

          {selectedProfessional && (
            <div className="mt-3">
              <WeeklyHoursStrip schedules={weekSchedules} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {selectedProfessional ? (
          <DaySlotGrid
            slots={daySlots!}
            returnTo={returnTo}
            markArrivedAction={markArrived}
            markCalledAction={markCalled}
            markCompletedAction={markCompleted}
          />
        ) : (
          <MultiProfessionalGrid
            data={allProfessionalsData!}
            returnTo={returnTo}
            markArrivedAction={markArrived}
            markCalledAction={markCalled}
            markCompletedAction={markCompleted}
          />
        )}
      </div>
    </div>
  );
}
