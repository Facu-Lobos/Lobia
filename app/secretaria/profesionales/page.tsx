import Link from "next/link";
import { requireSecretary } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function SecretariaProfesionalesPage() {
  const { institutionId } = await requireSecretary();

  const professionals = await prisma.professional.findMany({
    where: institutionId ? { institutionId } : {},
    include: { specialties: { include: { specialty: true } } },
    orderBy: { fullName: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Profesionales</h1>
      <p className="mt-1 text-muted">
        Sólo consulta — para agregar o modificar médicos, especialidades u
        horarios, pedile al encargado de la institución.
      </p>

      <div className="mt-6 divide-y divide-border">
        {professionals.map((p) => (
          <Link
            key={p.id}
            href={`/secretaria/profesionales/${p.id}`}
            className="flex items-center justify-between py-3 hover:opacity-70"
          >
            <div>
              <p className="font-medium">
                {p.fullName}{" "}
                {!p.active && (
                  <span className="text-xs text-muted">(inactivo)</span>
                )}
              </p>
              <p className="text-sm text-muted">
                {p.specialties.map((ps) => ps.specialty.name).join(", ") ||
                  "Sin especialidades"}
              </p>
            </div>
          </Link>
        ))}

        {professionals.length === 0 && (
          <p className="py-4 text-sm text-muted">
            No hay profesionales cargados en tu institución.
          </p>
        )}
      </div>
    </div>
  );
}
