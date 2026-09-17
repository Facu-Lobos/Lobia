import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

const UPLOADS_ROOT = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "uploads",
  "patients"
);
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
  | { ok: true }
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

  const patientDir = path.join(UPLOADS_ROOT, patientId);
  await mkdir(patientDir, { recursive: true });

  const storedName = `${randomUUID()}-${sanitizeFileName(file.name)}`;
  const storagePath = path.join(patientDir, storedName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, bytes);

  await prisma.patientDocument.create({
    data: {
      patientId,
      uploadedById,
      title: title.trim(),
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      storagePath: path.relative(
        /*turbopackIgnore: true*/ process.cwd(),
        storagePath
      ),
    },
  });

  return { ok: true };
}

export async function readDocumentFile(storagePath: string) {
  return readFile(
    path.join(/*turbopackIgnore: true*/ process.cwd(), storagePath)
  );
}

export async function deletePatientDocument(id: string) {
  const doc = await prisma.patientDocument.delete({ where: { id } });
  await unlink(
    path.join(/*turbopackIgnore: true*/ process.cwd(), doc.storagePath)
  ).catch(() => {});
  return doc;
}
