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
  text: string;
  linkUrl: string | null;
  documentId: string | null;
};

// A diferencia de antes, esto siempre agrega una entrada nueva a la
// bitácora — nunca pisa una anterior. Cada click en "Guardar" es una
// evolución más, no una edición de la última.
export async function addClinicalNoteForAppointment(
  appointmentId: string,
  input: ClinicalNoteInput
) {
  return prisma.clinicalNote.create({
    data: { appointmentId, ...input },
  });
}

// Historial del paciente para dar contexto al profesional que lo atiende
// (incluye notas de otros profesionales, y de otros turnos del mismo).
export async function listClinicalNotesForPatient(patientId: string) {
  return prisma.clinicalNote.findMany({
    where: { appointment: { patientId } },
    include: {
      appointment: { include: { professional: true } },
      document: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
