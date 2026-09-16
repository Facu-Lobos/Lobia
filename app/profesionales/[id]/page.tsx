import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAvailability } from "@/lib/availability";
import { bookAppointment } from "@/actions/appointments";

const ERROR_MESSAGES: Record<string, string> = {
  ocupado: "Ese horario ya fue reservado por otra persona. Elegí otro.",
  invalido: "El horario seleccionado ya no es válido. Elegí otro.",
};

export default async function ProfesionalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const professional = await prisma.professional.findUnique({
    where: { id, active: true },
    include: {
      specialties: { include: { specialty: true } },
    },
  });

  if (!professional) {
    notFound();
  }

  const availability = await getAvailability(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        {professional.fullName}
      </h1>
      <p className="mt-1 text-accent">
        {professional.specialties.map((ps) => ps.specialty.name).join(", ")}
      </p>

      {professional.bio && (
        <p className="mt-4 text-foreground/80">{professional.bio}</p>
      )}

      {professional.bookingMessage && (
        <p className="mt-4 rounded-md bg-primary-soft px-4 py-3 text-sm text-foreground">
          {professional.bookingMessage}
        </p>
      )}

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-6 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <div className="mt-8">
        <h2 className="font-medium">Turnos disponibles</h2>

        {availability.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            No hay turnos disponibles por el momento.
          </p>
        )}

        <div className="mt-4 space-y-6">
          {availability.map((day) => (
            <div key={day.dateISO}>
              <h3 className="text-sm font-medium text-muted">{day.label}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {day.slots.map((slot) => (
                  <form key={slot.iso} action={bookAppointment}>
                    <input
                      type="hidden"
                      name="professionalId"
                      value={professional.id}
                    />
                    <input type="hidden" name="date" value={slot.iso} />
                    <button
                      type="submit"
                      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:border-accent hover:bg-accent hover:text-white"
                    >
                      {slot.time}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
