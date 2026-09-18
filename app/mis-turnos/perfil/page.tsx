import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { updateOwnProfile } from "@/actions/patient";
import { listAllHealthInsuranceNames } from "@/lib/health-insurance";

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Completá nombre y apellido.",
};

// El nombre se guarda como un único campo ("name"); acá se separa en
// nombre/apellido sólo para precargar el formulario (primera palabra vs
// resto). Al guardar, actions/patient.ts los vuelve a unir.
function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return { firstName: firstName ?? "", lastName: rest.join(" ") };
}

export default async function MiPerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ actualizado?: string; error?: string }>;
}) {
  const sessionUser = await requireUser();
  const { actualizado, error } = await searchParams;

  const [user, healthInsuranceOptions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } }),
    listAllHealthInsuranceNames(),
  ]);
  const { firstName, lastName } = splitName(user.name);
  const healthInsuranceValue = user.healthInsurance ?? "";
  const options =
    healthInsuranceValue && !healthInsuranceOptions.includes(healthInsuranceValue)
      ? [healthInsuranceValue, ...healthInsuranceOptions]
      : healthInsuranceOptions;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Link href="/mis-turnos" className="text-sm text-muted hover:text-foreground">
        ← Volver a Mis Turnos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Mi perfil</h1>

      {actualizado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Datos actualizados.
        </p>
      )}
      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form
        action={updateOwnProfile}
        className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-surface p-4"
      >
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            value={user.email ?? ""}
            disabled
            className="mt-1 w-full rounded-md border border-border bg-surface/60 px-3 py-2 text-muted outline-none"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="firstName" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="firstName"
              name="firstName"
              required
              defaultValue={firstName}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="lastName" className="text-sm font-medium">
              Apellido
            </label>
            <input
              id="lastName"
              name="lastName"
              required
              defaultValue={lastName}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={user.phone ?? ""}
            placeholder="Ej: 54911xxxxxxx"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="healthInsurance" className="text-sm font-medium">
            Obra social
          </label>
          <select
            id="healthInsurance"
            name="healthInsurance"
            defaultValue={healthInsuranceValue}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          >
            <option value="">Particular (sin obra social)</option>
            {options.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="healthInsuranceNumber"
            className="text-sm font-medium"
          >
            Número de afiliado
          </label>
          <input
            id="healthInsuranceNumber"
            name="healthInsuranceNumber"
            defaultValue={user.healthInsuranceNumber ?? ""}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
