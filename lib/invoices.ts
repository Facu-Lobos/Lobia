import "server-only";
import { prisma } from "@/lib/prisma";

export async function listInvoices(institutionId: string | null) {
  return prisma.invoice.findMany({
    where: institutionId
      ? { appointment: { professional: { institutionId } } }
      : {},
    include: {
      patient: true,
      appointment: { include: { professional: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: true,
      createdBy: true,
      appointment: { include: { professional: true } },
    },
  });
}
