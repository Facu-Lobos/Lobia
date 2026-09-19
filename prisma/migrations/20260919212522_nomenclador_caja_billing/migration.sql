-- Nomenclador propio por institución (código + descripción + valor por
-- obra social), renglones de cobro por turno (InvoiceItem) y caja con
-- apertura/cierre. Ver prisma/schema.prisma para los comentarios de diseño.

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "Nomenclador" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nomenclador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NomencladorValor" (
    "id" TEXT NOT NULL,
    "nomencladorId" TEXT NOT NULL,
    "healthInsurance" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "NomencladorValor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caja" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingAmount" INTEGER NOT NULL DEFAULT 0,
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "closingAmount" INTEGER,

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "nomencladorId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitValue" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "paymentMethod" "PaymentMethod";
ALTER TABLE "Invoice" ADD COLUMN "cajaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Nomenclador_institutionId_code_key" ON "Nomenclador"("institutionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "NomencladorValor_nomencladorId_healthInsurance_key" ON "NomencladorValor"("nomencladorId", "healthInsurance");

-- CreateIndex
CREATE INDEX "Caja_institutionId_openedAt_idx" ON "Caja"("institutionId", "openedAt");

-- AddForeignKey
ALTER TABLE "Nomenclador" ADD CONSTRAINT "Nomenclador_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NomencladorValor" ADD CONSTRAINT "NomencladorValor_nomencladorId_fkey" FOREIGN KEY ("nomencladorId") REFERENCES "Nomenclador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_nomencladorId_fkey" FOREIGN KEY ("nomencladorId") REFERENCES "Nomenclador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
