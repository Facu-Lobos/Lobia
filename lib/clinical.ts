import "server-only";
import { prisma } from "@/lib/prisma";

export type AntecedentsInput = {
  allergies: string | null;
  chronicConditions: string | null;
  currentMedications: string | null;
  notes: string | null;
};

// Los antecedentes son un historial inmutable, igual que las evoluciones: cada
// guardado agrega una versión con el estado completo de los cuatro campos y la
// vigente es la más reciente. No hay update ni delete de AntecedentsEntry.

// Versión vigente (la más reciente), o null si nunca se cargaron.
export async function getPatientAntecedents(patientId: string) {
  return prisma.antecedentsEntry.findFirst({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });
}

// Todas las versiones, de la más nueva a la más vieja (la primera es la vigente).
export async function listAntecedentsHistory(patientId: string) {
  return prisma.antecedentsEntry.findMany({
    where: { patientId },
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
  });
}

// Agrega una versión nueva. Si no cambió nada respecto de la vigente, no
// agrega nada (devuelve null) para no llenar el historial de copias iguales.
export async function addAntecedentsEntry(
  patientId: string,
  input: AntecedentsInput,
  createdById: string
) {
  const current = await getPatientAntecedents(patientId);
  if (
    current &&
    current.allergies === input.allergies &&
    current.chronicConditions === input.chronicConditions &&
    current.currentMedications === input.currentMedications &&
    current.notes === input.notes
  ) {
    return null;
  }
  return prisma.antecedentsEntry.create({
    data: { patientId, createdById, ...input },
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
//
// Las entradas (ClinicalNote) son INMUTABLES a propósito: no hay update ni
// delete en ningún lado de la app, y no hay que agregarlos. Si un profesional
// necesita corregir un diagnóstico, escribe una entrada nueva que aclara que
// la anterior no era correcta.
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
