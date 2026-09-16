"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { createBooking } from "@/lib/booking";

export async function bookAppointment(formData: FormData) {
  const user = await requireUser();
  const professionalId = String(formData.get("professionalId") ?? "");
  const dateISO = String(formData.get("date") ?? "");
  const date = new Date(dateISO);

  const result = await createBooking({
    professionalId,
    patientId: user.id,
    date,
  });

  if (!result.ok) {
    redirect(`/profesionales/${professionalId}?error=${result.reason}`);
  }

  revalidatePath(`/profesionales/${professionalId}`);
  revalidatePath("/mis-turnos");
  redirect(`/mis-turnos?reservado=1&profesionalId=${professionalId}`);
}

export async function cancelAppointment(formData: FormData) {
  const user = await requireUser();
  const appointmentId = String(formData.get("appointmentId") ?? "");

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { professional: true },
  });

  if (!appointment) {
    redirect("/mis-turnos");
  }

  const isOwner = appointment.patientId === user.id;
  const isAdmin = user.role === "ADMIN";
  let isOwningSpecialist = false;
  let isAuthorizedStaff = false;

  if (user.role === "SPECIALIST") {
    const professional = await prisma.professional.findUnique({
      where: { userId: user.id },
    });
    isOwningSpecialist = professional?.id === appointment.professionalId;
  }

  if (user.role === "MANAGER" || user.role === "SECRETARY") {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    isAuthorizedStaff =
      !!dbUser?.institutionId &&
      dbUser.institutionId === appointment.professional.institutionId;
  }

  if (!isOwner && !isAdmin && !isOwningSpecialist && !isAuthorizedStaff) {
    redirect("/mis-turnos");
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/mis-turnos");
  revalidatePath("/admin/turnos");
  revalidatePath("/encargado/turnos");
  revalidatePath("/secretaria/turnos");
  revalidatePath("/profesional/turnos");
  revalidatePath(`/profesionales/${appointment.professionalId}`);

  const redirectBase =
    user.role === "ADMIN"
      ? "/admin/turnos"
      : user.role === "MANAGER"
        ? "/encargado/turnos"
        : user.role === "SECRETARY"
          ? "/secretaria/turnos"
          : user.role === "SPECIALIST"
            ? "/profesional/turnos"
            : "/mis-turnos";
  const profesionalParam =
    redirectBase === "/mis-turnos"
      ? `&profesionalId=${appointment.professionalId}`
      : "";
  redirect(`${redirectBase}?cancelado=1${profesionalParam}`);
}
