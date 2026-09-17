import Link from "next/link";
import { requireSpecialist } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { markOwnArrived, markOwnCalled, markOwnCompleted } from "@/actions/specialist";
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

export default async function ProfesionalSalaEsperaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { professional } = await requireSpecialist();
  const { date: dateParamValue } = await searchParams;

  const day = parseDayParam(dateParamValue);
  const dayEnd = new Date(day);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const prevDay = new Date(day);
  prevDay.setDate(prevDay.getDate() - 1);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId: professional.id,
      status: "BOOKED",
      date: { gte: day, lt: dayEnd },
    },
    include: { patient: true },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <AutoRefresh />
      <h1 className="text-2xl font-semibold tracking-tight">Sala de espera</h1>
      <p className="mt-1 text-muted">Tus turnos, en vivo.</p>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <Link
          href={`/profesional/sala-espera?date=${dayParam(prevDay)}`}
          className="rounded-md border border-border px-2 py-1 hover:border-primary"
        >
          ← Día anterior
        </Link>
        <span className="font-medium">{formatDayLabel(day)}</span>
        <Link
          href={`/profesional/sala-espera?date=${dayParam(nextDay)}`}
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
            arrivedAt: a.arrivedAt,
            calledAt: a.calledAt,
            completedAt: a.completedAt,
          }))}
          returnTo={`/profesional/sala-espera?date=${dayParam(day)}`}
          markArrivedAction={markOwnArrived}
          markCalledAction={markOwnCalled}
          markCompletedAction={markOwnCompleted}
        />
      </div>
    </div>
  );
}
