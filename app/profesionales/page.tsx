import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProfesionalesPage({
  searchParams,
}: {
  searchParams: Promise<{ especialidad?: string }>;
}) {
  const { especialidad } = await searchParams;

  const [specialties, professionals] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
    prisma.professional.findMany({
      where: {
        active: true,
        ...(especialidad
          ? { specialties: { some: { specialtyId: especialidad } } }
          : {}),
      },
      include: { specialties: { include: { specialty: true } } },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Profesionales</h1>
      <p className="mt-2 text-muted">
        Buscá por especialidad y reservá tu turno.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/profesionales"
          className={`rounded-full border px-4 py-1.5 text-sm ${
            !especialidad
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface hover:border-primary"
          }`}
        >
          Todas
        </Link>
        {specialties.map((s) => (
          <Link
            key={s.id}
            href={`/profesionales?especialidad=${s.id}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              especialidad === s.id
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface hover:border-primary"
            }`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {professionals.map((p) => (
          <Link
            key={p.id}
            href={`/profesionales/${p.id}`}
            className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary"
          >
            <h2 className="font-medium">{p.fullName}</h2>
            <p className="mt-1 text-sm text-accent">
              {p.specialties.map((ps) => ps.specialty.name).join(", ")}
            </p>
            {p.bio && (
              <p className="mt-2 line-clamp-2 text-sm text-muted">{p.bio}</p>
            )}
          </Link>
        ))}

        {professionals.length === 0 && (
          <p className="col-span-2 text-muted">
            No se encontraron profesionales para esta especialidad.
          </p>
        )}
      </div>
    </div>
  );
}
