import type { getCajaSummary } from "@/lib/caja";
import {
  PAYMENT_LABELS,
  formatDateTimeAR,
  formatMoney,
} from "@/lib/print-format";

type Summary = NonNullable<Awaited<ReturnType<typeof getCajaSummary>>>;

// Cierre de caja imprimible. También sirve como "parcial" para una caja que
// todavía está abierta (no tiene efectivo contado ni diferencia).
export function CajaReport({
  summary,
  institutionName,
}: {
  summary: Summary;
  institutionName: string;
}) {
  const { caja, total, byMethod } = summary;
  const isClosed = caja.closedAt !== null;
  const cashCollected = byMethod.EFECTIVO ?? 0;
  const expectedCash = caja.openingAmount + cashCollected;
  const difference =
    caja.closingAmount !== null ? caja.closingAmount - expectedCash : null;

  return (
    <div className="rounded-lg border border-border bg-surface p-6 print:border-0 print:p-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {isClosed ? "Cierre de caja" : "Caja abierta — parcial"}
          </h1>
          <p className="text-sm text-muted">{institutionName}</p>
        </div>
        <p className="text-sm text-muted">N° {caja.id.slice(-8).toUpperCase()}</p>
      </div>

      <div className="mt-6 space-y-1 text-sm">
        <p>
          <span className="font-medium">Apertura: </span>
          {formatDateTimeAR(caja.openedAt)} · {caja.openedBy.name}
        </p>
        <p>
          <span className="font-medium">Cierre: </span>
          {caja.closedAt
            ? `${formatDateTimeAR(caja.closedAt)} · ${caja.closedBy?.name ?? "—"}`
            : "Caja todavía abierta"}
        </p>
        <p>
          <span className="font-medium">Fondo inicial: </span>
          {formatMoney(caja.openingAmount)}
        </p>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="py-2 pr-2">Hora</th>
            <th className="py-2 pr-2">Paciente</th>
            <th className="py-2 pr-2">Concepto</th>
            <th className="py-2 pr-2">Medio</th>
            <th className="py-2 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {caja.invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-border/60">
              <td className="py-2 pr-2">
                {formatDateTimeAR(inv.createdAt).slice(-5)}
              </td>
              <td className="py-2 pr-2">{inv.patient.name}</td>
              <td className="py-2 pr-2">{inv.concept}</td>
              <td className="py-2 pr-2">
                {PAYMENT_LABELS[inv.paymentMethod ?? "SIN_ESPECIFICAR"]}
              </td>
              <td className="py-2 text-right">{formatMoney(inv.amount)}</td>
            </tr>
          ))}
          {caja.invoices.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-muted">
                No se cobró nada en esta caja.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="font-medium">Cobrado por medio de pago</p>
          <div className="mt-2 space-y-1">
            {Object.entries(byMethod).map(([method, amount]) => (
              <p key={method} className="flex justify-between">
                <span className="text-muted">
                  {PAYMENT_LABELS[method] ?? method}
                </span>
                <span>{formatMoney(amount)}</span>
              </p>
            ))}
            <p className="flex justify-between border-t border-border pt-1 font-semibold">
              <span>Total cobrado</span>
              <span>{formatMoney(total)}</span>
            </p>
          </div>
        </div>

        <div>
          <p className="font-medium">Arqueo de efectivo</p>
          <div className="mt-2 space-y-1">
            <p className="flex justify-between">
              <span className="text-muted">Fondo inicial</span>
              <span>{formatMoney(caja.openingAmount)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted">+ Cobrado en efectivo</span>
              <span>{formatMoney(cashCollected)}</span>
            </p>
            <p className="flex justify-between border-t border-border pt-1">
              <span className="text-muted">Efectivo esperado</span>
              <span>{formatMoney(expectedCash)}</span>
            </p>
            {caja.closingAmount !== null && difference !== null && (
              <>
                <p className="flex justify-between">
                  <span className="text-muted">Efectivo contado</span>
                  <span>{formatMoney(caja.closingAmount)}</span>
                </p>
                <p className="flex justify-between border-t border-border pt-1 font-semibold">
                  <span>Diferencia</span>
                  <span>
                    {difference > 0 ? "+" : ""}
                    {formatMoney(difference)}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {isClosed && (
        <div className="mt-16 grid grid-cols-2 gap-10 text-center text-xs text-muted">
          <p className="border-t border-foreground pt-1">
            Firma — {caja.closedBy?.name ?? "quien cierra"}
          </p>
          <p className="border-t border-foreground pt-1">Firma — Encargado/a</p>
        </div>
      )}
    </div>
  );
}
