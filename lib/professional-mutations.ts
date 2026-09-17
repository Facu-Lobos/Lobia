import "server-only";
import { prisma } from "@/lib/prisma";

export type ScheduleSlotInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

export function isValidScheduleSlotInput(input: ScheduleSlotInput): boolean {
  return (
    !Number.isNaN(input.dayOfWeek) &&
    input.dayOfWeek >= 0 &&
    input.dayOfWeek <= 6 &&
    !!input.startTime &&
    !!input.endTime &&
    input.startTime < input.endTime &&
    !Number.isNaN(input.slotMinutes) &&
    input.slotMinutes > 0
  );
}

// deleteMany/updateMany con where compuesto {id, professionalId}: aunque el
// caller sea un especialista (id de fila potencialmente manipulable en el
// form), nunca puede afectar la fila de otro profesional.

export async function upsertScheduleSlotForProfessional(
  professionalId: string,
  input: ScheduleSlotInput
) {
  await prisma.scheduleSlot.create({
    data: { professionalId, ...input },
  });
}

export async function deleteScheduleSlotForProfessional(
  professionalId: string,
  scheduleSlotId: string
) {
  await prisma.scheduleSlot.deleteMany({
    where: { id: scheduleSlotId, professionalId },
  });
}

// Normaliza una fecha a medianoche local. Usado para ExtraDay.date y
// License.startDate/endDate, siempre en ese formato (ver comentarios en
// prisma/schema.prisma).
export function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type ExtraDayInput = {
  date: Date;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

export function isValidExtraDayInput(input: ExtraDayInput): boolean {
  return (
    !Number.isNaN(input.date.getTime()) &&
    !!input.startTime &&
    !!input.endTime &&
    input.startTime < input.endTime &&
    !Number.isNaN(input.slotMinutes) &&
    input.slotMinutes > 0
  );
}

export async function createExtraDayForProfessional(
  professionalId: string,
  input: ExtraDayInput
) {
  await prisma.extraDay.create({
    data: { professionalId, ...input, date: toMidnight(input.date) },
  });
}

export async function deleteExtraDayForProfessional(
  professionalId: string,
  extraDayId: string
) {
  await prisma.extraDay.deleteMany({
    where: { id: extraDayId, professionalId },
  });
}

export type LicenseInput = {
  startDate: Date;
  endDate: Date;
  reason: string | null;
};

export function isValidLicenseInput(input: LicenseInput): boolean {
  return (
    !Number.isNaN(input.startDate.getTime()) &&
    !Number.isNaN(input.endDate.getTime()) &&
    toMidnight(input.startDate).getTime() <=
      toMidnight(input.endDate).getTime()
  );
}

export async function createLicenseForProfessional(
  professionalId: string,
  input: LicenseInput
) {
  await prisma.license.create({
    data: {
      professionalId,
      startDate: toMidnight(input.startDate),
      endDate: toMidnight(input.endDate),
      reason: input.reason,
    },
  });
}

export async function deleteLicenseForProfessional(
  professionalId: string,
  licenseId: string
) {
  await prisma.license.deleteMany({
    where: { id: licenseId, professionalId },
  });
}

export type MessagesInput = {
  bookingMessage: string | null;
  cancelMessage: string | null;
  whatsappMessageTemplate: string | null;
};

export async function updateMessagesForProfessional(
  professionalId: string,
  input: MessagesInput
) {
  await prisma.professional.updateMany({
    where: { id: professionalId },
    data: input,
  });
}

export type PaymentSettingsInput = {
  mercadoPagoConnected: boolean;
  depositAmount: number | null;
  feeAmount: number | null;
};

export async function updatePaymentSettingsForProfessional(
  professionalId: string,
  input: PaymentSettingsInput
) {
  await prisma.professional.updateMany({
    where: { id: professionalId },
    data: input,
  });
}
