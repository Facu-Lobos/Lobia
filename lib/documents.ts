import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, PATIENT_DOCUMENTS_BUCKET } from "@/lib/supabase";

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export async function listDocumentsForPatient(patientId: string) {
  return prisma.patientDocument.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });
}

export type SaveDocumentResult =
  | { ok: true; documentId: string }
  | { ok: false; error: string };

export async function saveUploadedDocument({
  patientId,
  uploadedById,
  title,
  file,
}: {
  patientId: string;
  uploadedById: string;
  title: string;
  file: File;
}): Promise<SaveDocumentResult> {
  if (!title.trim()) {
    return { ok: false, error: "El título es obligatorio." };
  }
  if (!file || file.size === 0) {
    return { ok: false, error: "Seleccioná un archivo." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "El archivo no puede superar los 15MB." };
  }

  const storagePath = `patients/${patientId}/${randomUUID()}-${sanitizeFileName(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(PATIENT_DOCUMENTS_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type || "application/octet-stream",
    });
  if (error) {
    return { ok: false, error: "No se pudo subir el archivo. Probá de nuevo." };
  }

  const document = await prisma.patientDocument.create({
    data: {
      patientId,
      uploadedById,
      title: title.trim(),
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      storagePath,
    },
  });

  return { ok: true, documentId: document.id };
}

export async function readDocumentFile(storagePath: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(PATIENT_DOCUMENTS_BUCKET)
    .download(storagePath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function deletePatientDocument(id: string) {
  const doc = await prisma.patientDocument.delete({ where: { id } });
  await supabaseAdmin.storage
    .from(PATIENT_DOCUMENTS_BUCKET)
    .remove([doc.storagePath])
    .catch(() => {});
  return doc;
}
