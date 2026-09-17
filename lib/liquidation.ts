import "server-only";
import { prisma } from "@/lib/prisma";

export type LiquidationRow = {
  id: string;
  fullName: string;
  feeAmount: number | null;
  attendedCount: number;
  total: number | null;
};

// "Atendido" = completedAt seteado (pasó por la sala de espera hasta el
// final). Es la métrica más confiable de que la consulta efectivamente
// ocurrió, mejor que sólo mirar la fecha del turno.
export async function getLiquidationForInstitution(
  institutionId: string | null,
  monthStart: Date,
  monthEnd: Date
): Promise<LiquidationRow[]> {
  const professionals = await prisma.professional.findMany({
    where: institutionId ? { institutionId } : {},
    include: {
      _count: {
        select: {
          appointments: {
            where: { completedAt: { gte: monthStart, lt: monthEnd } },
          },
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return professionals.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    feeAmount: p.feeAmount,
    attendedCount: p._count.appointments,
    total: p.feeAmount ? p.feeAmount * p._count.appointments : null,
  }));
}

export async function getLiquidationForProfessional(
  professionalId: string,
  monthStart: Date,
  monthEnd: Date
): Promise<{ attendedCount: number; feeAmount: number | null; total: number | null }> {
  const [professional, attendedCount] = await Promise.all([
    prisma.professional.findUnique({ where: { id: professionalId } }),
    prisma.appointment.count({
      where: {
        professionalId,
        completedAt: { gte: monthStart, lt: monthEnd },
      },
    }),
  ]);

  const feeAmount = professional?.feeAmount ?? null;
  return {
    attendedCount,
    feeAmount,
    total: feeAmount ? feeAmount * attendedCount : null,
  };
}
