"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { chargeAppointmentAction, getAppointmentChargeAction } from "@/actions/charges";
import type { NomencladorOption } from "@/lib/nomenclador";

type PaymentMethod = "EFECTIVO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Tarjeta de débito",
  CREDITO: "Tarjeta de crédito",
  TRANSFERENCIA: "Transferencia",
};

const OTHER_VALUE = "__otro__";

type Row = {
  key: number;
  nomencladorId: string | null;
  description: string;
  quantity: number;
  unitValue: number;
};

let rowKeySeq = 0;
function blankRow(): Row {
  return { key: rowKeySeq++, nomencladorId: null, description: "", quantity: 1, unitValue: 0 };
}

const ERROR_MESSAGES: Record<string, string> = {
  sin_caja: "No hay una caja abierta en esta institución. Abrila primero desde \"Caja\".",
  sin_items: "Agregá al menos un ítem con descripción y cantidad.",
  invalido: "No se pudo guardar el cobro.",
};

export function ChargeButton({
  appointmentId,
  patientName,
  healthInsurance,
  nomencladores,
  chargedAmount,
}: {
  appointmentId: string;
  patientName: string;
  healthInsurance: string | null;
  nomencladores: NomencladorOption[];
  chargedAmount?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [rows, setRows] = useState<Row[]>([blankRow()]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [error, setError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const plan = healthInsurance ?? "";

  function valueFor(nomencladorId: string) {
    const n = nomencladores.find((x) => x.id === nomencladorId);
    if (!n) return 0;
    return n.values[plan] ?? n.values[""] ?? 0;
  }

  async function handleOpen() {
    setOpen(true);
    setError(null);
    setSaved(false);
    setInvoiceId(null);
    setLoadingInitial(true);
    try {
      const existing = await getAppointmentChargeAction(appointmentId);
      setInvoiceId(existing?.id ?? null);
      if (existing && existing.items.length > 0) {
        setRows(
          existing.items.map((it) => ({
            key: rowKeySeq++,
            nomencladorId: it.nomencladorId,
            description: it.description,
            quantity: it.quantity,
            unitValue: it.unitValue,
          }))
        );
        if (existing.paymentMethod) {
          setPaymentMethod(existing.paymentMethod as PaymentMethod);
        }
      } else {
        setRows([blankRow()]);
      }
    } finally {
      setLoadingInitial(false);
    }
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleNomencladorChange(key: number, value: string) {
    if (value === OTHER_VALUE || value === "") {
      updateRow(key, { nomencladorId: null, description: "", unitValue: 0 });
      return;
    }
    const n = nomencladores.find((x) => x.id === value);
    updateRow(key, {
      nomencladorId: value,
      description: n?.description ?? "",
      unitValue: valueFor(value),
    });
  }

  const total = rows.reduce((sum, r) => sum + r.quantity * r.unitValue, 0);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await chargeAppointmentAction({
        appointmentId,
        items: rows
          .filter((r) => r.description.trim() && r.quantity > 0)
          .map((r) => ({
            nomencladorId: r.nomencladorId,
            description: r.description.trim(),
            quantity: r.quantity,
            unitValue: r.unitValue,
          })),
        paymentMethod,
      });
      if (!result.ok) {
        setError(ERROR_MESSAGES[result.error] ?? "No se pudo guardar el cobro.");
        return;
      }
      setInvoiceId(result.invoiceId);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          chargedAmount
            ? "text-primary hover:underline"
            : "text-muted hover:text-primary hover:underline"
        }
      >
        {chargedAmount ? `${patientName} · $${chargedAmount}` : patientName}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cobrar consulta</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              {patientName} · {healthInsurance || "Particular"}
              {invoiceId && !saved && (
                <>
                  {" · "}
                  <a
                    href={`/imprimir/bono/${invoiceId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Imprimir bono
                  </a>
                </>
              )}
            </p>

            {loadingInitial ? (
              <p className="mt-6 text-sm text-muted">Cargando…</p>
            ) : saved && invoiceId ? (
              <div className="mt-6">
                <p className="rounded-md bg-success-bg px-4 py-3 text-sm text-success">
                  Cobro guardado · Total ${total}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary"
                  >
                    Cerrar
                  </button>
                  <a
                    href={`/imprimir/bono/${invoiceId}?auto=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                  >
                    Imprimir bono
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted">
                        <th className="py-2 pr-2">Nomenclador</th>
                        <th className="py-2 pr-2">Descripción</th>
                        <th className="py-2 pr-2">Cant.</th>
                        <th className="py-2 pr-2">Valor unit.</th>
                        <th className="py-2 pr-2">Subtotal</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.key} className="border-b border-border/60">
                          <td className="py-2 pr-2">
                            <select
                              value={row.nomencladorId ?? OTHER_VALUE}
                              onChange={(e) => handleNomencladorChange(row.key, e.target.value)}
                              className="w-full rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:border-primary"
                            >
                              <option value={OTHER_VALUE}>Otro (sin código)</option>
                              {nomencladores.map((n) => (
                                <option key={n.id} value={n.id}>
                                  {n.code} — {n.description}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              value={row.description}
                              onChange={(e) => updateRow(row.key, { description: e.target.value })}
                              placeholder="Descripción"
                              className="w-full rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              min={1}
                              value={row.quantity}
                              onChange={(e) =>
                                updateRow(row.key, { quantity: Number(e.target.value) || 1 })
                              }
                              className="w-16 rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              min={0}
                              value={row.unitValue}
                              onChange={(e) =>
                                updateRow(row.key, { unitValue: Number(e.target.value) || 0 })
                              }
                              className="w-24 rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-2 pr-2 font-medium">
                            ${row.quantity * row.unitValue}
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                              className="text-danger hover:underline"
                              disabled={rows.length === 1}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, blankRow()])}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  + Agregar ítem
                </button>

                <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <label htmlFor="paymentMethod" className="text-sm font-medium">
                      Medio de pago
                    </label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mt-1 rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                    >
                      {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xl font-semibold">Total: ${total}</p>
                </div>

                {error && (
                  <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={pending}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                  >
                    {pending ? "Guardando…" : "Guardar y cobrar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
