"use server";

import { revalidatePath } from "next/cache";
import { requireAppointmentStaff } from "@/lib/auth-helpers";
import { professionalInInstitution } from "@/lib/institution-scope";
import { searchPatientsBrief } from "@/lib/patients";
import { createBooking } from "@/lib/booking";
import { notifyTurnosChangedForProfessional } from "@/lib/realtime";

// Búsqueda en vivo para el modal de "Asignar turno" al hacer click en una
// casilla vacía de la grilla.
export async function searchPatientsForSlotAction(query: string) {
  await requireAppointmentStaff();
  return searchPatientsBrief(query);
}

// Reserva directo en el horario exacto que se clickeó — sin pasar por la
// lista de próximos horarios disponibles de "Asignar turno", porque acá el
// horario ya se conoce (viene de la celda de la grilla).
export async function assignAppointmentAtSlotAction(input: {
  patientId: string;
  professionalId: string;
  dateIso: string;
}) {
  const { institutionId } = await requireAppointmentStaff();

  if (
    institutionId &&
    !(await professionalInInstitution(input.professionalId, institutionId))
  ) {
    return { ok: false as const, reason: "invalido" as const };
  }

  const result = await createBooking({
    professionalId: input.professionalId,
    patientId: input.patientId,
    date: new Date(input.dateIso),
  });

  if (result.ok) {
    revalidatePath("/secretaria/sala-espera");
    revalidatePath("/encargado/sala-espera");
    revalidatePath("/admin/sala-espera");
    revalidatePath("/secretaria/turnos");
    revalidatePath("/encargado/turnos");
    revalidatePath("/admin/turnos");
    notifyTurnosChangedForProfessional(input.professionalId);
  }

  return result;
}
