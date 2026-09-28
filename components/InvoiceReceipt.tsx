import type { getInvoice } from "@/lib/invoices";
import {
  PAYMENT_LABELS,
  formatDateTimeAR,
  formatMoney,
} from "@/lib/print-format";

type Invoice = NonNullable<Awaited<ReturnType<typeof getInvoice>>>;

// Comprobante interno ("bono") de un cobro. Se usa tanto en la pantalla de
// Facturación de cada rol como en la vista de impresión (/imprimir/bono).
export function InvoiceReceipt({ invoice }: { invoice: Invoice }) {
  const institution = invoice.appointment?.professional.institution?.name;

  return (
    <div className="rounded-lg border border-border bg-surface p-6 print:border-0 print:p-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Bono / Comprobante interno</h1>
          {institution && <p className="text-sm text-muted">{institution}</p>}
        </div>
        <p className="text-sm text-muted">
          N° {invoice.id.slice(-8).toUpperCase()}
        </p>
      </div>

      <div className="mt-6 space-y-1 text-sm">
        <p>
          <span className="font-medium">Fecha: </span>
          {formatDateTimeAR(invoice.createdAt)}
        </p>
        <p>
          <span className="font-medium">Paciente: </span>
          {invoice.patient.name}
          {invoice.patient.dni ? ` · DNI ${invoice.patient.dni}` : ""}
        </p>
        <p>
          <span className="font-medium">Obra social: </span>
          {invoice.patient.healthInsurance || "Particular"}
          {invoice.patient.healthInsuranceNumber
            ? ` · Afiliado ${invoice.patient.healthInsuranceNumber}`
            : ""}
        </p>
        {invoice.appointment && (
          <p>
            <span className="font-medium">Profesional: </span>
            {invoice.appointment.professional.fullName}
          </p>
        )}
        {invoice.paymentMethod && (
          <p>
            <span className="font-medium">Medio de pago: </span>
            {PAYMENT_LABELS[invoice.paymentMethod] ?? invoice.paymentMethod}
          </p>
        )}
      </div>

      {invoice.items.length > 0 ? (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="py-2 pr-2">Código</th>
              <th className="py-2 pr-2">Descripción</th>
              <th className="py-2 pr-2 text-right">Cant.</th>
              <th className="py-2 pr-2 text-right">Valor unit.</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="py-2 pr-2">{item.nomenclador?.code ?? "—"}</td>
                <td className="py-2 pr-2">{item.description}</td>
                <td className="py-2 pr-2 text-right">{item.quantity}</td>
                <td className="py-2 pr-2 text-right">
                  {formatMoney(item.unitValue)}
                </td>
                <td className="py-2 text-right">{formatMoney(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-6 text-sm">
          <span className="font-medium">Concepto: </span>
          {invoice.concept}
        </p>
      )}

      <p className="mt-6 text-right text-2xl font-semibold">
        Total: {formatMoney(invoice.amount)}
      </p>

      <p className="mt-6 text-xs text-muted">
        Comprobante interno — no es una factura electrónica válida ante AFIP.
      </p>
    </div>
  );
}
