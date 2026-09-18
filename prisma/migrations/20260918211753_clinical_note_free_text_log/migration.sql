-- ClinicalNote pasa de "una por turno, con campos estructurados" a "bitácora
-- de texto libre, muchas por turno" (con link u documento adjunto opcional).

-- Ya no es 1:1 con Appointment
DROP INDEX "ClinicalNote_appointmentId_key";
CREATE INDEX "ClinicalNote_appointmentId_idx" ON "ClinicalNote"("appointmentId");

-- AlterTable: nuevas columnas
ALTER TABLE "ClinicalNote" ADD COLUMN "text" TEXT;
ALTER TABLE "ClinicalNote" ADD COLUMN "linkUrl" TEXT;
ALTER TABLE "ClinicalNote" ADD COLUMN "documentId" TEXT;

-- Migra el contenido de las filas existentes (campos estructurados) a texto
-- libre, para no perder consultas ya cargadas.
UPDATE "ClinicalNote" SET "text" = trim(BOTH E'\n' FROM
  COALESCE('Motivo: ' || "reason" || E'\n', '') ||
  COALESCE('Diagnóstico: ' || "diagnosis" || E'\n', '') ||
  COALESCE('Notas: ' || "notes" || E'\n', '') ||
  COALESCE('Indicaciones: ' || "treatment", '')
);
UPDATE "ClinicalNote" SET "text" = '(sin contenido)' WHERE "text" IS NULL OR "text" = '';

ALTER TABLE "ClinicalNote" ALTER COLUMN "text" SET NOT NULL;

-- Columnas viejas, ya migradas a "text"
ALTER TABLE "ClinicalNote" DROP COLUMN "reason";
ALTER TABLE "ClinicalNote" DROP COLUMN "diagnosis";
ALTER TABLE "ClinicalNote" DROP COLUMN "notes";
ALTER TABLE "ClinicalNote" DROP COLUMN "treatment";
ALTER TABLE "ClinicalNote" DROP COLUMN "updatedAt";

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalNote_documentId_key" ON "ClinicalNote"("documentId");

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PatientDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
