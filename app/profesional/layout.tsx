import Link from "next/link";
import { requireSpecialist } from "@/lib/auth-helpers";

export default async function ProfesionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSpecialist();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-8 flex gap-1 border-b border-border pb-0 text-sm">
        {[
          { href: "/profesional", label: "Inicio" },
          { href: "/profesional/agenda", label: "Agenda" },
          { href: "/profesional/turnos", label: "Turnos" },
          { href: "/profesional/sala-espera", label: "Sala de espera" },
          { href: "/profesional/llamador", label: "Llamador" },
          { href: "/profesional/consultorio", label: "Consultorio" },
          { href: "/profesional/mensajes", label: "Mensajes" },
          { href: "/profesional/pagos", label: "Pagos" },
          { href: "/profesional/liquidacion", label: "Liquidación" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border-b-2 border-transparent px-3 py-2 text-muted hover:border-accent hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
