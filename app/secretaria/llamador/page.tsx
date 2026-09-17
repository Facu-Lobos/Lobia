import { requireSecretary } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toMidnight } from "@/lib/professional-mutations";
import { CallerScreen } from "@/components/CallerScreen";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function SecretariaLlamadorPage() {
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
      calledAt: { not: null },
      completedAt: null,
    },
    include: { professional: true, patient: true },
    orderBy: { calledAt: "desc" },
  });

  return (
    <div>
      <AutoRefresh intervalMs={8000} />
      <h1 className="text-2xl font-semibold tracking-tight">Llamador</h1>
      <p className="mt-1 text-muted">
        Pantalla para mostrar en la sala de espera.
      </p>

      <div className="mt-6">
        <CallerScreen
          patients={appointments.map((a) => ({
            id: a.id,
            patientName: a.patient.name,
            professionalName: a.professional.fullName,
            consultingRoom: a.professional.consultingRoom,
            calledAt: a.calledAt!,
          }))}
        />
      </div>
    </div>
  );
}
