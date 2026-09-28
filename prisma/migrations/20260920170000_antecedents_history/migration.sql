-- Antecedentes como historial inmutable (una fila por cada vez que se guardan),
-- igual que las evoluciones. Ver prisma/schema.prisma (AntecedentsEntry).
-- Aditiva: no toca "PatientAntecedents", así el deploy anterior sigue andando.

-- CreateTable
CREATE TABLE "AntecedentsEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "currentMedications" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AntecedentsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AntecedentsEntry_patientId_createdAt_idx" ON "AntecedentsEntry"("patientId", "createdAt");

-- AddForeignKey
ALTER TABLE "AntecedentsEntry" ADD CONSTRAINT "AntecedentsEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AntecedentsEntry" ADD CONSTRAINT "AntecedentsEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Copia lo ya cargado como primera versión de cada paciente.
INSERT INTO "AntecedentsEntry" ("id", "patientId", "allergies", "chronicConditions", "currentMedications", "notes", "createdAt")
SELECT 'legacy_' || "id", "patientId", "allergies", "chronicConditions", "currentMedications", "notes", "updatedAt"
FROM "PatientAntecedents";
