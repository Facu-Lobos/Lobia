import { prisma } from "@/lib/prisma";
import {
  createInstitution,
  deleteInstitution,
} from "@/actions/admin-institutions";

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Ingresá un nombre para la institución.",
  duplicado: "Ya existe una institución con ese nombre.",
  enuso: "No se puede eliminar: todavía tiene profesionales o personal asignado.",
};

export default async function AdminInstitucionesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; creado?: string; eliminado?: string }>;
}) {
  const { error, creado, eliminado } = await searchParams;

  const institutions = await prisma.institution.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { professionals: true, users: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Instituciones</h1>
      <p className="mt-1 text-muted">
        Clínicas/instituciones. Cada profesional pertenece a una; el rol
        Encargado se asigna a una institución y solo ve/edita la suya.
      </p>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {creado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Institución creada.
        </p>
      )}
      {eliminado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Institución eliminada.
        </p>
      )}

      <form
        action={createInstitution}
        className="mt-6 flex max-w-md items-end gap-2"
      >
        <div className="flex-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nueva institución
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
        {institutions.map((i) => (
          <div key={i.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{i.name}</p>
              <p className="text-sm text-muted">
                {i._count.professionals} profesional(es) · {i._count.users}{" "}
                cuenta(s) de staff
              </p>
            </div>
            <form action={deleteInstitution}>
              <input type="hidden" name="id" value={i.id} />
              <button
                type="submit"
                className="rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger-bg"
              >
                Eliminar
              </button>
            </form>
          </div>
        ))}

        {institutions.length === 0 && (
          <p className="py-4 text-sm text-muted">
            No hay instituciones cargadas.
          </p>
        )}
      </div>
    </div>
  );
}
