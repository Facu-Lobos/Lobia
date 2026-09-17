import "server-only";
import { prisma } from "@/lib/prisma";
import { isSlotAvailableForBooking } from "@/lib/availability";
import { sendBookingConfirmation } from "@/lib/appointment-notifications";

export type CreateBookingResult =
  | { ok: true; appointmentId: string }
  | { ok: false; reason: "invalido" | "ocupado" };

export async function createBooking({
  professionalId,
  patientId,
  date,
}: {
  professionalId: string;
  patientId: string;
  date: Date;
}): Promise<CreateBookingResult> {
  if (!professionalId || Number.isNaN(date.getTime())) {
    return { ok: false, reason: "invalido" };
  }

  if (date.getTime() <= Date.now()) {
    return { ok: false, reason: "invalido" };
  }

  const available = await isSlotAvailableForBooking(professionalId, date);
  if (!available) {
    return { ok: false, reason: "invalido" };
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findFirst({
        where: { professionalId, date, status: "BOOKED" },
      });
      if (existing) {
        throw new Error("OCUPADO");
      }
      return tx.appointment.create({
        data: { professionalId, patientId, date },
        include: { patient: true, professional: true },
      });
    });

    await sendBookingConfirmation({
      patientEmail: appointment.patient.email,
      patientName: appointment.patient.name,
      professionalName: appointment.professional.fullName,
      date: appointment.date,
    });

    return { ok: true, appointmentId: appointment.id };
  } catch {
    return { ok: false, reason: "ocupado" };
  }
}

export type RescheduleBookingResult =
  | { ok: true }
  | { ok: false; reason: "invalido" | "ocupado" | "no_encontrado" };

export async function rescheduleBooking({
  appointmentId,
  newDate,
}: {
  appointmentId: string;
  newDate: Date;
}): Promise<RescheduleBookingResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appointment || appointment.status !== "BOOKED") {
    return { ok: false, reason: "no_encontrado" };
  }

  if (Number.isNaN(newDate.getTime()) || newDate.getTime() <= Date.now()) {
    return { ok: false, reason: "invalido" };
  }

  const available = await isSlotAvailableForBooking(
    appointment.professionalId,
    newDate
  );
  if (!available) {
    return { ok: false, reason: "invalido" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findFirst({
        where: {
          professionalId: appointment.professionalId,
          date: newDate,
          status: "BOOKED",
          id: { not: appointmentId },
        },
      });
      if (existing) {
        throw new Error("OCUPADO");
      }
      // Al reprogramar, una llegada marcada contra el horario viejo ya no
      // tiene sentido: se resetea.
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { date: newDate, arrivedAt: null },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "ocupado" };
  }
}
