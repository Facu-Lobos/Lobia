"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth-helpers";
import { professionalInInstitution } from "@/lib/institution-scope";
import { createSecretaryUser, isValidUsername } from "@/lib/staff";
import { createPatientUser } from "@/lib/patients";
import { saveUploadedDocument } from "@/lib/documents";
import { parseDateOnlyLocal } from "@/lib/dates";
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
  parseProfessionalIdentityInput,
  generateProfessionalCredentials,
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
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const identity = parseProfessionalIdentityInput(formData);
  const specialtyId = String(formData.get("specialtyId") ?? "").trim();

  if (!firstName || !lastName) {
    redirect("/encargado/profesionales?error=nombre");
  }

  const scheduleInput = {
    dayOfWeek: Number(formData.get("dayOfWeek")),
    startTime: String(formData.get("startTime") ?? "").trim(),
    endTime: String(formData.get("endTime") ?? "").trim(),
    slotMinutes: Number(formData.get("slotMinutes") ?? 30),
  };
  const hasSchedule = !!scheduleInput.startTime && !!scheduleInput.endTime;
  if (hasSchedule && !isValidScheduleSlotInput(scheduleInput)) {
    redirect("/encargado/profesionales?error=horario");
  }

  // El profesional entra sin email: usuario = apellido, contraseña =
  // apellido en minúscula + "1234" (ver generateProfessionalCredentials).
  const { username, rawPassword, passwordHash } =
    await generateProfessionalCredentials(lastName);

  const professional = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: fullName, username, passwordHash, role: "SPECIALIST" },
    });
    return tx.professional.create({
      data: {
        fullName,
        bio: bio || null,
        institution: institutionId ? { connect: { id: institutionId } } : undefined,
        user: { connect: { id: user.id } },
        ...identity,
        ...(specialtyId ? { specialties: { create: { specialtyId } } } : {}),
        ...(hasSchedule ? { schedules: { create: scheduleInput } } : {}),
      },
    });
  });

  revalidatePath("/encargado/profesionales");
  redirect(
    `/encargado/profesionales/${professional.id}?creado=1&usuario=${encodeURIComponent(username)}&clave=${encodeURIComponent(rawPassword)}`
  );
}

export async function updateProfessional(formData: FormData) {
  const { institutionId } = await requireManager();
  const id = String(formData.get("id") ?? "");
  await assertOwnProfessional(id, institutionId);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const active = formData.get("active") === "on";
  const consultingRoom = String(formData.get("consultingRoom") ?? "").trim();
  const identity = parseProfessionalIdentityInput(formData);

  if (!fullName) {
    redirect(`/encargado/profesionales/${id}?error=nombre`);
  }

  await prisma.professional.update({
    where: { id },
    data: {
      fullName,
      bio: bio || null,
      active,
      consultingRoom: consultingRoom || null,
      ...identity,
    },
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

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isValidUsername(username) || !password || password.length < 6) {
    redirect(`/encargado/profesionales/${professionalId}?error=acceso`);
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });
  if (!professional || professional.userId) {
    redirect(`/encargado/profesionales/${professionalId}?error=acceso`);
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    redirect(`/encargado/profesionales/${professionalId}?error=usuarioexistente`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const fullName = professional.fullName;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: fullName,
        username,
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

export async function createPatient(formData: FormData) {
  await requireManager();

  const birthDateRaw = String(formData.get("birthDate") ?? "").trim();

  const result = await createPatientUser({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    dni: String(formData.get("dni") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    birthDate: birthDateRaw ? parseDateOnlyLocal(birthDateRaw) : null,
    healthInsurance: String(formData.get("healthInsurance") ?? ""),
    healthInsuranceNumber: String(formData.get("healthInsuranceNumber") ?? ""),
  });

  if (!result.ok) {
    redirect(`/encargado/pacientes?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/encargado/pacientes");
  redirect(
    `/encargado/pacientes?creado=1&usuario=${encodeURIComponent(result.username)}&clave=${encodeURIComponent(result.rawPassword)}`
  );
}

export async function uploadPatientDocument(formData: FormData) {
  const { user } = await requireManager();
  const patientId = String(formData.get("patientId") ?? "");
  const title = String(formData.get("title") ?? "");
  const file = formData.get("file");
  const detailPath = `/encargado/pacientes/${patientId}`;

  if (!(file instanceof File)) {
    redirect(`${detailPath}?error=Seleccion%C3%A1%20un%20archivo.`);
  }

  const result = await saveUploadedDocument({
    patientId,
    uploadedById: user.id,
    title,
    file: file as File,
  });

  if (!result.ok) {
    redirect(`${detailPath}?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath(detailPath);
  revalidatePath("/mis-turnos");
  redirect(`${detailPath}?subido=1`);
}

export async function createSecretaryForInstitution(formData: FormData) {
  const { institutionId } = await requireManager();

  const result = await createSecretaryUser({
    name: String(formData.get("name") ?? ""),
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
    institutionId,
  });

  if (!result.ok) {
    redirect(`/encargado/personal?error=${result.error}`);
  }

  revalidatePath("/encargado/personal");
  redirect("/encargado/personal?creado=1");
}
