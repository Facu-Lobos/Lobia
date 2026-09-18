import { prisma } from "@/lib/prisma";
import { createSecretary, createManager } from "@/actions/admin-staff";
import { PasswordInput } from "@/components/PasswordInput";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SPECIALIST: "Especialista",
  SECRETARY: "Secretaria",
  MANAGER: "Encargado",
};

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Ingresá el nombre.",
  usuario:
    "El usuario debe tener entre 3 y 40 caracteres: letras, números, puntos, guiones o guiones bajos.",
  password: "La contraseña debe tener al menos 6 caracteres.",
  usuarioexistente: "Ya existe una cuenta con ese usuario.",
  institucion: "Elegí una institución.",
};

export default async function AdminPersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; creado?: string }>;
}) {
  const { error, creado } = await searchParams;

  const [staff, institutions] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SPECIALIST", "SECRETARY", "MANAGER"] } },
      include: { professional: true, institution: true },
      orderBy: { role: "asc" },
    }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Personal</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {creado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Cuenta creada.
        </p>
      )}

      <section className="mt-6">
        <h2 className="font-medium">Cuentas existentes</h2>
        <div className="mt-3 divide-y divide-border">
          {staff.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-muted">
                  {u.username ? `@${u.username}` : u.email}
                </p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                {ROLE_LABELS[u.role] ?? u.role}
                {u.professional ? ` · ${u.professional.fullName}` : ""}
                {u.institution ? ` · ${u.institution.name}` : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Nueva cuenta de secretaria</h2>
        <p className="mt-1 text-sm text-muted">
          Los accesos de especialista se otorgan desde la ficha del
          profesional en Profesionales.
        </p>
        <form
          action={createSecretary}
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
            <label htmlFor="username" className="text-sm font-medium">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              required
              minLength={3}
              maxLength={40}
              pattern="[a-z0-9._-]+"
              title="Letras minúsculas, números, puntos, guiones o guiones bajos."
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={6}
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
            Crear cuenta
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Nueva cuenta de encargado</h2>
        <p className="mt-1 text-sm text-muted">
          Un encargado ve y gestiona todo lo de una institución (profesionales,
          horarios, turnos, personal), sin salirse de ella.
        </p>
        {institutions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Creá primero una institución en la sección Instituciones.
          </p>
        ) : (
          <form
            action={createManager}
            className="mt-3 flex max-w-lg flex-col gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <div>
              <label htmlFor="managerName" className="text-sm font-medium">
                Nombre completo
              </label>
              <input
                id="managerName"
                name="name"
                required
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="managerUsername" className="text-sm font-medium">
                Usuario
              </label>
              <input
                id="managerUsername"
                name="username"
                required
                minLength={3}
                maxLength={40}
                pattern="[a-z0-9._-]+"
                title="Letras minúsculas, números, puntos, guiones o guiones bajos."
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="managerPassword" className="text-sm font-medium">
                Contraseña
              </label>
              <PasswordInput
                id="managerPassword"
                name="password"
                required
                minLength={6}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="managerInstitutionId"
                className="text-sm font-medium"
              >
                Institución
              </label>
              <select
                id="managerInstitutionId"
                name="institutionId"
                required
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              >
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
              Crear cuenta
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
