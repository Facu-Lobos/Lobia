import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { cancelAppointment } from "@/actions/appointments";
import { listDocumentsForPatient } from "@/lib/documents";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function formatDate(date: Date) {
  return `${DAY_NAMES[date.getDay()]} ${String(date.getDate()).padStart(
    2,
    "0"
  )}/${String(date.getMonth() + 1).padStart(2, "0")} - ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default async function MisTurnosPage({
  searchParams,
}: {
  searchParams: Promise<{
    reservado?: string;
    cancelado?: string;
    profesionalId?: string;
  }>;
}) {
  const user = await requireUser();
  const { reservado, cancelado, profesionalId } = await searchParams;

  const [appointments, messageProfessional, documents] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId: user.id },
      include: { professional: true },
      orderBy: { date: "asc" },
    }),
    profesionalId
      ? prisma.professional.findUnique({ where: { id: profesionalId } })
      : Promise.resolve(null),
    listDocumentsForPatient(user.id),
  ]);

  const customMessage = reservado
    ? messageProfessional?.bookingMessage
    : cancelado
      ? messageProfessional?.cancelMessage
      : null;

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.status === "BOOKED" && a.date > now
  );
  const past = appointments.filter(
    (a) => a.status !== "BOOKED" || a.date <= now
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Mis Turnos</h1>
        <Link
          href="/mis-turnos/perfil"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary"
        >
          Mi perfil
        </Link>
      </div>

      {reservado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Turno reservado con éxito.
        </p>
      )}
      {cancelado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Turno cancelado.
        </p>
      )}
      {customMessage && (
        <p className="mt-2 rounded-md bg-primary-soft px-4 py-3 text-sm text-foreground">
          {customMessage}
        </p>
      )}

      <div className="mt-8">
        <h2 className="font-medium">Próximos</h2>
        {upcoming.length === 0 && (
          <p className="mt-2 text-sm text-muted">
            No tenés turnos próximos.
          </p>
        )}
        <div className="mt-3 space-y-3">
          {upcoming.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="font-medium">{a.professional.fullName}</p>
                <p className="text-sm text-muted">{formatDate(a.date)}</p>
              </div>
              <form action={cancelAppointment}>
                <input type="hidden" name="appointmentId" value={a.id} />
                <button
                  type="submit"
                  className="rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger-bg"
                >
                  Cancelar
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-medium">Mis documentos</h2>
        {documents.length === 0 && (
          <p className="mt-2 text-sm text-muted">
            Todavía no tenés documentos disponibles.
          </p>
        )}
        <div className="mt-3 space-y-2">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={`/api/documents/${doc.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 hover:border-primary"
            >
              <span className="font-medium">{doc.title}</span>
              <span className="text-sm text-muted">
                {String(doc.createdAt.getDate()).padStart(2, "0")}/
                {String(doc.createdAt.getMonth() + 1).padStart(2, "0")}/
                {doc.createdAt.getFullYear()}
              </span>
            </a>
          ))}
        </div>
      </div>

      {past.length > 0 && (
        <div className="mt-10">
          <h2 className="font-medium">Historial</h2>
          <div className="mt-3 space-y-3">
            {past.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface/60 px-4 py-3 opacity-70"
              >
                <div>
                  <p className="font-medium">{a.professional.fullName}</p>
                  <p className="text-sm text-muted">{formatDate(a.date)}</p>
                </div>
                <span className="text-sm text-muted">
                  {a.status === "CANCELLED" ? "Cancelado" : "Realizado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
