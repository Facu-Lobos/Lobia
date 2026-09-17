import { notFound } from "next/navigation";
import { requireSecretary } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { listDocumentsForPatient } from "@/lib/documents";
import { uploadPatientDocument } from "@/actions/secretary";

function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export default async function SecretariaPacienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subido?: string; error?: string }>;
}) {
  await requireSecretary();
  const { id } = await params;
  const { subido, error } = await searchParams;

  const patient = await prisma.user.findUnique({
    where: { id, role: "PATIENT" },
  });
  if (!patient) notFound();

  const documents = await listDocumentsForPatient(id);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{patient.name}</h1>
      <p className="mt-1 text-muted">
        {patient.email} {patient.phone ? `· ${patient.phone}` : ""}
      </p>

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
        <h2 className="font-medium">Subir documento</h2>
        <p className="text-sm text-muted">
          Resultados de laboratorio, imágenes, informes — el paciente los ve
          desde su portal.
        </p>
        <form
          action={uploadPatientDocument}
          className="mt-3 flex max-w-lg flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <input type="hidden" name="patientId" value={patient.id} />
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Título
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="Ej: Análisis de sangre"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="file" className="text-sm font-medium">
              Archivo
            </label>
            <input
              id="file"
              name="file"
              type="file"
              required
              className="mt-1 w-full text-sm"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Subir
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Documentos</h2>
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
    </div>
  );
}
