import { requireSpecialist } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toMidnight } from "@/lib/professional-mutations";
import { markOwnArrived, markOwnCalled, markOwnCompleted } from "@/actions/specialist";
import { WaitingRoom } from "@/components/WaitingRoom";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function ProfesionalSalaEsperaPage() {
  const { professional } = await requireSpecialist();

  const todayStart = toMidnight(new Date());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId: professional.id,
      status: "BOOKED",
      date: { gte: todayStart, lt: todayEnd },
    },
    include: { patient: true },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <AutoRefresh />
      <h1 className="text-2xl font-semibold tracking-tight">Sala de espera</h1>
      <p className="mt-1 text-muted">Tus turnos de hoy, en vivo.</p>

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
          returnTo="/profesional/sala-espera"
          markArrivedAction={markOwnArrived}
          markCalledAction={markOwnCalled}
          markCompletedAction={markOwnCompleted}
        />
      </div>
    </div>
  );
}
