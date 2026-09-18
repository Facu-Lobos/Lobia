import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { toMidnight } from "@/lib/professional-mutations";
import { AutoRefresh } from "@/components/AutoRefresh";
import LobiaWordmark from "@/components/LobiaWordmark";
import logo from "@/public/logo.png";

// Pública, sin login: pensada para dejar abierta en un TV/monitor en la
// sala de espera física. No aparece en el menú de ningún rol — se accede
// directo por URL (opcionalmente con ?institucion=<id> para una sede
// puntual; sin el parámetro, muestra las de todas). noindex para que no
// termine indexada con nombres de pacientes.
export const metadata = {
  robots: { index: false, follow: false },
};

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

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

  const [current, ...rest] = appointments;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <AutoRefresh intervalMs={8000} />

      <header className="flex items-center gap-3 bg-primary px-6 py-4 text-white">
        <Image
          src={logo}
          alt="Lobia"
          width={40}
          height={40}
          className="h-9 w-9"
          priority
        />
        <LobiaWordmark className="text-2xl" strokeWidth={2} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-border bg-surface p-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            Turnos
          </h2>
          <div className="mt-3 space-y-2">
            {rest.map((a) => (
              <div
                key={a.id}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <p className="font-medium">{a.patient.name}</p>
                <p className="text-muted">
                  {a.professional.consultingRoom ?? "Sin consultorio"} ·{" "}
                  {a.professional.fullName} · {formatTime(a.calledAt!)}
                </p>
              </div>
            ))}
            {rest.length === 0 && (
              <p className="text-sm text-muted">Nadie más en espera.</p>
            )}
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center p-8">
          {current ? (
            <div className="w-full max-w-2xl rounded-lg border-2 border-primary bg-primary-soft p-10 text-center">
              <p className="text-xl text-muted">Por favor, acérquese</p>
              <p className="mt-3 text-6xl font-bold text-foreground">
                {current.patient.name}
              </p>
              <p className="mt-6 text-4xl font-semibold text-primary">
                {current.professional.consultingRoom ?? "Consultorio no asignado"}
              </p>
              <p className="mt-3 text-2xl text-muted">
                {current.professional.fullName}
              </p>
            </div>
          ) : (
            <p className="text-2xl text-muted">Sin pacientes en consulta.</p>
          )}
        </main>
      </div>
    </div>
  );
}
