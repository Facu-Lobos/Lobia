import { notFound } from "next/navigation";
import { requireAppointmentStaff } from "@/lib/auth-helpers";
import { getInvoice } from "@/lib/invoices";
import { InvoiceReceipt } from "@/components/InvoiceReceipt";
import { PrintButton } from "@/components/PrintButton";

export default async function ImprimirBonoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const { institutionId } = await requireAppointmentStaff();
  const { id } = await params;
  const { auto } = await searchParams;

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const invoiceInstitutionId =
    invoice.appointment?.professional.institutionId ??
    invoice.caja?.institutionId ??
    null;
  if (institutionId && invoiceInstitutionId !== institutionId) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton auto={!!auto} />
      </div>
      <InvoiceReceipt invoice={invoice} />
    </div>
  );
}
