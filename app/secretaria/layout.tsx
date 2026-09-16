import Link from "next/link";
import { requireSecretary } from "@/lib/auth-helpers";

export default async function SecretariaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSecretary();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-8 flex gap-1 border-b border-border pb-0 text-sm">
        {[
          { href: "/secretaria", label: "Inicio" },
          { href: "/secretaria/pacientes", label: "Pacientes" },
          { href: "/secretaria/asignar-turno", label: "Asignar turno" },
          { href: "/secretaria/turnos", label: "Turnos" },
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
