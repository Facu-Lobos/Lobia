import { requireManager } from "@/lib/auth-helpers";
import { getOpenCaja, getCajaSummary, listCajaHistory } from "@/lib/caja";
import { openCajaAction, closeCajaAction } from "@/actions/caja";

const ERROR_MESSAGES: Record<string, string> = {
  monto: "Ingresá un monto válido.",
  abierta: "Ya hay una caja abierta.",
  noautorizado: "Esa caja no pertenece a tu institución.",
  institucion: "No se pudo determinar la institución.",
};

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Tarjeta de débito",
  CREDITO: "Tarjeta de crédito",
  TRANSFERENCIA: "Transferencia",
  SIN_ESPECIFICAR: "Sin especificar",
};

function formatDateTime(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export default async function EncargadoCajaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; abierta?: string; cerrada?: string }>;
}) {
  const { institutionId } = await requireManager();
  const { error, abierta, cerrada } = await searchParams;

  const openCaja = institutionId ? await getOpenCaja(institutionId) : null;
  const summary = openCaja ? await getCajaSummary(openCaja.id) : null;
  const history = institutionId ? await listCajaHistory(institutionId) : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Caja</h1>
      <p className="mt-1 text-muted">
        Todo lo cobrado por nomenclador desde la grilla de Sala de espera
        queda vinculado a la caja abierta al momento de cobrarlo.
      </p>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {abierta && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Caja abierta.
        </p>
      )}
      {cerrada && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Caja cerrada.{" "}
          <a
            href={`/imprimir/caja/${cerrada}?auto=1`}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline"
          >
            Imprimir cierre
          </a>
        </p>
      )}

      {summary ? (
        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Caja abierta</p>
              <p className="text-sm text-muted">
                Abierta por {summary.caja.openedBy.name} el{" "}
                {formatDateTime(summary.caja.openedAt)} · Fondo inicial: $
                {summary.caja.openingAmount}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-primary">${summary.total}</p>
              <a
                href={`/imprimir/caja/${summary.caja.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Imprimir parcial
              </a>
            </div>
          </div>

          {Object.keys(summary.byMethod).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {Object.entries(summary.byMethod).map(([method, amount]) => (
                <p key={method}>
                  <span className="text-muted">{METHOD_LABELS[method] ?? method}: </span>
                  <span className="font-medium">${amount}</span>
                </p>
              ))}
            </div>
          )}

          <div className="mt-4 divide-y divide-border/60 text-sm">
            {summary.caja.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2">
                <span>{inv.patient.name} · {inv.concept}</span>
                <span className="font-medium">${inv.amount}</span>
              </div>
            ))}
            {summary.caja.invoices.length === 0 && (
              <p className="py-2 text-muted">Todavía no se cobró nada en esta caja.</p>
            )}
          </div>

          <form action={closeCajaAction} className="mt-5 flex items-end gap-2 border-t border-border pt-4">
            <input type="hidden" name="cajaId" value={summary.caja.id} />
            <div>
              <label htmlFor="closingAmount" className="text-sm font-medium">
                Efectivo contado al cierre
              </label>
              <input
                id="closingAmount"
                name="closingAmount"
                type="number"
                min={0}
                required
                className="mt-1 w-40 rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Cerrar caja
            </button>
          </form>
        </div>
      ) : (
        <form action={openCajaAction} className="mt-6 flex max-w-sm items-end gap-2 rounded-lg border border-border bg-surface p-5">
          <div className="flex-1">
            <label htmlFor="openingAmount" className="text-sm font-medium">
              Fondo inicial (opcional)
            </label>
            <input
              id="openingAmount"
              name="openingAmount"
              type="number"
              min={0}
              defaultValue={0}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Abrir caja
          </button>
        </form>
      )}

      <section className="mt-10">
        <h2 className="font-medium">Historial</h2>
        <div className="mt-3 divide-y divide-border text-sm">
          {history.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p>
                  {formatDateTime(c.openedAt)}
                  {c.closedAt ? ` → ${formatDateTime(c.closedAt)}` : " (abierta)"}
                </p>
                <p className="text-muted">
                  Abrió {c.openedBy.name}
                  {c.closedBy ? ` · Cerró ${c.closedBy.name}` : ""} ·{" "}
                  {c._count.invoices} cobro(s)
                </p>
              </div>
              <div className="flex items-center gap-4">
                {c.closingAmount !== null && (
                  <p className="font-medium">Contado: ${c.closingAmount}</p>
                )}
                <a
                  href={`/imprimir/caja/${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Imprimir
                </a>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="py-4 text-muted">Sin cajas registradas todavía.</p>
          )}
        </div>
      </section>
    </div>
  );
}
