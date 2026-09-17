import { requireSecretary } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toMidnight } from "@/lib/professional-mutations";
import { markArrived, markCalled, markCompleted } from "@/actions/appointment-management";
import { WaitingRoom } from "@/components/WaitingRoom";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function SecretariaSalaEsperaPage() {
  const { institutionId } = await requireSecretary();

  const todayStart = toMidnight(new Date());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const institutionFilter = institutionId ? { institutionId } : {};

  const appointments = await prisma.appointment.findMany({
    where: {
      professional: institutionFilter,
      status: "BOOKED",
      date: { gte: todayStart, lt: todayEnd },
    },
    include: { professional: true, patient: true },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <AutoRefresh />
      <h1 className="text-2xl font-semibold tracking-tight">Sala de espera</h1>
      <p className="mt-1 text-muted">Turnos de hoy, en vivo.</p>

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
          returnTo="/secretaria/sala-espera"
          markArrivedAction={markArrived}
          markCalledAction={markCalled}
          markCompletedAction={markCompleted}
        />
      </div>
    </div>
  );
}
