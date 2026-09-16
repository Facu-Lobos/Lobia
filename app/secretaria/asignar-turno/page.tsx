import Link from "next/link";
import { requireSecretary } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getAvailability } from "@/lib/availability";
import { assignAppointment } from "@/actions/secretary";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const ERROR_MESSAGES: Record<string, string> = {
  ocupado: "Ese horario ya fue reservado. Elegí otro.",
  invalido: "El horario seleccionado ya no es válido. Elegí otro.",
};

export default async function AsignarTurnoPage({
  searchParams,
}: {
  searchParams: Promise<{
    patientId?: string;
    professionalId?: string;
    error?: string;
    asignado?: string;
    asignadoFecha?: string;
  }>;
}) {
  const { institutionId } = await requireSecretary();
  const { patientId, professionalId, error, asignado, asignadoFecha } =
    await searchParams;

  if (!patientId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Asignar turno
        </h1>
        <p className="mt-2 text-muted">
          Primero buscá o creá el paciente en{" "}
          <Link href="/secretaria/pacientes" className="text-primary underline">
            Pacientes
          </Link>
          , y desde ahí presioná &quot;Asignar turno&quot;.
        </p>
      </div>
    );
  }

  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  if (!patient) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Asignar turno
        </h1>
        <p className="mt-2 text-danger">Paciente no encontrado.</p>
      </div>
    );
  }

  if (!professionalId) {
    const professionals = await prisma.professional.findMany({
      where: {
        active: true,
        ...(institutionId ? { institutionId } : {}),
      },
      include: { specialties: { include: { specialty: true } } },
      orderBy: { fullName: "asc" },
    });

    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Asignar turno a {patient.name}
        </h1>
        <p className="mt-2 text-muted">Elegí un profesional.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {professionals.map((p) => (
            <Link
              key={p.id}
              href={`/secretaria/asignar-turno?patientId=${patientId}&professionalId=${p.id}`}
              className="rounded-lg border border-border bg-surface p-4 hover:border-primary"
            >
              <p className="font-medium">{p.fullName}</p>
              <p className="text-sm text-accent">
                {p.specialties.map((ps) => ps.specialty.name).join(", ")}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });
  if (!professional) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Asignar turno
        </h1>
        <p className="mt-2 text-danger">Profesional no encontrado.</p>
      </div>
    );
  }

  const availability = await getAvailability(professionalId);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Asignar turno a {patient.name}
      </h1>
      <p className="mt-1 text-muted">Con {professional.fullName}</p>

      {asignado && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          <span>Turno asignado con éxito.</span>
          {asignadoFecha &&
            (() => {
              const d = new Date(asignadoFecha);
              const fecha = `${String(d.getDate()).padStart(2, "0")}/${String(
                d.getMonth() + 1
              ).padStart(2, "0")}`;
              const hora = `${String(d.getHours()).padStart(2, "0")}:${String(
                d.getMinutes()
              ).padStart(2, "0")}`;
              const waLink = buildWhatsAppLink({
                phone: patient.phone,
                template: professional.whatsappMessageTemplate,
                paciente: patient.name,
                fecha,
                hora,
              });
              return waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-success/30 px-3 py-1.5 hover:bg-success-bg"
                >
                  Avisar por WhatsApp
                </a>
              ) : null;
            })()}
        </div>
      )}
      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {availability.map((day) => (
          <div key={day.dateISO}>
            <h3 className="text-sm font-medium text-muted">{day.label}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {day.slots.map((slot) => (
                <form key={slot.iso} action={assignAppointment}>
                  <input type="hidden" name="patientId" value={patientId} />
                  <input
                    type="hidden"
                    name="professionalId"
                    value={professionalId}
                  />
                  <input type="hidden" name="date" value={slot.iso} />
                  <button
                    type="submit"
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent hover:bg-accent hover:text-white"
                  >
                    {slot.time}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
        {availability.length === 0 && (
          <p className="text-sm text-muted">
            No hay turnos disponibles por el momento.
          </p>
        )}
      </div>
    </div>
  );
}
