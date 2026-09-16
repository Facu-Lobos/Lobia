"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSecretary } from "@/lib/auth-helpers";
import { createPatientUser } from "@/lib/patients";
import { createBooking } from "@/lib/booking";
import { professionalInInstitution } from "@/lib/institution-scope";

export async function createPatient(formData: FormData) {
  await requireSecretary();

  const result = await createPatientUser({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!result.ok) {
    redirect(
      `/secretaria/pacientes?error=${encodeURIComponent(result.error)}`
    );
  }

  revalidatePath("/secretaria/pacientes");
  redirect("/secretaria/pacientes?creado=1");
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
