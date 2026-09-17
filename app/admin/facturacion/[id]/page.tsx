import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getInvoice } from "@/lib/invoices";

function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export default async function AdminComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/admin/facturacion"
        className="text-sm text-muted hover:text-foreground print:hidden"
      >
        ← Volver a Facturación
      </Link>

      <p className="mt-4 rounded-md bg-primary-soft px-4 py-3 text-sm text-foreground print:border print:border-border">
        Comprobante interno — <strong>no es una factura electrónica válida
        ante AFIP</strong>. Emitir facturas fiscales reales requiere CUIT,
        certificado digital y punto de venta homologado (WSFE), todavía no
        configurados en este sistema.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Comprobante interno</h1>
        <p className="text-sm text-muted">N° {invoice.id.slice(-8).toUpperCase()}</p>

        <div className="mt-6 space-y-1 text-sm">
          <p>
            <span className="font-medium">Fecha: </span>
            {formatDate(invoice.createdAt)}
          </p>
          <p>
            <span className="font-medium">Paciente: </span>
            {invoice.patient.name}
          </p>
          {invoice.appointment && (
            <p>
              <span className="font-medium">Profesional: </span>
              {invoice.appointment.professional.fullName}
            </p>
          )}
          <p>
            <span className="font-medium">Concepto: </span>
            {invoice.concept}
          </p>
        </div>

        <p className="mt-6 text-2xl font-semibold">${invoice.amount}</p>
      </div>

      <p className="mt-4 text-xs text-muted print:hidden">
        Para imprimir o guardar como PDF, usá Ctrl+P (Cmd+P en Mac).
      </p>
    </div>
  );
}
