"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAppointmentStaff } from "@/lib/auth-helpers";
import { appointmentInInstitution } from "@/lib/institution-scope";
import { rescheduleBooking } from "@/lib/booking";
import type { AppRole } from "@/types/roles";

function redirectBaseFor(role: AppRole) {
  if (role === "MANAGER") return "/encargado/turnos";
  if (role === "SECRETARY") return "/secretaria/turnos";
  return "/admin/turnos";
}

function revalidateTurnosPaths() {
  revalidatePath("/admin/turnos");
  revalidatePath("/encargado/turnos");
  revalidatePath("/secretaria/turnos");
}

export async function markArrived(formData: FormData) {
  const { user, institutionId } = await requireAppointmentStaff();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const base = redirectBaseFor(user.role);

  if (
    institutionId &&
    !(await appointmentInInstitution(appointmentId, institutionId))
  ) {
    redirect(`${base}?error=noautorizado`);
  }

  await prisma.appointment.updateMany({
    where: { id: appointmentId, status: "BOOKED" },
    data: { arrivedAt: new Date() },
  });

  revalidateTurnosPaths();
  redirect(`${base}?llegada=1`);
}

export async function rescheduleAppointment(formData: FormData) {
  const { user, institutionId } = await requireAppointmentStaff();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const dateISO = String(formData.get("date") ?? "");
  const base = redirectBaseFor(user.role);
  const reprogramarPath = `${base}/${appointmentId}/reprogramar`;

  if (
    institutionId &&
    !(await appointmentInInstitution(appointmentId, institutionId))
  ) {
    redirect(`${base}?error=noautorizado`);
  }

  const result = await rescheduleBooking({
    appointmentId,
    newDate: new Date(dateISO),
  });

  if (!result.ok) {
    redirect(`${reprogramarPath}?error=${result.reason}`);
  }

  revalidateTurnosPaths();
  redirect(`${base}?reprogramado=1`);
}
