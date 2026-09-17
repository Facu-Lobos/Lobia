import { requireSecretary } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function SecretariaEspecialidadesPage() {
  await requireSecretary();

  const specialties = await prisma.specialty.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { professionals: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Especialidades</h1>
      <p className="mt-1 text-muted">
        Sólo consulta — para agregar una especialidad, pedile al encargado de
        la institución o a un administrador.
      </p>

      <div className="mt-6 divide-y divide-border">
        {specialties.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3">
            <p className="font-medium">{s.name}</p>
            <p className="text-sm text-muted">
              {s._count.professionals} profesional(es)
            </p>
          </div>
        ))}

        {specialties.length === 0 && (
          <p className="py-4 text-sm text-muted">
            No hay especialidades cargadas.
          </p>
        )}
      </div>
    </div>
  );
}
