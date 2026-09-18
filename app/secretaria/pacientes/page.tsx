import { prisma } from "@/lib/prisma";
import { createPatient } from "@/actions/secretary";
import { listAllHealthInsuranceNames } from "@/lib/health-insurance";

export default async function SecretariaPacientesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    error?: string;
    creado?: string;
    usuario?: string;
    clave?: string;
  }>;
}) {
  const { q, error, creado, usuario, clave } = await searchParams;

  const [patients, healthInsuranceOptions] = await Promise.all([
    q
      ? prisma.user.findMany({
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
      : Promise.resolve([]),
    listAllHealthInsuranceNames(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>

      {error && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </p>
      )}
      {creado && usuario && clave && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Paciente creado. Acceso: usuario{" "}
          <span className="font-medium">{usuario}</span>, contraseña{" "}
          <span className="font-medium">{clave}</span>.
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
              <div className="flex gap-2">
                <a
                  href={`/secretaria/pacientes/${p.id}`}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary"
                >
                  Ficha
                </a>
                <a
                  href={`/secretaria/asignar-turno?patientId=${p.id}`}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary"
                >
                  Asignar turno
                </a>
              </div>
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
        <p className="mt-1 text-sm text-muted">
          Entra con su DNI como usuario; la contraseña son los últimos 3
          números de ese DNI.
        </p>
        <form
          action={createPatient}
          className="mt-3 flex max-w-lg flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="text-sm font-medium">
                Nombre
              </label>
              <input
                id="firstName"
                name="firstName"
                required
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="text-sm font-medium">
                Apellido
              </label>
              <input
                id="lastName"
                name="lastName"
                required
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label htmlFor="dni" className="text-sm font-medium">
              DNI
            </label>
            <input
              id="dni"
              name="dni"
              required
              placeholder="Sin puntos"
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
            <label htmlFor="birthDate" className="text-sm font-medium">
              Fecha de nacimiento (opcional)
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
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
            <label htmlFor="healthInsurance" className="text-sm font-medium">
              Obra social (opcional)
            </label>
            <select
              id="healthInsurance"
              name="healthInsurance"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            >
              <option value="">Particular (sin obra social)</option>
              {healthInsuranceOptions.map((name) => (
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
              Número de afiliado (opcional)
            </label>
            <input
              id="healthInsuranceNumber"
              name="healthInsuranceNumber"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
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
