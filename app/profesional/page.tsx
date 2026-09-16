import Link from "next/link";
import { requireSpecialist } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function ProfesionalInicioPage() {
  const { user, professional } = await requireSpecialist();

  const [upcomingAppointments, scheduleCount] = await Promise.all([
    prisma.appointment.count({
      where: {
        professionalId: professional.id,
        status: "BOOKED",
        date: { gte: new Date() },
      },
    }),
    prisma.scheduleSlot.count({ where: { professionalId: professional.id } }),
  ]);

  const cards = [
    {
      label: "Turnos próximos",
      value: upcomingAppointments,
      href: "/profesional/turnos",
    },
    {
      label: "Horarios semanales",
      value: scheduleCount,
      href: "/profesional/agenda",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Hola, {user.name}
      </h1>
      <p className="mt-1 text-muted">
        Este es tu panel como {professional.fullName}.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
