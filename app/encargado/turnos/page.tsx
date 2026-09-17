import Link from "next/link";
import { requireManager } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { cancelAppointment } from "@/actions/appointments";
import { markArrived } from "@/actions/appointment-management";
import { generateInvoice } from "@/actions/invoices";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { AppointmentCalendar, parseMonthParam } from "@/components/AppointmentCalendar";

const ERROR_MESSAGES: Record<string, string> = {
  noautorizado: "Ese turno no pertenece a tu institución.",
};

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

export default async function EncargadoTurnosPage({
  searchParams,
}: {
  searchParams: Promise<{
    cancelado?: string;
    llegada?: string;
    reprogramado?: string;
    error?: string;
    month?: string;
  }>;
}) {
  const { institutionId } = await requireManager();
  const {
    cancelado,
    llegada,
    reprogramado,
    error,
    month: monthParamValue,
  } = await searchParams;

  const month = parseMonthParam(monthParamValue);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  const [appointments, monthAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: { professional: { institutionId } },
      include: { professional: true, patient: true, invoice: true },
      orderBy: { date: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        professional: { institutionId },
        date: { gte: monthStart, lt: monthEnd },
      },
      include: { professional: true, patient: true, invoice: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.status === "BOOKED" && a.date > now
  );
  const others = appointments.filter(
    (a) => a.status !== "BOOKED" || a.date <= now
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Turnos</h1>

      {(cancelado || llegada || reprogramado) && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          {cancelado && "Turno cancelado."}
          {llegada && "Llegada registrada."}
          {reprogramado && "Turno reprogramado."}
        </p>
      )}
      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <section className="mt-6">
        <AppointmentCalendar
          appointments={monthAppointments.map((a) => ({
            id: a.id,
            date: a.date,
            status: a.status,
            arrivedAt: a.arrivedAt,
            label: `${a.professional.fullName} — ${a.patient.name}`,
          }))}
          month={month}
          basePath="/encargado/turnos"
        />
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Próximos</h2>
        <div className="mt-3 space-y-2">
          {upcoming.map((a) => {
            const { fecha, hora } = formatDateParts(a.date);
            const waLink = buildWhatsAppLink({
              phone: a.patient.phone,
              template: a.professional.whatsappMessageTemplate,
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
                  <p className="font-medium">
                    {a.professional.fullName} — {a.patient.name}
                  </p>
                  <p className="text-muted">
                    {formatDate(a.date)} · {a.patient.email}
                    {a.arrivedAt && (
                      <span className="ml-2 text-success">
                        · Llegó a las{" "}
                        {String(a.arrivedAt.getHours()).padStart(2, "0")}:
                        {String(a.arrivedAt.getMinutes()).padStart(2, "0")}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                  {!a.arrivedAt && (
                    <form action={markArrived}>
                      <input type="hidden" name="appointmentId" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-3 py-1.5 hover:border-primary"
                      >
                        Marcar llegada
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/encargado/turnos/${a.id}/reprogramar`}
                    className="rounded-md border border-border px-3 py-1.5 hover:border-primary"
                  >
                    Reprogramar
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
            <p className="text-sm text-muted">No hay turnos próximos.</p>
          )}
        </div>
      </section>

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="font-medium">Historial</h2>
          <div className="mt-3 space-y-2">
            {others.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface/60 px-4 py-3 text-sm opacity-70"
              >
                <div>
                  <p className="font-medium">
                    {a.professional.fullName} — {a.patient.name}
                  </p>
                  <p className="text-muted">{formatDate(a.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {a.status !== "CANCELLED" && (
                    <>
                      {a.invoice ? (
                        <Link
                          href={`/encargado/facturacion/${a.invoice.id}`}
                          className="rounded-md border border-border px-2 py-1 text-xs opacity-100 hover:border-primary"
                        >
                          Ver comprobante
                        </Link>
                      ) : (
                        <form action={generateInvoice}>
                          <input type="hidden" name="appointmentId" value={a.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-border px-2 py-1 text-xs opacity-100 hover:border-primary"
                          >
                            Generar comprobante
                          </button>
                        </form>
                      )}
                    </>
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
