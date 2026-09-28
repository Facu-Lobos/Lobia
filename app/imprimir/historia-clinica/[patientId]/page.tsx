import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  listAntecedentsHistory,
  listClinicalNotesForPatient,
} from "@/lib/clinical";
import { ClinicalHistoryPrint } from "@/components/ClinicalHistoryPrint";
import { PrintButton } from "@/components/PrintButton";

export default async function ImprimirHistoriaClinicaPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const user = await requireUser();
  const { patientId } = await params;
  const { auto } = await searchParams;

  // Misma regla de visibilidad que las pantallas de historia clínica: el
  // propio paciente, o un especialista que lo haya atendido alguna vez.
  let allowed = false;
  if (user.role === "PATIENT") {
    allowed = user.id === patientId;
  } else if (user.role === "SPECIALIST") {
    const seen = await prisma.appointment.findFirst({
      where: { patientId, professional: { userId: user.id } },
      select: { id: true },
    });
    allowed = !!seen;
  }
  if (!allowed) notFound();

  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  if (!patient) notFound();

  const [antecedentsHistory, notes] = await Promise.all([
    listAntecedentsHistory(patientId),
    listClinicalNotesForPatient(patientId),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton auto={!!auto} />
      </div>
      <ClinicalHistoryPrint
        patient={patient}
        antecedentsHistory={antecedentsHistory}
        notes={notes}
        printedBy={user.name ?? "—"}
      />
    </div>
  );
}
