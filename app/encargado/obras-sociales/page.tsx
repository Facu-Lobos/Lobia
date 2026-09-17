import { requireManager } from "@/lib/auth-helpers";
import { listHealthInsurancesForInstitution } from "@/lib/health-insurance";
import { createHealthInsurance, deleteHealthInsurance } from "@/actions/health-insurance";

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Ingresá un nombre para la obra social.",
  duplicado: "Ya existe una obra social con ese nombre.",
  noautorizado: "Esa obra social no pertenece a tu institución.",
};

export default async function EncargadoObrasSocialesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; creado?: string; eliminado?: string }>;
}) {
  const { institutionId } = await requireManager();
  const { error, creado, eliminado } = await searchParams;

  const healthInsurances = await listHealthInsurancesForInstitution(institutionId);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Obras sociales</h1>
      <p className="mt-1 text-muted">
        Las que cargues acá aparecen en el desplegable de &quot;Mi perfil&quot; de
        los pacientes.
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
        className="mt-6 flex max-w-md items-end gap-2"
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
            <p className="font-medium">{h.name}</p>
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
      </div>
    </div>
  );
}
