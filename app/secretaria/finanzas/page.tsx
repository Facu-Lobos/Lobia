import { requireSecretary } from "@/lib/auth-helpers";
import { getFinanceSummary } from "@/lib/finance";
import { createTransaction, deleteTransaction } from "@/actions/finance";
import { monthParam, parseMonthParam } from "@/components/AppointmentCalendar";
import Link from "next/link";

const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ERROR_MESSAGES: Record<string, string> = {
  datos: "Completá tipo, concepto y un monto válido.",
};

function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

export default async function SecretariaFinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; creado?: string; eliminado?: string }>;
}) {
  const { institutionId } = await requireSecretary();
  const { month: monthParamValue, error, creado, eliminado } = await searchParams;

  const month = parseMonthParam(monthParamValue);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  const { rows, income, expense, balance } = await getFinanceSummary(
    institutionId,
    monthStart,
    monthEnd
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Finanzas</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {creado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Movimiento registrado.
        </p>
      )}
      {eliminado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Movimiento eliminado.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-medium">
          {MONTH_LABELS[month.getMonth()]} {month.getFullYear()}
        </h2>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/secretaria/finanzas?month=${monthParam(prevMonth)}`}
            className="rounded-md border border-border px-2 py-1 hover:border-primary"
          >
            ← Anterior
          </Link>
          <Link
            href={`/secretaria/finanzas?month=${monthParam(nextMonth)}`}
            className="rounded-md border border-border px-2 py-1 hover:border-primary"
          >
            Siguiente →
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-3xl font-semibold text-success">{income}</p>
          <p className="mt-1 text-sm text-muted">Ingresos</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-3xl font-semibold text-danger">{expense}</p>
          <p className="mt-1 text-sm text-muted">Egresos</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-3xl font-semibold text-primary">{balance}</p>
          <p className="mt-1 text-sm text-muted">Balance</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-medium">Nuevo movimiento</h2>
        <form
          action={createTransaction}
          className="mt-3 flex max-w-2xl flex-wrap items-end gap-2"
        >
          <div>
            <label htmlFor="type" className="text-sm font-medium">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            >
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Egreso</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="concept" className="text-sm font-medium">
              Concepto
            </label>
            <input
              id="concept"
              name="concept"
              required
              placeholder="Ej: Cobro consulta particular"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="amount" className="text-sm font-medium">
              Monto
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min={1}
              step={1}
              required
              className="mt-1 w-32 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Agregar
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Movimientos del mes</h2>
        <div className="mt-3 divide-y divide-border">
          {rows.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{t.concept}</p>
                <p className="text-muted">{formatDate(t.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={t.type === "INCOME" ? "text-success" : "text-danger"}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                  {t.amount}
                </span>
                <form action={deleteTransaction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger-bg"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="py-4 text-sm text-muted">Sin movimientos este mes.</p>
          )}
        </div>
      </section>
    </div>
  );
}
