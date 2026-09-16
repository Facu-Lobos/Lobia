-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "arrivedAt" DATETIME;

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "institutionId" TEXT,
    CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Professional_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Professional" ("active", "bio", "bookingMessage", "cancelMessage", "createdAt", "depositAmount", "fullName", "id", "mercadoPagoConnected", "userId", "whatsappMessageTemplate") SELECT "active", "bio", "bookingMessage", "cancelMessage", "createdAt", "depositAmount", "fullName", "id", "mercadoPagoConnected", "userId", "whatsappMessageTemplate" FROM "Professional";
DROP TABLE "Professional";
ALTER TABLE "new_Professional" RENAME TO "Professional";
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");
CREATE INDEX "Professional_institutionId_idx" ON "Professional"("institutionId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PATIENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "institutionId" TEXT,
    CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "phone", "role") SELECT "createdAt", "email", "id", "name", "passwordHash", "phone", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_institutionId_idx" ON "User"("institutionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");
