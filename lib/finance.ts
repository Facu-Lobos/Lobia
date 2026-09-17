import "server-only";
import { prisma } from "@/lib/prisma";

export async function listTransactions(
  institutionId: string | null,
  monthStart: Date,
  monthEnd: Date
) {
  return prisma.transaction.findMany({
    where: {
      ...(institutionId ? { institutionId } : {}),
      date: { gte: monthStart, lt: monthEnd },
    },
    include: { institution: true },
    orderBy: { date: "desc" },
  });
}

export async function getFinanceSummary(
  institutionId: string | null,
  monthStart: Date,
  monthEnd: Date
) {
  const rows = await listTransactions(institutionId, monthStart, monthEnd);
  const income = rows
    .filter((r) => r.type === "INCOME")
    .reduce((sum, r) => sum + r.amount, 0);
  const expense = rows
    .filter((r) => r.type === "EXPENSE")
    .reduce((sum, r) => sum + r.amount, 0);
  return { rows, income, expense, balance: income - expense };
}
