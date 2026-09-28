import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import {
  listAntecedentsHistory,
  listClinicalNotesForPatient,
} from "@/lib/clinical";
import { AntecedentsVersions } from "@/components/AntecedentsVersions";

function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export default async function MiHistoriaClinicaPage() {
  const user = await requireUser();

  const [antecedentsHistory, notes] = await Promise.all([
    listAntecedentsHistory(user.id),
    listClinicalNotesForPatient(user.id),
  ]);

  const antecedents = antecedentsHistory[0] ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/mis-turnos" className="text-sm text-muted hover:text-foreground">
        ← Volver a Mis Turnos
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Mi historia clínica
        </h1>
        <a
          href={`/imprimir/historia-clinica/${user.id}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-primary"
        >
          Imprimir
        </a>
      </div>

      <section className="mt-6">
        <h2 className="font-medium">Antecedentes</h2>
        {!antecedents ? (
          <p className="mt-2 text-sm text-muted">
            Todavía no hay antecedentes cargados.
          </p>
        ) : (
          <div className="mt-3 space-y-2 rounded-lg border border-border bg-surface p-4 text-sm">
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
        )}
        <AntecedentsVersions entries={antecedentsHistory} />
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Consultas</h2>
        <div className="mt-3 space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-md border border-border bg-surface px-4 py-3 text-sm"
            >
              <p className="font-medium">
                {formatDate(note.appointment.date)} ·{" "}
                {note.appointment.professional.fullName}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{note.text}</p>
              {note.linkUrl && (
                <a
                  href={note.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-primary hover:underline"
                >
                  {note.linkUrl}
                </a>
              )}
              {note.document && (
                <a
                  href={`/api/documents/${note.document.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-primary hover:underline"
                >
                  📎 {note.document.title}
                </a>
              )}
            </div>
          ))}
          {notes.length === 0 && (
            <p className="text-sm text-muted">
              Todavía no hay consultas registradas.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
