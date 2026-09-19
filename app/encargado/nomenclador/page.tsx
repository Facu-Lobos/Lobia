import { requireManager } from "@/lib/auth-helpers";
import { listNomencladores } from "@/lib/nomenclador";
import { listHealthInsurancesForInstitution } from "@/lib/health-insurance";
import {
  createNomenclador,
  toggleNomencladorActive,
  setNomencladorValue,
  deleteNomencladorValue,
} from "@/actions/nomenclador";

const ERROR_MESSAGES: Record<string, string> = {
  datos: "Completá código y descripción.",
  duplicado: "Ya existe un código de nomenclador igual.",
  valor: "Ingresá un valor válido.",
  noautorizado: "Ese código no pertenece a tu institución.",
};

export default async function EncargadoNomencladorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; creado?: string; actualizado?: string }>;
}) {
  const { institutionId } = await requireManager();
  const { error, creado, actualizado } = await searchParams;

  const [items, healthInsurances] = await Promise.all([
    listNomencladores(institutionId),
    listHealthInsurancesForInstitution(institutionId),
  ]);

  const plans = [{ name: "" }, ...healthInsurances];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Nomenclador</h1>
      <p className="mt-1 text-muted">
        Códigos y prácticas propios de tu institución, con un valor por
        obra social (&quot;Particular&quot; es una más de la lista). Se usan
        al cobrar desde la grilla de Sala de espera.
      </p>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {creado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Código agregado.
        </p>
      )}
      {actualizado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Actualizado.
        </p>
      )}

      <form action={createNomenclador} className="mt-6 flex max-w-xl items-end gap-2">
        <div>
          <label htmlFor="code" className="text-sm font-medium">
            Código
          </label>
          <input
            id="code"
            name="code"
            required
            placeholder="Ej: 420101"
            className="mt-1 w-32 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción
          </label>
          <input
            id="description"
            name="description"
            required
            placeholder="Ej: Consulta"
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

      <div className="mt-8 space-y-6">
        {items.map((item) => {
          const valuesByPlan = new Map(item.values.map((v) => [v.healthInsurance, v]));
          return (
            <div
              key={item.id}
              className={`rounded-lg border border-border p-4 ${item.active ? "" : "opacity-50"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {item.code} — {item.description}
                  </p>
                  {!item.active && <p className="text-xs text-muted">Inactivo</p>}
                </div>
                <form action={toggleNomencladorActive}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary"
                  >
                    {item.active ? "Desactivar" : "Reactivar"}
                  </button>
                </form>
              </div>

              <div className="mt-3 divide-y divide-border/60 text-sm">
                {plans.map((plan) => {
                  const existing = valuesByPlan.get(plan.name);
                  return (
                    <div key={plan.name} className="flex items-center gap-2 py-2">
                      <span className="w-40 shrink-0 text-muted">
                        {plan.name || "Particular"}
                      </span>
                      <form action={setNomencladorValue} className="flex items-center gap-2">
                        <input type="hidden" name="nomencladorId" value={item.id} />
                        <input type="hidden" name="healthInsurance" value={plan.name} />
                        <input
                          type="number"
                          name="value"
                          min={0}
                          defaultValue={existing?.value ?? ""}
                          placeholder="Sin valor"
                          className="w-28 rounded-md border border-border bg-surface px-2 py-1 outline-none focus:border-primary"
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-border px-2 py-1 text-xs hover:border-primary"
                        >
                          Guardar
                        </button>
                      </form>
                      {existing && (
                        <form action={deleteNomencladorValue}>
                          <input type="hidden" name="id" value={existing.id} />
                          <button
                            type="submit"
                            className="text-xs text-danger hover:underline"
                          >
                            Quitar
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="py-4 text-sm text-muted">No hay códigos cargados todavía.</p>
        )}
      </div>
    </div>
  );
}
