import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseDateOnlyLocal } from "@/lib/dates";

function slugifyUsernameBase(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Acceso automático del profesional: usuario = apellido, contraseña =
// apellido en minúscula + "1234" (se lo comunica quien crea la ficha). Si el
// apellido ya está en uso, se le agrega un número al final.
export async function generateProfessionalCredentials(lastName: string) {
  const base = slugifyUsernameBase(lastName) || "profesional";
  let username = base;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    suffix += 1;
    username = `${base}${suffix}`;
  }
  const rawPassword = `${base}1234`;
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  return { username, rawPassword, passwordHash };
}

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

export type ProfessionalIdentityInput = {
  mp: string | null;
  mn: string | null;
  dni: string | null;
  birthDate: Date | null;
};

// MP (matrícula provincial), MN (matrícula nacional), DNI y fecha de
// nacimiento: todos opcionales, se completan al crear el profesional o
// después desde "Datos generales".
export function parseProfessionalIdentityInput(
  formData: FormData
): ProfessionalIdentityInput {
  const mp = String(formData.get("mp") ?? "").trim();
  const mn = String(formData.get("mn") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();
  const birthDateRaw = String(formData.get("birthDate") ?? "").trim();

  return {
    mp: mp || null,
    mn: mn || null,
    dni: dni || null,
    birthDate: birthDateRaw ? parseDateOnlyLocal(birthDateRaw) : null,
  };
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
