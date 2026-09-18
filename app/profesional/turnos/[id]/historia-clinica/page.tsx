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
  addClinicalNote,
  uploadClinicalDocument,
} from "@/actions/specialist";

function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatDateTime(date: Date) {
  return `${formatDate(date)} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
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
    include: { patient: true },
  });
  if (!appointment) notFound();
  if (appointment.professionalId !== professional.id) {
    redirect("/profesional/turnos?error=noautorizado");
  }

  const [antecedents, allNotes, documents] = await Promise.all([
    getPatientAntecedents(appointment.patientId),
    listClinicalNotesForPatient(appointment.patientId),
    listDocumentsForPatient(appointment.patientId),
  ]);

  const notesForThisVisit = allNotes.filter(
    (note) => note.appointmentId === appointmentId
  );
  const otherNotes = allNotes.filter(
    (note) => note.appointmentId !== appointmentId
  );

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
        <p className="text-sm text-muted">
          Texto libre. Cada vez que guardás se agrega como una entrada nueva
          — el campo queda en blanco para seguir escribiendo.
        </p>

        {notesForThisVisit.length > 0 && (
          <div className="mt-3 space-y-2">
            {notesForThisVisit.map((note) => (
              <div
                key={note.id}
                className="rounded-md border border-border bg-surface px-4 py-3 text-sm"
              >
                <p className="text-xs text-muted">
                  {formatDateTime(note.createdAt)}
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
          </div>
        )}

        <form
          action={addClinicalNote}
          className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <input type="hidden" name="appointmentId" value={appointment.id} />
          <div>
            <textarea
              id="text"
              name="text"
              required
              rows={4}
              placeholder="Escribí la evolución del paciente..."
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label htmlFor="linkUrl" className="text-sm font-medium">
                Link (opcional)
              </label>
              <input
                id="linkUrl"
                name="linkUrl"
                type="url"
                placeholder="Ej: link a un estudio online"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="file" className="text-sm font-medium">
                Adjuntar imagen (opcional)
              </label>
              <input id="file" name="file" type="file" accept="image/*,.pdf" className="mt-1 w-full text-sm" />
            </div>
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Guardar
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
            <label htmlFor="docFile" className="text-sm font-medium">
              Archivo
            </label>
            <input id="docFile" name="file" type="file" required className="mt-1 w-full text-sm" />
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
                <p className="mt-1 whitespace-pre-wrap text-muted">{note.text}</p>
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
          </div>
        </section>
      )}
    </div>
  );
}
