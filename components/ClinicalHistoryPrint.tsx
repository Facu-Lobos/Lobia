import type {
  listAntecedentsHistory,
  listClinicalNotesForPatient,
} from "@/lib/clinical";
import { AntecedentsVersions } from "@/components/AntecedentsVersions";
import {
  formatAppointmentDate,
  formatDateAR,
  formatDateTimeAR,
} from "@/lib/print-format";

type Notes = Awaited<ReturnType<typeof listClinicalNotesForPatient>>;

type Patient = {
  name: string;
  dni: string | null;
  birthDate: Date | null;
  healthInsurance: string | null;
  healthInsuranceNumber: string | null;
};

type AntecedentsHistory = Awaited<ReturnType<typeof listAntecedentsHistory>>;

// Historia clínica completa del paciente, en orden cronológico (de la
// evolución más vieja a la más nueva). Las entradas no se editan: una
// corrección es una entrada nueva que aclara la anterior.
export function ClinicalHistoryPrint({
  patient,
  antecedentsHistory,
  notes,
  printedBy,
}: {
  patient: Patient;
  antecedentsHistory: AntecedentsHistory;
  notes: Notes;
  printedBy: string;
}) {
  const antecedents = antecedentsHistory[0] ?? null;
  const chronological = [...notes].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-6 print:border-0 print:p-0">
      <h1 className="text-xl font-semibold">Historia clínica</h1>

      <div className="mt-4 space-y-1 text-sm">
        <p>
          <span className="font-medium">Paciente: </span>
          {patient.name}
        </p>
        <p>
          <span className="font-medium">DNI: </span>
          {patient.dni || "—"}
          {patient.birthDate && (
            <>
              {" · "}
              <span className="font-medium">Fecha de nacimiento: </span>
              {formatAppointmentDate(patient.birthDate)}
            </>
          )}
        </p>
        <p>
          <span className="font-medium">Obra social: </span>
          {patient.healthInsurance || "Particular"}
          {patient.healthInsuranceNumber
            ? ` · Afiliado ${patient.healthInsuranceNumber}`
            : ""}
        </p>
      </div>

      <section className="mt-6">
        <h2 className="border-b border-border pb-1 font-medium">Antecedentes</h2>
        {antecedents ? (
          <div className="mt-2 space-y-1 text-sm">
            <p>
              <span className="font-medium">Alergias: </span>
              {antecedents.allergies || "—"}
            </p>
            <p>
              <span className="font-medium">Enfermedades crónicas: </span>
              {antecedents.chronicConditions || "—"}
            </p>
            <p>
              <span className="font-medium">Medicación habitual: </span>
              {antecedents.currentMedications || "—"}
            </p>
            <p>
              <span className="font-medium">Otros: </span>
              {antecedents.notes || "—"}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Sin antecedentes cargados.</p>
        )}
        <AntecedentsVersions entries={antecedentsHistory} open />
      </section>

      <section className="mt-6">
        <h2 className="border-b border-border pb-1 font-medium">Evolución</h2>
        <div className="mt-2 space-y-3">
          {chronological.map((note) => (
            <div key={note.id} className="break-inside-avoid text-sm">
              <p className="font-medium">
                {formatDateTimeAR(note.createdAt)} ·{" "}
                {note.appointment.professional.fullName}
                <span className="font-normal text-muted">
                  {" "}
                  (consulta del {formatAppointmentDate(note.appointment.date)})
                </span>
              </p>
              <p className="mt-1 whitespace-pre-wrap">{note.text}</p>
              {note.linkUrl && (
                <p className="mt-1 break-all text-muted">Link: {note.linkUrl}</p>
              )}
              {note.document && (
                <p className="mt-1 text-muted">Adjunto: {note.document.title}</p>
              )}
            </div>
          ))}
          {chronological.length === 0 && (
            <p className="text-sm text-muted">
              Todavía no hay evoluciones registradas.
            </p>
          )}
        </div>
      </section>

      <p className="mt-8 border-t border-border pt-2 text-xs text-muted">
        Impreso el {formatDateAR(new Date())} por {printedBy}. Las entradas de
        la historia clínica no se modifican: una corrección se registra como
        una entrada nueva.
      </p>
    </div>
  );
}
