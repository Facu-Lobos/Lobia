import { requireManager } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createSecretaryForInstitution } from "@/actions/manager";
import { PasswordInput } from "@/components/PasswordInput";

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Ingresá el nombre.",
  usuario:
    "El usuario debe tener entre 3 y 40 caracteres: letras, números, puntos, guiones o guiones bajos.",
  password: "La contraseña debe tener al menos 6 caracteres.",
  usuarioexistente: "Ya existe una cuenta con ese usuario.",
};

export default async function EncargadoPersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; creado?: string }>;
}) {
  const { institutionId } = await requireManager();
  const { error, creado } = await searchParams;

  const secretaries = await prisma.user.findMany({
    where: { institutionId, role: "SECRETARY" },
    orderBy: { name: "asc" },
  });

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
          Cuenta de secretaria creada.
        </p>
      )}

      <section className="mt-6">
        <h2 className="font-medium">Secretarias de tu institución</h2>
        <div className="mt-3 divide-y divide-border">
          {secretaries.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-muted">@{u.username}</p>
              </div>
            </div>
          ))}
          {secretaries.length === 0 && (
            <p className="py-4 text-sm text-muted">
              No hay secretarias cargadas todavía.
            </p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Nueva cuenta de secretaria</h2>
        <form
          action={createSecretaryForInstitution}
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
          <button
            type="submit"
            className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Crear cuenta
          </button>
        </form>
      </section>
    </div>
  );
}
