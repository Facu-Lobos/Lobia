-- CreateTable
CREATE TABLE "ExtraDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professionalId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotMinutes" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtraDay_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professionalId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "License_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Professional" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "bio" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "bookingMessage" TEXT,
    "cancelMessage" TEXT,
    "whatsappMessageTemplate" TEXT,
    "mercadoPagoConnected" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" INTEGER,
    CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Professional" ("active", "bio", "createdAt", "fullName", "id") SELECT "active", "bio", "createdAt", "fullName", "id" FROM "Professional";
DROP TABLE "Professional";
ALTER TABLE "new_Professional" RENAME TO "Professional";
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ExtraDay_professionalId_date_idx" ON "ExtraDay"("professionalId", "date");

-- CreateIndex
CREATE INDEX "License_professionalId_startDate_endDate_idx" ON "License"("professionalId", "startDate", "endDate");
