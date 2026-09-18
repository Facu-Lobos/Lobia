import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProfessional } from "@/actions/admin-professionals";

const ERROR_MESSAGES: Record<string, string> = {
  nombre: "Ingresá nombre y apellido del profesional.",
  horario: "Revisá el horario: la hora de inicio debe ser anterior a la de fin.",
};

const DAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

export default async function AdminProfesionalesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [professionals, institutions, specialties] = await Promise.all([
    prisma.professional.findMany({
      include: {
        specialties: { include: { specialty: true } },
        institution: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
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
        <p className="text-xs text-muted">
          Se le crea acceso automático a su portal: usuario = apellido,
          contraseña = apellido en minúscula + &quot;1234&quot;.
        </p>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="mp" className="text-sm font-medium">
              MP (opcional)
            </label>
            <input
              id="mp"
              name="mp"
              placeholder="Matrícula provincial"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="mn" className="text-sm font-medium">
              MN (opcional)
            </label>
            <input
              id="mn"
              name="mn"
              placeholder="Matrícula nacional"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="dni" className="text-sm font-medium">
              DNI (opcional)
            </label>
            <input
              id="dni"
              name="dni"
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
        </div>

        {specialties.length > 0 && (
          <div>
            <label htmlFor="specialtyId" className="text-sm font-medium">
              Especialidad (opcional)
            </label>
            <select
              id="specialtyId"
              name="specialtyId"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            >
              <option value="">Sin especialidad</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <p className="text-sm font-medium">Horario semanal (opcional)</p>
          <p className="text-xs text-muted">
            Se puede cargar más de uno, o agregarlos después, desde la ficha
            del profesional.
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="dayOfWeek" className="text-sm font-medium">
                Día
              </label>
              <select
                id="dayOfWeek"
                name="dayOfWeek"
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              >
                {DAY_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startTime" className="text-sm font-medium">
                Desde
              </label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="text-sm font-medium">
                Hasta
              </label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="slotMinutes" className="text-sm font-medium">
                Duración (min)
              </label>
              <input
                id="slotMinutes"
                name="slotMinutes"
                type="number"
                min={5}
                step={5}
                defaultValue={30}
                className="mt-1 w-24 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
          </div>
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
