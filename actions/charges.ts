"use server";

import { revalidatePath } from "next/cache";
import { requireAppointmentStaff } from "@/lib/auth-helpers";
import { appointmentInInstitution } from "@/lib/institution-scope";
import {
  chargeAppointment,
  getAppointmentCharge,
  type ChargeItemInput,
} from "@/lib/charges";
import { prisma } from "@/lib/prisma";
import { notifyTurnosChanged } from "@/lib/realtime";

// Llamado directo desde el modal "Cobrar" en la grilla (client component),
// no desde un <form action>: recibe un objeto ya armado y devuelve un
// resultado en vez de redirigir, para que el modal muestre el error sin
// perder lo que el usuario ya cargó.
export async function chargeAppointmentAction(input: {
  appointmentId: string;
  items: ChargeItemInput[];
  paymentMethod: "EFECTIVO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";
}) {
  const { user, institutionId } = await requireAppointmentStaff();

  if (
    institutionId &&
    !(await appointmentInInstitution(input.appointmentId, institutionId))
  ) {
    return { ok: false as const, error: "invalido" as const };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    select: { patientId: true, professional: { select: { institutionId: true } } },
  });
  if (!appointment) {
    return { ok: false as const, error: "invalido" as const };
  }

  const result = await chargeAppointment({
    appointmentId: input.appointmentId,
    patientId: appointment.patientId,
    institutionId: appointment.professional.institutionId ?? "",
    userId: user.id,
    items: input.items,
    paymentMethod: input.paymentMethod,
  });

  if (result.ok) {
    revalidatePath("/secretaria/sala-espera");
    revalidatePath("/encargado/sala-espera");
    revalidatePath("/admin/sala-espera");
    notifyTurnosChanged(appointment.professional.institutionId);
  }

  return result;
}

export async function getAppointmentChargeAction(appointmentId: string) {
  await requireAppointmentStaff();
  return getAppointmentCharge(appointmentId);
}
