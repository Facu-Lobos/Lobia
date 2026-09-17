import Link from "next/link";
import { requireSpecialist } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { cancelAppointment } from "@/actions/appointments";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { AppointmentCalendar, parseMonthParam } from "@/components/AppointmentCalendar";

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

function formatDateParts(date: Date) {
  return {
    fecha: `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`,
    hora: `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`,
  };
}

export default async function ProfesionalTurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelado?: string; month?: string }>;
}) {
  const { professional } = await requireSpecialist();
  const { cancelado, month: monthParamValue } = await searchParams;

  const month = parseMonthParam(monthParamValue);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  const [appointments, monthAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: { professionalId: professional.id },
      include: { patient: true },
      orderBy: { date: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        professionalId: professional.id,
        date: { gte: monthStart, lt: monthEnd },
      },
      include: { patient: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.status === "BOOKED" && a.date > now
  );
  const past = appointments.filter(
    (a) => a.status !== "BOOKED" || a.date <= now
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Mis turnos</h1>

      {cancelado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Turno cancelado.
        </p>
      )}

      <section className="mt-6">
        <AppointmentCalendar
          appointments={monthAppointments.map((a) => ({
            id: a.id,
            date: a.date,
            status: a.status,
            arrivedAt: a.arrivedAt,
            label: a.patient.name,
          }))}
          month={month}
          basePath="/profesional/turnos"
        />
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Próximos</h2>
        <div className="mt-3 space-y-2">
          {upcoming.map((a) => {
            const { fecha, hora } = formatDateParts(a.date);
            const waLink = buildWhatsAppLink({
              phone: a.patient.phone,
              template: professional.whatsappMessageTemplate,
              paciente: a.patient.name,
              fecha,
              hora,
            });
            return (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{a.patient.name}</p>
                  <p className="text-muted">
                    {formatDate(a.date)} · {a.patient.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-success/30 px-3 py-1.5 text-success hover:bg-success-bg"
                    >
                      WhatsApp
                    </a>
                  )}
                  <Link
                    href={`/profesional/turnos/${a.id}/historia-clinica`}
                    className="rounded-md border border-border px-3 py-1.5 hover:border-primary"
                  >
                    Historia clínica
                  </Link>
                  <form action={cancelAppointment}>
                    <input type="hidden" name="appointmentId" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-danger/30 px-3 py-1.5 text-danger hover:bg-danger-bg"
                    >
                      Cancelar
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
          {upcoming.length === 0 && (
            <p className="text-sm text-muted">No tenés turnos próximos.</p>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="font-medium">Historial</h2>
          <div className="mt-3 space-y-2">
            {past.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface/60 px-4 py-3 text-sm opacity-70"
              >
                <div>
                  <p className="font-medium">{a.patient.name}</p>
                  <p className="text-muted">{formatDate(a.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {a.status !== "CANCELLED" && (
                    <Link
                      href={`/profesional/turnos/${a.id}/historia-clinica`}
                      className="rounded-md border border-border px-3 py-1.5 opacity-100 hover:border-primary"
                    >
                      Historia clínica
                    </Link>
                  )}
                  <span>
                    {a.status === "CANCELLED" ? "Cancelado" : "Realizado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
