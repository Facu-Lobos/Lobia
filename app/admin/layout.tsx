import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-8 flex gap-1 border-b border-border pb-0 text-sm">
        {[
          { href: "/admin", label: "Inicio" },
          { href: "/admin/instituciones", label: "Instituciones" },
          { href: "/admin/especialidades", label: "Especialidades" },
          { href: "/admin/obras-sociales", label: "Obras sociales" },
          { href: "/admin/profesionales", label: "Profesionales" },
          { href: "/admin/turnos", label: "Turnos" },
          { href: "/admin/sala-espera", label: "Sala de espera" },
          { href: "/admin/personal", label: "Personal" },
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
