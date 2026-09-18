"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSecretary } from "@/lib/auth-helpers";
import { createPatientUser } from "@/lib/patients";
import { createBooking } from "@/lib/booking";
import { professionalInInstitution } from "@/lib/institution-scope";
import { saveUploadedDocument } from "@/lib/documents";
import { parseDateOnlyLocal } from "@/lib/dates";

export async function createPatient(formData: FormData) {
  await requireSecretary();

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
    redirect(
      `/secretaria/pacientes?error=${encodeURIComponent(result.error)}`
    );
  }

  revalidatePath("/secretaria/pacientes");
  redirect(
    `/secretaria/pacientes?creado=1&usuario=${encodeURIComponent(result.username)}&clave=${encodeURIComponent(result.rawPassword)}`
  );
}

export async function assignAppointment(formData: FormData) {
  const { institutionId } = await requireSecretary();

  const patientId = String(formData.get("patientId") ?? "");
  const professionalId = String(formData.get("professionalId") ?? "");
  const dateISO = String(formData.get("date") ?? "");
  const date = new Date(dateISO);

  const backTo = `/secretaria/asignar-turno?patientId=${patientId}&professionalId=${professionalId}`;

  if (
    institutionId &&
    !(await professionalInInstitution(professionalId, institutionId))
  ) {
    redirect(`${backTo}&error=invalido`);
  }

  const result = await createBooking({ professionalId, patientId, date });

  if (!result.ok) {
    redirect(`${backTo}&error=${result.reason}`);
  }

  revalidatePath(`/profesionales/${professionalId}`);
  revalidatePath("/mis-turnos");
  revalidatePath("/admin/turnos");
  revalidatePath("/encargado/turnos");
  revalidatePath("/secretaria/turnos");
  redirect(`${backTo}&asignado=1&asignadoFecha=${encodeURIComponent(dateISO)}`);
}

export async function uploadPatientDocument(formData: FormData) {
  const { user } = await requireSecretary();
  const patientId = String(formData.get("patientId") ?? "");
  const title = String(formData.get("title") ?? "");
  const file = formData.get("file");
  const detailPath = `/secretaria/pacientes/${patientId}`;

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
