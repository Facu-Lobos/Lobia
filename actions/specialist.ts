"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSpecialist } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  isValidScheduleSlotInput,
  upsertScheduleSlotForProfessional,
  deleteScheduleSlotForProfessional,
  isValidExtraDayInput,
  createExtraDayForProfessional,
  deleteExtraDayForProfessional,
  isValidLicenseInput,
  createLicenseForProfessional,
  deleteLicenseForProfessional,
  updateMessagesForProfessional,
  updatePaymentSettingsForProfessional,
} from "@/lib/professional-mutations";

export async function upsertOwnScheduleSlot(formData: FormData) {
  const { professional } = await requireSpecialist();
  const input = {
    dayOfWeek: Number(formData.get("dayOfWeek")),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    slotMinutes: Number(formData.get("slotMinutes") ?? 30),
  };

  if (!isValidScheduleSlotInput(input)) {
    redirect("/profesional/agenda?error=horario");
  }

  await upsertScheduleSlotForProfessional(professional.id, input);

  revalidatePath("/profesional/agenda");
  revalidatePath(`/profesionales/${professional.id}`);
  redirect("/profesional/agenda");
}

export async function deleteOwnScheduleSlot(formData: FormData) {
  const { professional } = await requireSpecialist();
  const id = String(formData.get("id") ?? "");

  await deleteScheduleSlotForProfessional(professional.id, id);

  revalidatePath("/profesional/agenda");
  revalidatePath(`/profesionales/${professional.id}`);
  redirect("/profesional/agenda");
}

export async function createOwnExtraDay(formData: FormData) {
  const { professional } = await requireSpecialist();
  const input = {
    date: new Date(String(formData.get("date") ?? "")),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    slotMinutes: Number(formData.get("slotMinutes") ?? 30),
  };

  if (!isValidExtraDayInput(input)) {
    redirect("/profesional/agenda?error=diaadicional");
  }

  await createExtraDayForProfessional(professional.id, input);

  revalidatePath("/profesional/agenda");
  revalidatePath(`/profesionales/${professional.id}`);
  redirect("/profesional/agenda");
}

export async function deleteOwnExtraDay(formData: FormData) {
  const { professional } = await requireSpecialist();
  const id = String(formData.get("id") ?? "");

  await deleteExtraDayForProfessional(professional.id, id);

  revalidatePath("/profesional/agenda");
  revalidatePath(`/profesionales/${professional.id}`);
  redirect("/profesional/agenda");
}

export async function createOwnLicense(formData: FormData) {
  const { professional } = await requireSpecialist();
  const input = {
    startDate: new Date(String(formData.get("startDate") ?? "")),
    endDate: new Date(String(formData.get("endDate") ?? "")),
    reason: String(formData.get("reason") ?? "").trim() || null,
  };

  if (!isValidLicenseInput(input)) {
    redirect("/profesional/agenda?error=licencia");
  }

  await createLicenseForProfessional(professional.id, input);

  revalidatePath("/profesional/agenda");
  revalidatePath(`/profesionales/${professional.id}`);
  redirect("/profesional/agenda");
}

export async function deleteOwnLicense(formData: FormData) {
  const { professional } = await requireSpecialist();
  const id = String(formData.get("id") ?? "");

  await deleteLicenseForProfessional(professional.id, id);

  revalidatePath("/profesional/agenda");
  revalidatePath(`/profesionales/${professional.id}`);
  redirect("/profesional/agenda");
}

export async function updateOwnMessages(formData: FormData) {
  const { professional } = await requireSpecialist();

  await updateMessagesForProfessional(professional.id, {
    bookingMessage: String(formData.get("bookingMessage") ?? "").trim() || null,
    cancelMessage: String(formData.get("cancelMessage") ?? "").trim() || null,
    whatsappMessageTemplate:
      String(formData.get("whatsappMessageTemplate") ?? "").trim() || null,
  });

  revalidatePath("/profesional/mensajes");
  revalidatePath(`/profesionales/${professional.id}`);
  redirect("/profesional/mensajes?actualizado=1");
}

function revalidateSalaEspera(professionalId: string) {
  revalidatePath("/profesional/sala-espera");
  revalidatePath(`/profesionales/${professionalId}`);
}

export async function markOwnArrived(formData: FormData) {
  const { professional } = await requireSpecialist();
  const appointmentId = String(formData.get("appointmentId") ?? "");

  await prisma.appointment.updateMany({
    where: { id: appointmentId, professionalId: professional.id, status: "BOOKED" },
    data: { arrivedAt: new Date() },
  });

  revalidateSalaEspera(professional.id);
  redirect("/profesional/sala-espera");
}

export async function markOwnCalled(formData: FormData) {
  const { professional } = await requireSpecialist();
  const appointmentId = String(formData.get("appointmentId") ?? "");

  await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      professionalId: professional.id,
      status: "BOOKED",
      arrivedAt: { not: null },
    },
    data: { calledAt: new Date() },
  });

  revalidateSalaEspera(professional.id);
  redirect("/profesional/sala-espera");
}

export async function markOwnCompleted(formData: FormData) {
  const { professional } = await requireSpecialist();
  const appointmentId = String(formData.get("appointmentId") ?? "");

  await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      professionalId: professional.id,
      status: "BOOKED",
      calledAt: { not: null },
    },
    data: { completedAt: new Date() },
  });

  revalidateSalaEspera(professional.id);
  redirect("/profesional/sala-espera");
}

export async function updateOwnPaymentSettings(formData: FormData) {
  const { professional } = await requireSpecialist();
  const depositAmountRaw = String(formData.get("depositAmount") ?? "").trim();

  await updatePaymentSettingsForProfessional(professional.id, {
    mercadoPagoConnected: formData.get("mercadoPagoConnected") === "on",
    depositAmount: depositAmountRaw ? Number(depositAmountRaw) : null,
  });

  revalidatePath("/profesional/pagos");
  redirect("/profesional/pagos?actualizado=1");
}
