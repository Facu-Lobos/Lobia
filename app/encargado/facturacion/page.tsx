import Link from "next/link";
import { requireManager } from "@/lib/auth-helpers";
import { listInvoices } from "@/lib/invoices";

function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export default async function EncargadoFacturacionPage() {
  const { institutionId } = await requireManager();
  const invoices = await listInvoices(institutionId);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
      <p className="mt-1 rounded-md bg-primary-soft px-4 py-3 text-sm text-foreground">
        Comprobantes internos, no factura electrónica de AFIP. Se generan
        desde &quot;Historial&quot; en Turnos.
      </p>

      <div className="mt-6 divide-y divide-border">
        {invoices.map((inv) => (
          <Link
            key={inv.id}
            href={`/encargado/facturacion/${inv.id}`}
            className="flex items-center justify-between py-3 text-sm hover:text-primary"
          >
            <div>
              <p className="font-medium">{inv.patient.name}</p>
              <p className="text-muted">{inv.concept}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">${inv.amount}</p>
              <p className="text-muted">{formatDate(inv.createdAt)}</p>
            </div>
          </Link>
        ))}
        {invoices.length === 0 && (
          <p className="py-4 text-sm text-muted">Sin comprobantes todavía.</p>
        )}
      </div>
    </div>
  );
}
