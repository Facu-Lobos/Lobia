import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { formatAppointmentDate } from "@/lib/appointment-notifications";

// Manda recordatorio por email a los turnos que ocurren dentro de las
// próximas 24hs y todavía no lo recibieron. `reminderSentAt` evita
// duplicados sin importar cada cuánto se dispare este job (ver
// app/api/cron/reminders/route.ts).
export async function sendDueReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const dueAppointments = await prisma.appointment.findMany({
    where: {
      status: "BOOKED",
      reminderSentAt: null,
      date: { gte: now, lte: in24h },
    },
    include: { patient: true, professional: true },
  });

  let sent = 0;
  for (const appointment of dueAppointments) {
    if (!appointment.patient.email) continue;
    await sendEmail({
      to: appointment.patient.email,
      subject: "Recordatorio de tu turno",
      text: `Hola ${appointment.patient.name}, te recordamos tu turno con ${
        appointment.professional.fullName
      } el ${formatAppointmentDate(appointment.date)}.`,
    });

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { reminderSentAt: new Date() },
    });
    sent++;
  }

  return { checked: dueAppointments.length, sent };
}
