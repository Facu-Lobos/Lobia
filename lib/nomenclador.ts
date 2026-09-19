import "server-only";
import { prisma } from "@/lib/prisma";

export async function listNomencladores(institutionId: string) {
  return prisma.nomenclador.findMany({
    where: { institutionId },
    include: { values: true },
    orderBy: { code: "asc" },
  });
}

export type NomencladorOption = {
  id: string;
  code: string;
  description: string;
  // "" = Particular (sin obra social).
  values: Record<string, number>;
};

// Formato liviano para pasarle al modal de cobro del lado del cliente: sólo
// los activos, con el mapa de valores por obra social ya armado.
export async function listNomencladorOptions(
  institutionId: string
): Promise<NomencladorOption[]> {
  const rows = await prisma.nomenclador.findMany({
    where: { institutionId, active: true },
    include: { values: true },
    orderBy: { code: "asc" },
  });

  return rows.map((n) => ({
    id: n.id,
    code: n.code,
    description: n.description,
    values: Object.fromEntries(n.values.map((v) => [v.healthInsurance, v.value])),
  }));
}
