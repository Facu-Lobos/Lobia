import "server-only";
import { prisma } from "@/lib/prisma";

export async function getOpenCaja(institutionId: string) {
  return prisma.caja.findFirst({
    where: { institutionId, closedAt: null },
    include: { openedBy: true },
    orderBy: { openedAt: "desc" },
  });
}

export async function getCajaSummary(cajaId: string) {
  const caja = await prisma.caja.findUnique({
    where: { id: cajaId },
    include: {
      openedBy: true,
      closedBy: true,
      invoices: { include: { patient: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!caja) return null;

  const total = caja.invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const byMethod: Record<string, number> = {};
  for (const inv of caja.invoices) {
    const key = inv.paymentMethod ?? "SIN_ESPECIFICAR";
    byMethod[key] = (byMethod[key] ?? 0) + inv.amount;
  }

  return { caja, total, byMethod };
}

export async function listCajaHistory(institutionId: string, take = 20) {
  return prisma.caja.findMany({
    where: { institutionId },
    include: {
      openedBy: true,
      closedBy: true,
      _count: { select: { invoices: true } },
    },
    orderBy: { openedAt: "desc" },
    take,
  });
}
