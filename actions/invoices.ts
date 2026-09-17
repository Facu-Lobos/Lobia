"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAppointmentStaff } from "@/lib/auth-helpers";
import { appointmentInInstitution } from "@/lib/institution-scope";
import type { AppRole } from "@/types/roles";

function redirectBaseFor(role: AppRole) {
  if (role === "MANAGER") return "/encargado/facturacion";
  if (role === "SECRETARY") return "/secretaria/facturacion";
  return "/admin/facturacion";
}

// Genera un comprobante interno (no fiscal) para un turno. Ver
// prisma/schema.prisma (modelo Invoice) para el disclaimer completo.
export async function generateInvoice(formData: FormData) {
  const { user, institutionId } = await requireAppointmentStaff();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const base = redirectBaseFor(user.role);

  if (
    institutionId &&
    !(await appointmentInInstitution(appointmentId, institutionId))
  ) {
    redirect(`${base}?error=noautorizado`);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { professional: true },
  });
  if (!appointment) {
    redirect(`${base}?error=noautorizado`);
  }

  const existing = await prisma.invoice.findUnique({
    where: { appointmentId },
  });
  if (existing) {
    redirect(`${base}/${existing.id}`);
  }

  const invoice = await prisma.invoice.create({
    data: {
      appointmentId,
      patientId: appointment.patientId,
      concept: `Consulta con ${appointment.professional.fullName}`,
      amount: appointment.professional.feeAmount ?? 0,
      createdById: user.id,
    },
  });

  revalidatePath(base);
  redirect(`${base}/${invoice.id}`);
}
