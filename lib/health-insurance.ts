import "server-only";
import { prisma } from "@/lib/prisma";

// El paciente no pertenece a una institución fija (puede reservar con
// profesionales de varias), así que el desplegable de "Mi perfil" muestra
// la unión de las obras sociales configuradas en todas las instituciones.
export async function listAllHealthInsuranceNames() {
  const rows = await prisma.healthInsurance.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return Array.from(new Set(rows.map((r) => r.name)));
}

export async function listHealthInsurancesForInstitution(
  institutionId: string
) {
  return prisma.healthInsurance.findMany({
    where: { institutionId },
    orderBy: { name: "asc" },
  });
}

export async function listAllHealthInsurancesWithInstitution() {
  return prisma.healthInsurance.findMany({
    include: { institution: true },
    orderBy: [{ institution: { name: "asc" } }, { name: "asc" }],
  });
}
