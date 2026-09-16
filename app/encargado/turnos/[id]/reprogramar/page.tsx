import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getAvailability } from "@/lib/availability";
import { rescheduleAppointment } from "@/actions/appointment-management";

const ERROR_MESSAGES: Record<string, string> = {
  ocupado: "Ese horario ya fue reservado. Elegí otro.",
  invalido: "El horario seleccionado ya no es válido. Elegí otro.",
  no_encontrado: "El turno ya no existe o fue cancelado.",
};

export default async function ReprogramarTurnoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { institutionId } = await requireManager();
  const { id } = await params;
  const { error } = await searchParams;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { professional: true, patient: true },
  });

  if (!appointment || appointment.professional.institutionId !== institutionId) {
    notFound();
  }

  const availability = await getAvailability(appointment.professionalId);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Reprogramar turno de {appointment.patient.name}
      </h1>
      <p className="mt-1 text-muted">Con {appointment.professional.fullName}</p>

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
                <form key={slot.iso} action={rescheduleAppointment}>
                  <input type="hidden" name="appointmentId" value={appointment.id} />
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
