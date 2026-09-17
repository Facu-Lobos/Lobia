"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth-helpers";
import { professionalInInstitution } from "@/lib/institution-scope";
import { createSecretaryUser } from "@/lib/staff";
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

async function assertOwnProfessional(
  professionalId: string,
  institutionId: string
) {
  if (!(await professionalInInstitution(professionalId, institutionId))) {
    redirect("/encargado/profesionales?error=noautorizado");
  }
}

export async function createProfessional(formData: FormData) {
  const { institutionId } = await requireManager();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!fullName) {
    redirect("/encargado/profesionales?error=nombre");
  }

  const professional = await prisma.professional.create({
    data: { fullName, bio: bio || null, institutionId },
  });

  revalidatePath("/encargado/profesionales");
  redirect(`/encargado/profesionales/${professional.id}?creado=1`);
}

export async function updateProfessional(formData: FormData) {
  const { institutionId } = await requireManager();
  const id = String(formData.get("id") ?? "");
  await assertOwnProfessional(id, institutionId);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!fullName) {
    redirect(`/encargado/profesionales/${id}?error=nombre`);
  }

  await prisma.professional.update({
    where: { id },
    data: { fullName, bio: bio || null, active },
  });

  revalidatePath("/encargado/profesionales");
  revalidatePath(`/encargado/profesionales/${id}`);
  revalidatePath(`/profesionales/${id}`);
  revalidatePath("/profesionales");
  redirect(`/encargado/profesionales/${id}?actualizado=1`);
}

export async function assignSpecialty(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);
  const specialtyId = String(formData.get("specialtyId") ?? "");

  if (!specialtyId) {
    redirect(`/encargado/profesionales/${professionalId}`);
  }

  await prisma.professionalSpecialty.upsert({
    where: {
      professionalId_specialtyId: { professionalId, specialtyId },
    },
    update: {},
    create: { professionalId, specialtyId },
  });

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  revalidatePath("/profesionales");
  redirect(`/encargado/profesionales/${professionalId}`);
}

export async function removeSpecialty(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);
  const specialtyId = String(formData.get("specialtyId") ?? "");

  await prisma.professionalSpecialty.delete({
    where: {
      professionalId_specialtyId: { professionalId, specialtyId },
    },
  });

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  revalidatePath("/profesionales");
  redirect(`/encargado/profesionales/${professionalId}`);
}

export async function upsertScheduleSlot(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);

  const input = {
    dayOfWeek: Number(formData.get("dayOfWeek")),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    slotMinutes: Number(formData.get("slotMinutes") ?? 30),
  };

  if (!isValidScheduleSlotInput(input)) {
    redirect(`/encargado/profesionales/${professionalId}?error=horario`);
  }

  await upsertScheduleSlotForProfessional(professionalId, input);

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/encargado/profesionales/${professionalId}`);
}

export async function deleteScheduleSlot(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);
  const id = String(formData.get("id") ?? "");

  await deleteScheduleSlotForProfessional(professionalId, id);

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/encargado/profesionales/${professionalId}`);
}

export async function createExtraDay(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);

  const input = {
    date: new Date(String(formData.get("date") ?? "")),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    slotMinutes: Number(formData.get("slotMinutes") ?? 30),
  };

  if (!isValidExtraDayInput(input)) {
    redirect(`/encargado/profesionales/${professionalId}?error=diaadicional`);
  }

  await createExtraDayForProfessional(professionalId, input);

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/encargado/profesionales/${professionalId}`);
}

export async function deleteExtraDay(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);
  const id = String(formData.get("id") ?? "");

  await deleteExtraDayForProfessional(professionalId, id);

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/encargado/profesionales/${professionalId}`);
}

export async function createLicense(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);

  const input = {
    startDate: new Date(String(formData.get("startDate") ?? "")),
    endDate: new Date(String(formData.get("endDate") ?? "")),
    reason: String(formData.get("reason") ?? "").trim() || null,
  };

  if (!isValidLicenseInput(input)) {
    redirect(`/encargado/profesionales/${professionalId}?error=licencia`);
  }

  await createLicenseForProfessional(professionalId, input);

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/encargado/profesionales/${professionalId}`);
}

export async function deleteLicense(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);
  const id = String(formData.get("id") ?? "");

  await deleteLicenseForProfessional(professionalId, id);

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/encargado/profesionales/${professionalId}`);
}

export async function updateMessages(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);

  await updateMessagesForProfessional(professionalId, {
    bookingMessage: String(formData.get("bookingMessage") ?? "").trim() || null,
    cancelMessage: String(formData.get("cancelMessage") ?? "").trim() || null,
    whatsappMessageTemplate:
      String(formData.get("whatsappMessageTemplate") ?? "").trim() || null,
  });

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  revalidatePath(`/profesionales/${professionalId}`);
  redirect(`/encargado/profesionales/${professionalId}?actualizado=1`);
}

export async function updatePaymentSettings(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);
  const depositAmountRaw = String(formData.get("depositAmount") ?? "").trim();
  const feeAmountRaw = String(formData.get("feeAmount") ?? "").trim();

  await updatePaymentSettingsForProfessional(professionalId, {
    mercadoPagoConnected: formData.get("mercadoPagoConnected") === "on",
    depositAmount: depositAmountRaw ? Number(depositAmountRaw) : null,
    feeAmount: feeAmountRaw ? Number(feeAmountRaw) : null,
  });

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  redirect(`/encargado/profesionales/${professionalId}?actualizado=1`);
}

export async function grantPortalAccess(formData: FormData) {
  const { institutionId } = await requireManager();
  const professionalId = String(formData.get("professionalId") ?? "");
  await assertOwnProfessional(professionalId, institutionId);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@") || !password || password.length < 6) {
    redirect(`/encargado/profesionales/${professionalId}?error=acceso`);
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });
  if (!professional || professional.userId) {
    redirect(`/encargado/profesionales/${professionalId}?error=acceso`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(`/encargado/profesionales/${professionalId}?error=emailexistente`);
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

  revalidatePath(`/encargado/profesionales/${professionalId}`);
  redirect(`/encargado/profesionales/${professionalId}?accesoCreado=1`);
}

export async function createSecretaryForInstitution(formData: FormData) {
  const { institutionId } = await requireManager();

  const result = await createSecretaryUser({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    institutionId,
  });

  if (!result.ok) {
    redirect(`/encargado/personal?error=${result.error}`);
  }

  revalidatePath("/encargado/personal");
  redirect("/encargado/personal?creado=1");
}
