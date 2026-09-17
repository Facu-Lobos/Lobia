export type QueueAppointment = {
  id: string;
  date: Date;
  patientName: string;
  professionalName?: string;
  arrivedAt: Date | null;
  calledAt: Date | null;
  completedAt: Date | null;
};

type QueueAction = (formData: FormData) => void | Promise<void>;

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function QueueCard({
  appointment,
  returnTo,
  action,
  actionLabel,
  actionClassName,
}: {
  appointment: QueueAppointment;
  returnTo: string;
  action?: QueueAction;
  actionLabel?: string;
  actionClassName?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
      <p className="font-medium">{appointment.patientName}</p>
      <p className="text-muted">
        {formatTime(appointment.date)}
        {appointment.professionalName && ` · ${appointment.professionalName}`}
      </p>
      {action && actionLabel && (
        <form action={action} className="mt-2">
          <input type="hidden" name="appointmentId" value={appointment.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            type="submit"
            className={
              actionClassName ??
              "w-full rounded-md border border-border px-2 py-1 text-xs hover:border-primary"
            }
          >
            {actionLabel}
          </button>
        </form>
      )}
    </div>
  );
}

// Vista de "sala de espera": agrupa los turnos de hoy en 4 columnas según su
// avance (llegó / lo llamaron / terminó) para dar visibilidad en vivo del
// estado de la recepción, sin necesitar websockets (se refresca con AutoRefresh).
export function WaitingRoom({
  appointments,
  returnTo,
  markArrivedAction,
  markCalledAction,
  markCompletedAction,
}: {
  appointments: QueueAppointment[];
  returnTo: string;
  markArrivedAction?: QueueAction;
  markCalledAction: QueueAction;
  markCompletedAction: QueueAction;
}) {
  const pending = appointments.filter((a) => !a.arrivedAt);
  const waiting = appointments.filter((a) => a.arrivedAt && !a.calledAt);
  const inConsultation = appointments.filter(
    (a) => a.calledAt && !a.completedAt
  );
  const done = appointments.filter((a) => a.completedAt);

  const columns: {
    title: string;
    items: QueueAppointment[];
    action?: QueueAction;
    actionLabel?: string;
    actionClassName?: string;
  }[] = [
    {
      title: "Pendientes",
      items: pending,
      action: markArrivedAction,
      actionLabel: "Marcar llegada",
    },
    {
      title: "Esperando",
      items: waiting,
      action: markCalledAction,
      actionLabel: "Llamar",
      actionClassName:
        "w-full rounded-md border border-primary/30 px-2 py-1 text-xs text-primary hover:bg-primary-soft",
    },
    {
      title: "En consulta",
      items: inConsultation,
      action: markCompletedAction,
      actionLabel: "Finalizar",
      actionClassName:
        "w-full rounded-md border border-success/30 px-2 py-1 text-xs text-success hover:bg-success-bg",
    },
    {
      title: "Atendidos",
      items: done,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => (
        <div key={col.title}>
          <h3 className="text-sm font-medium text-muted">
            {col.title} ({col.items.length})
          </h3>
          <div className="mt-2 space-y-2">
            {col.items.map((a) => (
              <QueueCard
                key={a.id}
                appointment={a}
                returnTo={returnTo}
                action={col.action}
                actionLabel={col.actionLabel}
                actionClassName={col.actionClassName}
              />
            ))}
            {col.items.length === 0 && (
              <p className="text-xs text-muted">Sin turnos.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
