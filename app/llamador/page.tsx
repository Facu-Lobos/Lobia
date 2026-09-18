import { prisma } from "@/lib/prisma";
import { toMidnight } from "@/lib/professional-mutations";
import { CallerScreen } from "@/components/CallerScreen";
import { AutoRefresh } from "@/components/AutoRefresh";
import LobiaWordmark from "@/components/LobiaWordmark";

// Pública, sin login: pensada para dejar abierta en un TV/monitor en la
// sala de espera física. No aparece en el menú de ningún rol — se accede
// directo por URL (opcionalmente con ?institucion=<id> para una sede
// puntual; sin el parámetro, muestra las de todas). noindex para que no
// termine indexada con nombres de pacientes.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PublicLlamadorPage({
  searchParams,
}: {
  searchParams: Promise<{ institucion?: string }>;
}) {
  const { institucion } = await searchParams;

  const todayStart = toMidnight(new Date());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "BOOKED",
      calledAt: { gte: todayStart, lt: todayEnd },
      completedAt: null,
      ...(institucion ? { professional: { institutionId: institucion } } : {}),
    },
    include: { professional: true, patient: true },
    orderBy: { calledAt: "desc" },
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="bg-primary py-4 text-center text-white">
        <LobiaWordmark className="text-2xl" strokeWidth={2} />
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <AutoRefresh intervalMs={8000} />
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
