import { requireManager } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createPatient } from "@/actions/manager";

export default async function EncargadoPacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; creado?: string }>;
}) {
  await requireManager();
  const { q, error, creado } = await searchParams;

  const patients = q
    ? await prisma.user.findMany({
        where: {
          role: "PATIENT",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { dni: { contains: q } },
          ],
        },
        orderBy: { name: "asc" },
        take: 20,
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>

      {error && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </p>
      )}
      {creado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Paciente creado.
        </p>
      )}

      <section className="mt-6">
        <h2 className="font-medium">Buscar paciente</h2>
        <form method="get" className="mt-3 flex max-w-md gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Nombre, apellido o DNI"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 hover:border-primary"
          >
            Buscar
          </button>
        </form>

        <div className="mt-4 divide-y divide-border">
          {patients.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted">
                  {p.dni ? `DNI ${p.dni}` : p.email}
                  {p.phone ? ` · ${p.phone}` : ""}
                </p>
              </div>
              <a
                href={`/encargado/pacientes/${p.id}`}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary"
              >
                Ficha
              </a>
            </div>
          ))}
          {q && patients.length === 0 && (
            <p className="py-4 text-sm text-muted">
              No se encontraron pacientes para &quot;{q}&quot;.
            </p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Nuevo paciente</h2>
        <form
          action={createPatient}
          className="mt-3 flex max-w-lg flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Nombre completo
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              Teléfono (opcional)
            </label>
            <input
              id="phone"
              name="phone"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-muted">
              El paciente puede usarla más adelante para entrar por su cuenta.
            </p>
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Crear paciente
          </button>
        </form>
      </section>
    </div>
  );
}
