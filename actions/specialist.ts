"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireSpecialist } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CONSULTORIO_COOKIE } from "@/lib/consultorio";
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
import {
  upsertPatientAntecedents,
  upsertClinicalNoteForAppointment,
} from "@/lib/clinical";
import { saveUploadedDocument } from "@/lib/documents";

export async function setOwnConsultingRoom(formData: FormData) {
  const { professional } = await requireSpecialist();
  const consultingRoom = String(formData.get("consultingRoom") ?? "").trim();

  if (!consultingRoom) {
    redirect("/profesional/consultorio?error=1");
  }

  await prisma.professional.update({
    where: { id: professional.id },
    data: { consultingRoom },
  });

  const cookieStore = await cookies();
  cookieStore.set(CONSULTORIO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/profesional/llamador");
  redirect("/profesional");
}

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

function returnToOrDefault(formData: FormData) {
  const returnTo = formData.get("returnTo");
  return returnTo ? String(returnTo) : "/profesional/sala-espera";
}

export async function markOwnArrived(formData: FormData) {
  const { professional } = await requireSpecialist();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const returnTo = returnToOrDefault(formData);

  await prisma.appointment.updateMany({
    where: { id: appointmentId, professionalId: professional.id, status: "BOOKED" },
    data: { arrivedAt: new Date() },
  });

  revalidateSalaEspera(professional.id);
  redirect(returnTo);
}

export async function markOwnCalled(formData: FormData) {
  const { professional } = await requireSpecialist();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const returnTo = returnToOrDefault(formData);

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
  redirect(returnTo);
}

export async function markOwnCompleted(formData: FormData) {
  const { professional } = await requireSpecialist();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const returnTo = returnToOrDefault(formData);

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
  redirect(returnTo);
}

export async function updateOwnPaymentSettings(formData: FormData) {
  const { professional } = await requireSpecialist();
  const depositAmountRaw = String(formData.get("depositAmount") ?? "").trim();
  const feeAmountRaw = String(formData.get("feeAmount") ?? "").trim();

  await updatePaymentSettingsForProfessional(professional.id, {
    mercadoPagoConnected: formData.get("mercadoPagoConnected") === "on",
    depositAmount: depositAmountRaw ? Number(depositAmountRaw) : null,
    feeAmount: feeAmountRaw ? Number(feeAmountRaw) : null,
  });

  revalidatePath("/profesional/pagos");
  redirect("/profesional/pagos?actualizado=1");
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

export async function updatePatientAntecedentsFromAppointment(formData: FormData) {
  const { professional } = await requireSpecialist();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const historiaPath = `/profesional/turnos/${appointmentId}/historia-clinica`;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appointment || appointment.professionalId !== professional.id) {
    redirect("/profesional/turnos?error=noautorizado");
  }

  await upsertPatientAntecedents(appointment.patientId, {
    allergies: emptyToNull(String(formData.get("allergies") ?? "")),
    chronicConditions: emptyToNull(String(formData.get("chronicConditions") ?? "")),
    currentMedications: emptyToNull(String(formData.get("currentMedications") ?? "")),
    notes: emptyToNull(String(formData.get("antecedentsNotes") ?? "")),
  });

  revalidatePath(historiaPath);
  revalidatePath("/mis-turnos/historia-clinica");
  redirect(`${historiaPath}?actualizado=1`);
}

export async function upsertClinicalNote(formData: FormData) {
  const { professional } = await requireSpecialist();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const historiaPath = `/profesional/turnos/${appointmentId}/historia-clinica`;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appointment || appointment.professionalId !== professional.id) {
    redirect("/profesional/turnos?error=noautorizado");
  }

  await upsertClinicalNoteForAppointment(appointmentId, {
    reason: emptyToNull(String(formData.get("reason") ?? "")),
    diagnosis: emptyToNull(String(formData.get("diagnosis") ?? "")),
    notes: emptyToNull(String(formData.get("notes") ?? "")),
    treatment: emptyToNull(String(formData.get("treatment") ?? "")),
  });

  revalidatePath(historiaPath);
  revalidatePath("/mis-turnos/historia-clinica");
  redirect(`${historiaPath}?guardado=1`);
}

export async function uploadClinicalDocument(formData: FormData) {
  const { professional, user } = await requireSpecialist();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const historiaPath = `/profesional/turnos/${appointmentId}/historia-clinica`;
  const title = String(formData.get("title") ?? "");
  const file = formData.get("file");

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appointment || appointment.professionalId !== professional.id) {
    redirect("/profesional/turnos?error=noautorizado");
  }

  if (!(file instanceof File)) {
    redirect(`${historiaPath}?error=Seleccion%C3%A1%20un%20archivo.`);
  }

  const result = await saveUploadedDocument({
    patientId: appointment.patientId,
    uploadedById: user.id,
    title,
    file: file as File,
  });

  if (!result.ok) {
    redirect(`${historiaPath}?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath(historiaPath);
  revalidatePath("/mis-turnos");
  redirect(`${historiaPath}?subido=1`);
}
