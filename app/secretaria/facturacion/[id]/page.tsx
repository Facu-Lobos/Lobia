import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSecretary } from "@/lib/auth-helpers";
import { getInvoice } from "@/lib/invoices";
import { InvoiceReceipt } from "@/components/InvoiceReceipt";
import { PrintButton } from "@/components/PrintButton";

export default async function SecretariaComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSecretary();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/secretaria/facturacion"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver a Facturación
        </Link>
        <PrintButton />
      </div>

      <div className="mt-4">
        <InvoiceReceipt invoice={invoice} />
      </div>
    </div>
  );
}
