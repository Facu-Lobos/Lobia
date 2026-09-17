import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSecretary } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

function formatShortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default async function SecretariaProfesionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { institutionId } = await requireSecretary();
  const { id } = await params;

  const professional = await prisma.professional.findUnique({
    where: { id },
    include: {
      specialties: { include: { specialty: true } },
      schedules: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
      extraDays: { orderBy: { date: "asc" } },
      licenses: { orderBy: { startDate: "asc" } },
    },
  });

  if (!professional || (institutionId && professional.institutionId !== institutionId)) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/secretaria/profesionales"
        className="text-sm text-muted hover:text-foreground"
      >
        ← Volver a Profesionales
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {professional.fullName}{" "}
        {!professional.active && (
          <span className="text-sm text-muted">(inactivo)</span>
        )}
      </h1>
      {professional.bio && (
        <p className="mt-1 text-muted">{professional.bio}</p>
      )}

      <section className="mt-8">
        <h2 className="font-medium">Especialidades</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {professional.specialties.map((ps) => (
            <span
              key={ps.specialtyId}
              className="rounded-full border border-border bg-surface px-3 py-1 text-sm"
            >
              {ps.specialty.name}
            </span>
          ))}
          {professional.specialties.length === 0 && (
            <p className="text-sm text-muted">Sin especialidades asignadas.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Horarios semanales</h2>
        <div className="mt-3 space-y-2">
          {professional.schedules.map((s) => (
            <div
              key={s.id}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm"
            >
              {DAY_NAMES[s.dayOfWeek]}: {s.startTime} a {s.endTime} (turnos de{" "}
              {s.slotMinutes} min)
            </div>
          ))}
          {professional.schedules.length === 0 && (
            <p className="text-sm text-muted">Sin horarios cargados.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Días adicionales</h2>
        <div className="mt-3 space-y-2">
          {professional.extraDays.map((e) => (
            <div
              key={e.id}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm"
            >
              {formatShortDate(e.date)}: {e.startTime} a {e.endTime} (turnos de{" "}
              {e.slotMinutes} min)
            </div>
          ))}
          {professional.extraDays.length === 0 && (
            <p className="text-sm text-muted">Sin días adicionales cargados.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Licencias</h2>
        <div className="mt-3 space-y-2">
          {professional.licenses.map((l) => (
            <div
              key={l.id}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm"
            >
              {formatShortDate(l.startDate)} a {formatShortDate(l.endDate)}
              {l.reason ? ` — ${l.reason}` : ""}
            </div>
          ))}
          {professional.licenses.length === 0 && (
            <p className="text-sm text-muted">Sin licencias cargadas.</p>
          )}
        </div>
      </section>
    </div>
  );
}
