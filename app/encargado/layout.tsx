import Link from "next/link";
import { requireManager } from "@/lib/auth-helpers";

export default async function EncargadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireManager();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-8 flex gap-1 border-b border-border pb-0 text-sm">
        {[
          { href: "/encargado", label: "Inicio" },
          { href: "/encargado/profesionales", label: "Profesionales" },
          { href: "/encargado/turnos", label: "Turnos" },
          { href: "/encargado/sala-espera", label: "Sala de espera" },
          { href: "/encargado/personal", label: "Personal" },
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
