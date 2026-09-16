import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LobiaWordmark from "@/components/LobiaWordmark";

export default async function Home() {
  const specialties = await prisma.specialty.findMany({
    orderBy: { name: "asc" },
    take: 8,
  });

  return (
    <div>
      <div className="bg-primary text-white">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="max-w-2xl">
            <LobiaWordmark className="text-2xl sm:text-3xl" strokeWidth={2} />
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Sacá tu turno médico online
            </h1>
            <p className="mt-4 text-lg text-white/75">
              Elegí un profesional por especialidad y reservá tu turno al
              instante, sin llamadas ni esperas.
            </p>
            <Link
              href="/profesionales"
              className="mt-8 inline-block rounded-md bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover"
            >
              Buscar profesionales
            </Link>
          </div>
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            Especialidades
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {specialties.map((s) => (
              <Link
                key={s.id}
                href={`/profesionales?especialidad=${s.id}`}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
