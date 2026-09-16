import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminInicioPage() {
  const [specialties, professionals, upcomingAppointments] =
    await Promise.all([
      prisma.specialty.count(),
      prisma.professional.count({ where: { active: true } }),
      prisma.appointment.count({
        where: { status: "BOOKED", date: { gte: new Date() } },
      }),
    ]);

  const cards = [
    { label: "Especialidades", value: specialties, href: "/admin/especialidades" },
    { label: "Profesionales activos", value: professionals, href: "/admin/profesionales" },
    { label: "Turnos próximos", value: upcomingAppointments, href: "/admin/turnos" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Panel de administración
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary"
          >
            <p className="text-3xl font-semibold text-primary">{card.value}</p>
            <p className="mt-1 text-sm text-muted">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
