import { notFound } from "next/navigation";
import { requireAppointmentStaff } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getCajaSummary } from "@/lib/caja";
import { CajaReport } from "@/components/CajaReport";
import { PrintButton } from "@/components/PrintButton";

export default async function ImprimirCajaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const { institutionId } = await requireAppointmentStaff();
  const { id } = await params;
  const { auto } = await searchParams;

  const summary = await getCajaSummary(id);
  if (!summary) notFound();
  if (institutionId && summary.caja.institutionId !== institutionId) notFound();

  const institution = await prisma.institution.findUnique({
    where: { id: summary.caja.institutionId },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton auto={!!auto} />
      </div>
      <CajaReport summary={summary} institutionName={institution?.name ?? ""} />
    </div>
  );
}
