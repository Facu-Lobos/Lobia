import Link from "next/link";
import { requireManager } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function EncargadoInicioPage() {
  const { user, institutionId } = await requireManager();

  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  const [professionalCount, upcomingAppointments, staffCount] =
    await Promise.all([
      prisma.professional.count({ where: { institutionId, active: true } }),
      prisma.appointment.count({
        where: {
          status: "BOOKED",
          date: { gte: new Date() },
          professional: { institutionId },
        },
      }),
      prisma.user.count({ where: { institutionId, role: "SECRETARY" } }),
    ]);

  const cards = [
    {
      label: "Profesionales activos",
      value: professionalCount,
      href: "/encargado/profesionales",
    },
    {
      label: "Turnos próximos",
      value: upcomingAppointments,
      href: "/encargado/turnos",
    },
    {
      label: "Cuentas de secretaria",
      value: staffCount,
      href: "/encargado/personal",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Hola, {user.name}
      </h1>
      <p className="mt-1 text-muted">
        Panel de {institution?.name ?? "tu institución"}.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary"
          >
            <p className="text-3xl font-semibold text-primary">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-muted">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
