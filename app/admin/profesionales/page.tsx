import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProfessional } from "@/actions/admin-professionals";

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Ingresá el nombre del profesional.",
};

export default async function AdminProfesionalesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [professionals, institutions] = await Promise.all([
    prisma.professional.findMany({
      include: {
        specialties: { include: { specialty: true } },
        institution: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Profesionales</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form
        action={createProfessional}
        className="mt-6 flex max-w-lg flex-col gap-3 rounded-lg border border-border bg-surface p-4"
      >
        <div>
          <label htmlFor="fullName" className="text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="bio" className="text-sm font-medium">
            Bio (opcional)
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={2}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="institutionId" className="text-sm font-medium">
            Institución (opcional)
          </label>
          <select
            id="institutionId"
            name="institutionId"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          >
            <option value="">Sin asignar</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
        >
          Crear profesional
        </button>
      </form>

      <div className="mt-8 divide-y divide-border">
        {professionals.map((p) => (
          <Link
            key={p.id}
            href={`/admin/profesionales/${p.id}`}
            className="flex items-center justify-between py-3 hover:opacity-70"
          >
            <div>
              <p className="font-medium">
                {p.fullName}{" "}
                {!p.active && (
                  <span className="text-xs text-muted">(inactivo)</span>
                )}
              </p>
              <p className="text-sm text-muted">
                {p.specialties.map((ps) => ps.specialty.name).join(", ") ||
                  "Sin especialidades"}
                {p.institution ? ` · ${p.institution.name}` : " · Sin institución"}
              </p>
            </div>
          </Link>
        ))}

        {professionals.length === 0 && (
          <p className="py-4 text-sm text-muted">
            No hay profesionales cargados.
          </p>
        )}
      </div>
    </div>
  );
}
