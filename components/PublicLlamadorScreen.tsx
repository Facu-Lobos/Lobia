import Image from "next/image";
import { AutoRefresh } from "@/components/AutoRefresh";
import LobiaWordmark from "@/components/LobiaWordmark";
import { stripProfessionalTitle } from "@/lib/format";
import logo from "@/public/logo.png";

export type PublicCalledAppointment = {
  id: string;
  patientName: string;
  professionalName: string;
  consultingRoom: string | null;
  calledAt: Date;
};

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

// Pantalla del llamador público (sin login), pensada para un TV/monitor en
// la sala de espera física: header con el logo real, columna de turnos a
// la izquierda (letra grande — si llaman a dos pacientes seguido tiene que
// alcanzar a leerse antes de que se corra de la lista) y la tarjeta grande
// con el paciente que está pasando a la consulta, ocupando el resto del
// ancho.
export function PublicLlamadorScreen({
  appointments,
}: {
  appointments: PublicCalledAppointment[];
}) {
  const [current, ...rest] = appointments;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <AutoRefresh intervalMs={8000} />

      <header className="flex items-center gap-3 bg-primary px-6 py-4 text-white">
        <Image
          src={logo}
          alt="Lobia"
          width={48}
          height={48}
          className="h-11 w-11"
          priority
        />
        <span className="leading-tight">
          <LobiaWordmark className="text-3xl" strokeWidth={2.2} />
          <span className="block text-sm text-white/70">
            Tecnología inteligente para tu salud.
          </span>
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 shrink-0 overflow-y-auto border-r border-border bg-surface p-5">
          <h2 className="text-base font-medium uppercase tracking-wide text-muted">
            Turnos
          </h2>
          <div className="mt-4 space-y-3">
            {rest.map((a) => (
              <div
                key={a.id}
                className="rounded-md border border-border bg-background px-4 py-3"
              >
                <p className="text-lg font-medium">{a.patientName}</p>
                <p className="text-base text-muted">
                  {a.consultingRoom ?? "Sin consultorio"} · {a.professionalName}{" "}
                  · {formatTime(a.calledAt)}
                </p>
              </div>
            ))}
            {rest.length === 0 && (
              <p className="text-base text-muted">Nadie más en espera.</p>
            )}
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center p-10">
          {current ? (
            <div className="w-full max-w-4xl rounded-lg border-4 border-primary bg-primary-soft p-16 text-center">
              <p className="text-7xl font-bold text-foreground">
                {current.patientName}
              </p>
              <p className="mt-8 text-4xl text-muted">
                Acérquese al consultorio{" "}
                <span className="font-semibold text-primary">
                  {current.consultingRoom ?? "—"}
                </span>{" "}
                con Dr/Dra {stripProfessionalTitle(current.professionalName)}
              </p>
            </div>
          ) : (
            <p className="text-3xl text-muted">Sin pacientes en consulta.</p>
          )}
        </main>
      </div>
    </div>
  );
}
