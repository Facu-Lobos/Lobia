import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LobiaWordmark from "@/components/LobiaWordmark";

export default async function Home() {
  const institutions = await prisma.institution.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
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
              Elegí tu institución y reservá tu turno al instante, sin
              llamadas ni esperas.
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

      {institutions.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            Instituciones
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {institutions.map((inst) => (
              <Link
                key={inst.id}
                href={`/profesionales?institucion=${inst.id}`}
                className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary"
              >
                <h3 className="font-medium">{inst.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
