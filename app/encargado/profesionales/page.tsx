import Link from "next/link";
import { requireManager } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createProfessional } from "@/actions/manager";

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Ingresá el nombre del profesional.",
  noautorizado: "Ese profesional no pertenece a tu institución.",
};

export default async function EncargadoProfesionalesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { institutionId } = await requireManager();
  const { error } = await searchParams;

  const professionals = await prisma.professional.findMany({
    where: { institutionId },
    include: { specialties: { include: { specialty: true } } },
    orderBy: { fullName: "asc" },
  });

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
            href={`/encargado/profesionales/${p.id}`}
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
              </p>
            </div>
          </Link>
        ))}

        {professionals.length === 0 && (
          <p className="py-4 text-sm text-muted">
            No hay profesionales cargados en tu institución.
          </p>
        )}
      </div>
    </div>
  );
}
