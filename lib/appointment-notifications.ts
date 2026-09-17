import "server-only";
import { sendEmail } from "@/lib/email";

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export function formatAppointmentDate(date: Date) {
  return `${DAY_NAMES[date.getDay()]} ${String(date.getDate()).padStart(
    2,
    "0"
  )}/${String(date.getMonth() + 1).padStart(2, "0")} a las ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

type NotificationInput = {
  patientEmail: string;
  patientName: string;
  professionalName: string;
  date: Date;
};

// El envío nunca debe romper el flujo de reserva/cancelación: si falla
// (SMTP caído, credenciales mal puestas, etc.) sólo se loguea.
async function sendSafely(args: Parameters<typeof sendEmail>[0]) {
  try {
    await sendEmail(args);
  } catch (err) {
    console.error("[email] error enviando notificación", err);
  }
}

export function sendBookingConfirmation({
  patientEmail,
  patientName,
  professionalName,
  date,
}: NotificationInput) {
  return sendSafely({
    to: patientEmail,
    subject: "Turno confirmado",
    text: `Hola ${patientName}, tu turno con ${professionalName} quedó confirmado para el ${formatAppointmentDate(
      date
    )}.`,
  });
}

export function sendCancellationNotice({
  patientEmail,
  patientName,
  professionalName,
  date,
}: NotificationInput) {
  return sendSafely({
    to: patientEmail,
    subject: "Turno cancelado",
    text: `Hola ${patientName}, tu turno con ${professionalName} del ${formatAppointmentDate(
      date
    )} fue cancelado.`,
  });
}
