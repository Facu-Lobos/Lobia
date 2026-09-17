-- AlterTable
ALTER TABLE "Professional" ADD COLUMN "feeAmount" INTEGER;

-- CreateTable
CREATE TABLE "PatientAntecedents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "currentMedications" TEXT,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientAntecedents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClinicalNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "reason" TEXT,
    "diagnosis" TEXT,
    "notes" TEXT,
    "treatment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClinicalNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientAntecedents_patientId_key" ON "PatientAntecedents"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalNote_appointmentId_key" ON "ClinicalNote"("appointmentId");
