import { prisma } from "@/lib/prisma";
import { createSpecialty, deleteSpecialty } from "@/actions/admin-specialties";

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Ingresá un nombre para la especialidad.",
  duplicado: "Ya existe una especialidad con ese nombre.",
};

export default async function AdminEspecialidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; creado?: string; eliminado?: string }>;
}) {
  const { error, creado, eliminado } = await searchParams;

  const specialties = await prisma.specialty.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { professionals: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Especialidades</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {creado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Especialidad creada.
        </p>
      )}
      {eliminado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Especialidad eliminada.
        </p>
      )}

      <form
        action={createSpecialty}
        className="mt-6 flex max-w-md items-end gap-2"
      >
        <div className="flex-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nueva especialidad
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
        >
          Agregar
        </button>
      </form>

      <div className="mt-8 divide-y divide-border">
        {specialties.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted">
                {s._count.professionals} profesional(es)
              </p>
            </div>
            <form action={deleteSpecialty}>
              <input type="hidden" name="id" value={s.id} />
              <button
                type="submit"
                className="rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger-bg"
              >
                Eliminar
              </button>
            </form>
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
