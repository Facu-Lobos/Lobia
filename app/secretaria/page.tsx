import Link from "next/link";
import { requireSecretary } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function SecretariaInicioPage() {
  const { user, institutionId } = await requireSecretary();

  const [patientCount, todayCount] = await Promise.all([
    prisma.user.count({ where: { role: "PATIENT" } }),
    prisma.appointment.count({
      where: {
        status: "BOOKED",
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
        ...(institutionId ? { professional: { institutionId } } : {}),
      },
    }),
  ]);

  const cards = [
    { label: "Pacientes registrados", value: patientCount, href: "/secretaria/pacientes" },
    { label: "Turnos de hoy", value: todayCount, href: "/secretaria/asignar-turno" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Hola, {user.name}
      </h1>
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
