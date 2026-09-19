import Link from "next/link";
import type { DaySlot } from "@/lib/availability";
import type { NomencladorOption } from "@/lib/nomenclador";
import { ChargeButton } from "@/components/ChargeButton";
import { AssignSlotButton } from "@/components/AssignSlotButton";

type QueueAction = (formData: FormData) => void | Promise<void>;

export type BillingConfig = {
  nomencladores: NomencladorOption[];
  chargesByAppointmentId: Record<string, number>;
};

export type AssignmentConfig = {
  professionalId: string;
  professionalName: string;
  dayLabel: string;
};

function StatusBadge({ slot }: { slot: DaySlot }) {
  const a = slot.appointment;
  if (!a) {
    return <span className="text-muted">Disponible</span>;
  }
  if (a.status === "CANCELLED") {
    return <span className="text-muted line-through">Cancelado</span>;
  }
  if (a.completedAt) {
    return <span className="text-success">Atendido</span>;
  }
  if (a.calledAt) {
    return <span className="text-primary">En consulta</span>;
  }
  if (a.arrivedAt) {
    return <span className="text-primary">Esperando</span>;
  }
  return <span className="text-muted">Pendiente</span>;
}

function ActionButton({
  slot,
  returnTo,
  markArrivedAction,
  markCalledAction,
  markCompletedAction,
}: {
  slot: DaySlot;
  returnTo: string;
  markArrivedAction?: QueueAction;
  markCalledAction: QueueAction;
  markCompletedAction: QueueAction;
}) {
  const a = slot.appointment;
  if (!a || a.status === "CANCELLED" || a.completedAt) return null;

  let label: string;
  let action: QueueAction;
  if (a.calledAt) {
    label = "Finalizar";
    action = markCompletedAction;
  } else if (a.arrivedAt) {
    label = "Llamar";
    action = markCalledAction;
  } else if (markArrivedAction) {
    label = "Marcar llegada";
    action = markArrivedAction;
  } else {
    return null;
  }

  return (
    <form action={action}>
      <input type="hidden" name="appointmentId" value={a.id} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        className="rounded-md border border-border px-2 py-1 text-xs hover:border-primary"
      >
        {label}
      </button>
    </form>
  );
}

// Grilla horaria del día para un profesional: una fila por slot de su
// horario (ocupado o libre), como el "libro de turnos" de un consultorio.
export function DaySlotGrid({
  slots,
  returnTo,
  markArrivedAction,
  markCalledAction,
  markCompletedAction,
  getPatientHref,
  billing,
  assignment,
}: {
  slots: DaySlot[];
  returnTo: string;
  markArrivedAction?: QueueAction;
  markCalledAction: QueueAction;
  markCompletedAction: QueueAction;
  // Sólo el profesional linkea el nombre del paciente a su historia
  // clínica; el resto de los roles (secretaría, encargado, admin) lo
  // muestran como texto plano.
  getPatientHref?: (slot: DaySlot) => string | undefined;
  // Secretaría/encargado/admin: click en el paciente abre el modal de
  // cobro por nomenclador.
  billing?: BillingConfig;
  // Secretaría/encargado/admin: click en una casilla vacía abre el modal
  // de asignar turno, precargado con este profesional/fecha/hora.
  assignment?: AssignmentConfig;
}) {
  if (slots.length === 0) {
    return (
      <p className="py-6 text-sm text-muted">
        Este profesional no tiene horario cargado para este día.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-muted">
            <th className="px-3 py-2">Hora</th>
            <th className="px-3 py-2">Paciente</th>
            <th className="px-3 py-2">Obra social</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {slots.map((slot) => {
            const href = slot.appointment ? getPatientHref?.(slot) : undefined;
            return (
              <tr
                key={slot.iso}
                className={slot.appointment ? "" : "text-muted/70"}
              >
                <td className="px-3 py-2 font-medium">{slot.time}</td>
                <td className="px-3 py-2">
                  {slot.appointment ? (
                    billing && slot.appointment.status !== "CANCELLED" ? (
                      <ChargeButton
                        appointmentId={slot.appointment.id}
                        patientName={slot.appointment.patientName}
                        healthInsurance={slot.appointment.healthInsurance}
                        nomencladores={billing.nomencladores}
                        chargedAmount={billing.chargesByAppointmentId[slot.appointment.id]}
                      />
                    ) : href ? (
                      <Link
                        href={href}
                        className="text-primary hover:underline"
                      >
                        {slot.appointment.patientName}
                      </Link>
                    ) : (
                      slot.appointment.patientName
                    )
                  ) : assignment ? (
                    <AssignSlotButton
                      professionalId={assignment.professionalId}
                      professionalName={assignment.professionalName}
                      dayLabel={assignment.dayLabel}
                      time={slot.time}
                      dateIso={slot.iso}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  {slot.appointment?.healthInsurance ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge slot={slot} />
                </td>
                <td className="px-3 py-2">
                  <ActionButton
                    slot={slot}
                    returnTo={returnTo}
                    markArrivedAction={markArrivedAction}
                    markCalledAction={markCalledAction}
                    markCompletedAction={markCompletedAction}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
