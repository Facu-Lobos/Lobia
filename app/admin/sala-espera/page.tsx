import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { markArrived, markCalled, markCompleted } from "@/actions/appointment-management";
import { WaitingRoom } from "@/components/WaitingRoom";
import { AutoRefresh } from "@/components/AutoRefresh";
import { dayParam, parseDayParam } from "@/components/AppointmentCalendar";

const DAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

function formatDayLabel(date: Date) {
  return `${DAY_NAMES[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export default async function AdminSalaEsperaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; profesionalId?: string }>;
}) {
  await requireAdmin();
  const { date: dateParamValue, profesionalId } = await searchParams;

  const day = parseDayParam(dateParamValue);
  const dayEnd = new Date(day);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const prevDay = new Date(day);
  prevDay.setDate(prevDay.getDate() - 1);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const profFilter = profesionalId ? { professionalId: profesionalId } : {};
  const qs = profesionalId ? `&profesionalId=${profesionalId}` : "";

  const [appointments, professionals] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        ...profFilter,
        status: "BOOKED",
        date: { gte: day, lt: dayEnd },
      },
      include: { professional: true, patient: true },
      orderBy: { date: "asc" },
    }),
    prisma.professional.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  return (
    <div>
      <AutoRefresh />
      <h1 className="text-2xl font-semibold tracking-tight">Sala de espera</h1>
      <p className="mt-1 text-muted">
        En vivo, por día y profesional, en todas las instituciones.
      </p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="date" className="text-sm font-medium">
            Fecha
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={dayParam(day)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
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

      <div className="mt-4 flex items-center gap-3 text-sm">
        <Link
          href={`/admin/sala-espera?date=${dayParam(prevDay)}${qs}`}
          className="rounded-md border border-border px-2 py-1 hover:border-primary"
        >
          ← Día anterior
        </Link>
        <span className="font-medium">{formatDayLabel(day)}</span>
        <Link
          href={`/admin/sala-espera?date=${dayParam(nextDay)}${qs}`}
          className="rounded-md border border-border px-2 py-1 hover:border-primary"
        >
          Día siguiente →
        </Link>
      </div>

      <div className="mt-6">
        <WaitingRoom
          appointments={appointments.map((a) => ({
            id: a.id,
            date: a.date,
            patientName: a.patient.name,
            professionalName: a.professional.fullName,
            arrivedAt: a.arrivedAt,
            calledAt: a.calledAt,
            completedAt: a.completedAt,
          }))}
          returnTo={`/admin/sala-espera?date=${dayParam(day)}${qs}`}
          markArrivedAction={markArrived}
          markCalledAction={markCalled}
          markCompletedAction={markCompleted}
        />
      </div>
    </div>
  );
}
