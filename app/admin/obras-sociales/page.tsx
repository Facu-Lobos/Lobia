import { prisma } from "@/lib/prisma";
import { listAllHealthInsurancesWithInstitution } from "@/lib/health-insurance";
import { createHealthInsurance, deleteHealthInsurance } from "@/actions/health-insurance";

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Ingresá un nombre y elegí una institución.",
  duplicado: "Esa institución ya tiene una obra social con ese nombre.",
};

export default async function AdminObrasSocialesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; creado?: string; eliminado?: string }>;
}) {
  const { error, creado, eliminado } = await searchParams;

  const [healthInsurances, institutions] = await Promise.all([
    listAllHealthInsurancesWithInstitution(),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Obras sociales</h1>
      <p className="mt-1 text-muted">
        Por institución. Alimentan el desplegable de &quot;Mi perfil&quot; de
        los pacientes (se muestra la unión de todas).
      </p>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {creado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Obra social agregada.
        </p>
      )}
      {eliminado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Obra social eliminada.
        </p>
      )}

      <form
        action={createHealthInsurance}
        className="mt-6 flex max-w-lg items-end gap-2"
      >
        <div className="flex-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nueva obra social
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Ej: OSDE"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="institutionId" className="text-sm font-medium">
            Institución
          </label>
          <select
            id="institutionId"
            name="institutionId"
            required
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          >
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
        >
          Agregar
        </button>
      </form>

      <div className="mt-8 divide-y divide-border">
        {healthInsurances.map((h) => (
          <div key={h.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{h.name}</p>
              <p className="text-sm text-muted">{h.institution.name}</p>
            </div>
            <form action={deleteHealthInsurance}>
              <input type="hidden" name="id" value={h.id} />
              <button
                type="submit"
                className="rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger-bg"
              >
                Eliminar
              </button>
            </form>
          </div>
        ))}
        {healthInsurances.length === 0 && (
          <p className="py-4 text-sm text-muted">
            No hay obras sociales cargadas.
          </p>
        )}
        {institutions.length === 0 && (
          <p className="mt-4 text-sm text-muted">
            Primero creá una institución en &quot;Instituciones&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
