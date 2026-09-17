import "server-only";
import { prisma } from "@/lib/prisma";

export type AntecedentsInput = {
  allergies: string | null;
  chronicConditions: string | null;
  currentMedications: string | null;
  notes: string | null;
};

export async function getPatientAntecedents(patientId: string) {
  return prisma.patientAntecedents.findUnique({ where: { patientId } });
}

export async function upsertPatientAntecedents(
  patientId: string,
  input: AntecedentsInput
) {
  return prisma.patientAntecedents.upsert({
    where: { patientId },
    create: { patientId, ...input },
    update: input,
  });
}

export type ClinicalNoteInput = {
  reason: string | null;
  diagnosis: string | null;
  notes: string | null;
  treatment: string | null;
};

export async function upsertClinicalNoteForAppointment(
  appointmentId: string,
  input: ClinicalNoteInput
) {
  return prisma.clinicalNote.upsert({
    where: { appointmentId },
    create: { appointmentId, ...input },
    update: input,
  });
}

// Historial del paciente para dar contexto al profesional que lo atiende
// (incluye notas de otros profesionales). `excludeAppointmentId` deja afuera
// la nota que se está editando en ese momento, para no duplicarla en pantalla.
export async function listClinicalNotesForPatient(
  patientId: string,
  excludeAppointmentId?: string
) {
  return prisma.clinicalNote.findMany({
    where: {
      appointment: { patientId },
      ...(excludeAppointmentId ? { appointmentId: { not: excludeAppointmentId } } : {}),
    },
    include: { appointment: { include: { professional: true } } },
    orderBy: { createdAt: "desc" },
  });
}
