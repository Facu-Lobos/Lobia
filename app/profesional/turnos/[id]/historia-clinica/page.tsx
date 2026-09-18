import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSpecialist } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  getPatientAntecedents,
  listClinicalNotesForPatient,
} from "@/lib/clinical";
import { listDocumentsForPatient } from "@/lib/documents";
import {
  updatePatientAntecedentsFromAppointment,
  upsertClinicalNote,
  uploadClinicalDocument,
} from "@/actions/specialist";

function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export default async function HistoriaClinicaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    actualizado?: string;
    guardado?: string;
    subido?: string;
    error?: string;
  }>;
}) {
  const { professional } = await requireSpecialist();
  const { id: appointmentId } = await params;
  const { actualizado, guardado, subido, error } = await searchParams;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true, clinicalNote: true },
  });
  if (!appointment) notFound();
  if (appointment.professionalId !== professional.id) {
    redirect("/profesional/turnos?error=noautorizado");
  }

  const [antecedents, otherNotes, documents] = await Promise.all([
    getPatientAntecedents(appointment.patientId),
    listClinicalNotesForPatient(appointment.patientId, appointmentId),
    listDocumentsForPatient(appointment.patientId),
  ]);

  return (
    <div>
      <Link
        href="/profesional/turnos"
        className="text-sm text-muted hover:text-foreground"
      >
        ← Volver a Turnos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Historia clínica — {appointment.patient.name}
      </h1>
      <p className="mt-1 text-muted">Consulta del {formatDate(appointment.date)}</p>

      {(actualizado || guardado) && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Guardado correctamente.
        </p>
      )}
      {subido && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Documento subido.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-medium">Antecedentes</h2>
        <p className="text-sm text-muted">
          Compartidos entre todos los profesionales que atienden a este
          paciente.
        </p>
        <form
          action={updatePatientAntecedentsFromAppointment}
          className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <input type="hidden" name="appointmentId" value={appointment.id} />
          <div>
            <label htmlFor="allergies" className="text-sm font-medium">
              Alergias
            </label>
            <textarea
              id="allergies"
              name="allergies"
              rows={2}
              defaultValue={antecedents?.allergies ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="chronicConditions" className="text-sm font-medium">
              Enfermedades crónicas
            </label>
            <textarea
              id="chronicConditions"
              name="chronicConditions"
              rows={2}
              defaultValue={antecedents?.chronicConditions ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="currentMedications" className="text-sm font-medium">
              Medicación habitual
            </label>
            <textarea
              id="currentMedications"
              name="currentMedications"
              rows={2}
              defaultValue={antecedents?.currentMedications ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="antecedentsNotes" className="text-sm font-medium">
              Otros antecedentes
            </label>
            <textarea
              id="antecedentsNotes"
              name="antecedentsNotes"
              rows={2}
              defaultValue={antecedents?.notes ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Guardar antecedentes
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Evolución de esta consulta</h2>
        <form
          action={upsertClinicalNote}
          className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <input type="hidden" name="appointmentId" value={appointment.id} />
          <div>
            <label htmlFor="reason" className="text-sm font-medium">
              Motivo de consulta
            </label>
            <input
              id="reason"
              name="reason"
              defaultValue={appointment.clinicalNote?.reason ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="diagnosis" className="text-sm font-medium">
              Diagnóstico
            </label>
            <input
              id="diagnosis"
              name="diagnosis"
              defaultValue={appointment.clinicalNote?.diagnosis ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="notes" className="text-sm font-medium">
              Notas / examen
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={appointment.clinicalNote?.notes ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="treatment" className="text-sm font-medium">
              Indicaciones / tratamiento
            </label>
            <textarea
              id="treatment"
              name="treatment"
              rows={3}
              defaultValue={appointment.clinicalNote?.treatment ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Guardar evolución
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Documentos</h2>
        <p className="text-sm text-muted">
          Análisis, imágenes, informes — el paciente los ve desde su portal.
        </p>
        <form
          action={uploadClinicalDocument}
          className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="appointmentId" value={appointment.id} />
          <div className="flex-1">
            <label htmlFor="title" className="text-sm font-medium">
              Título
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="Ej: Radiografía de tórax"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="file" className="text-sm font-medium">
              Archivo
            </label>
            <input id="file" name="file" type="file" required className="mt-1 w-full text-sm" />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Subir
          </button>
        </form>

        <div className="mt-3 space-y-2">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={`/api/documents/${doc.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm hover:border-primary"
            >
              <span className="font-medium">{doc.title}</span>
              <span className="text-muted">{formatDate(doc.createdAt)}</span>
            </a>
          ))}
          {documents.length === 0 && (
            <p className="text-sm text-muted">Sin documentos todavía.</p>
          )}
        </div>
      </section>

      {otherNotes.length > 0 && (
        <section className="mt-10">
          <h2 className="font-medium">Historial previo</h2>
          <div className="mt-3 space-y-2">
            {otherNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-md border border-border bg-surface/60 px-4 py-3 text-sm"
              >
                <p className="font-medium">
                  {formatDate(note.appointment.date)} ·{" "}
                  {note.appointment.professional.fullName}
                </p>
                {note.reason && <p className="mt-1">Motivo: {note.reason}</p>}
                {note.diagnosis && (
                  <p className="mt-1">Diagnóstico: {note.diagnosis}</p>
                )}
                {note.notes && <p className="mt-1 text-muted">{note.notes}</p>}
                {note.treatment && (
                  <p className="mt-1 text-muted">
                    Indicaciones: {note.treatment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
