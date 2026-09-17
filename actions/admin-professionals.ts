"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
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

export async function createProfessional(formData: FormData) {
  await requireAdmin();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const institutionId = String(formData.get("institutionId") ?? "") || null;

  if (!fullName) {
    redirect("/admin/profesionales?error=nombre");
  }

  const professional = await prisma.professional.create({
    data: { fullName, bio: bio || null, institutionId },
  });

  revalidatePath("/admin/profesionales");
  redirect(`/admin/profesionales/${professional.id}?creado=1`);
}

export async function updateProfessional(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const active = formData.get("active") === "on";
  const institutionId = String(formData.get("institutionId") ?? "") || null;

  if (!fullName) {
    redirect(`/admin/profesionales/${id}?error=nombre`);
  }

  await prisma.professional.update({
    where: { id },
    data: { fullName, bio: bio || null, active, institutionId },
  });

  revalidatePath("/admin/profesionales");
  revalidatePath(`/admin/profesionales/${id}`);
  revalidatePath(`/profesionales/${id}`);
  revalidatePath("/profesionales");
  redirect(`/admin/profesionales/${id}?actualizado=1`);
}

export async function assignSpecialty(formData: FormData) {
  await requireAdmin();
  const professionalId = String(formData.get("professionalId") ?? "");
  const specialtyId = String(formData.get("specialtyId") ?? "");

  if (!specialtyId) {
    redirect(`/admin/profesionales/${professionalId}`);
  }

  await prisma.professionalSpecialty.upsert({
    where: {
      professionalId_specialtyId: { professionalId, specialtyId },
    },
    update: {},
    create: { professionalId, specialtyId },
  });

  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  revalidatePath("/profesionales");
  redirect(`/admin/profesionales/${professionalId}`);
}

export async function removeSpecialty(formData: FormData) {
  await requireAdmin();
  const professionalId = String(formData.get("professionalId") ?? "");
  const specialtyId = String(formData.get("specialtyId") ?? "");

  await prisma.professionalSpecialty.delete({
    where: {
      professionalId_specialtyId: { professionalId, specialtyId },
    },
  });

  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  revalidatePath("/profesionales");
  redirect(`/admin/profesionales/${professionalId}`);
}

export async function upsertScheduleSlot(formData: FormData) {
  await requireAdmin();
  const professionalId = String(formData.get("professionalId") ?? "");
  const input = {
    dayOfWeek: Number(formData.get("dayOfWeek")),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    slotMinutes: Number(formData.get("slotMinutes") ?? 30),
  };

  if (!isValidScheduleSlotInput(input)) {
    redirect(`/admin/profesionales/${professionalId}?error=horario`);
  }

  await upsertScheduleSlotForProfessional(professionalId, input);

  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/admin/profesionales/${professionalId}`);
}

export async function deleteScheduleSlot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const professionalId = String(formData.get("professionalId") ?? "");

  await deleteScheduleSlotForProfessional(professionalId, id);

  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/admin/profesionales/${professionalId}`);
}

export async function createExtraDay(formData: FormData) {
  await requireAdmin();
  const professionalId = String(formData.get("professionalId") ?? "");
  const input = {
    date: new Date(String(formData.get("date") ?? "")),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    slotMinutes: Number(formData.get("slotMinutes") ?? 30),
  };

  if (!isValidExtraDayInput(input)) {
    redirect(`/admin/profesionales/${professionalId}?error=diaadicional`);
  }

  await createExtraDayForProfessional(professionalId, input);

  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/admin/profesionales/${professionalId}`);
}

export async function deleteExtraDay(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const professionalId = String(formData.get("professionalId") ?? "");

  await deleteExtraDayForProfessional(professionalId, id);

  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/admin/profesionales/${professionalId}`);
}

export async function createLicense(formData: FormData) {
  await requireAdmin();
  const professionalId = String(formData.get("professionalId") ?? "");
  const input = {
    startDate: new Date(String(formData.get("startDate") ?? "")),
    endDate: new Date(String(formData.get("endDate") ?? "")),
    reason: String(formData.get("reason") ?? "").trim() || null,
  };

  if (!isValidLicenseInput(input)) {
    redirect(`/admin/profesionales/${professionalId}?error=licencia`);
  }

  await createLicenseForProfessional(professionalId, input);

  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/admin/profesionales/${professionalId}`);
}

export async function deleteLicense(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const professionalId = String(formData.get("professionalId") ?? "");

  await deleteLicenseForProfessional(professionalId, id);

  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/admin/profesionales/${professionalId}`);
}

export async function updateMessages(formData: FormData) {
  await requireAdmin();
  const professionalId = String(formData.get("professionalId") ?? "");

  await updateMessagesForProfessional(professionalId, {
    bookingMessage: String(formData.get("bookingMessage") ?? "").trim() || null,
    cancelMessage: String(formData.get("cancelMessage") ?? "").trim() || null,
    whatsappMessageTemplate:
      String(formData.get("whatsappMessageTemplate") ?? "").trim() || null,
  });

  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/admin/profesionales/${professionalId}?actualizado=1`);
}

export async function updatePaymentSettings(formData: FormData) {
  await requireAdmin();
  const professionalId = String(formData.get("professionalId") ?? "");
  const depositAmountRaw = String(formData.get("depositAmount") ?? "").trim();
  const feeAmountRaw = String(formData.get("feeAmount") ?? "").trim();

  await updatePaymentSettingsForProfessional(professionalId, {
    mercadoPagoConnected: formData.get("mercadoPagoConnected") === "on",
    depositAmount: depositAmountRaw ? Number(depositAmountRaw) : null,
    feeAmount: feeAmountRaw ? Number(feeAmountRaw) : null,
  });

  revalidatePath(`/admin/profesionales/${professionalId}`);
  redirect(`/admin/profesionales/${professionalId}?actualizado=1`);
}

export async function grantPortalAccess(formData: FormData) {
  await requireAdmin();
  const professionalId = String(formData.get("professionalId") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@") || !password || password.length < 6) {
    redirect(`/admin/profesionales/${professionalId}?error=acceso`);
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });
  if (!professional || professional.userId) {
    redirect(`/admin/profesionales/${professionalId}?error=acceso`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(`/admin/profesionales/${professionalId}?error=emailexistente`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const fullName = professional.fullName;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: fullName,
        email,
        passwordHash,
        role: "SPECIALIST",
      },
    });
    await tx.professional.update({
      where: { id: professionalId },
      data: { userId: user.id },
    });
  });

  revalidatePath(`/admin/profesionales/${professionalId}`);
  redirect(`/admin/profesionales/${professionalId}?accesoCreado=1`);
}
