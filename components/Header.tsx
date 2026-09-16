import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/actions/auth";
import logo from "@/public/logo.png";
import LobiaWordmark from "@/components/LobiaWordmark";

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="bg-primary text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={logo}
            alt="Lobia"
            width={40}
            height={40}
            className="h-9 w-9 sm:h-10 sm:w-10"
            priority
          />
          <span className="leading-tight">
            <LobiaWordmark className="text-lg" strokeWidth={1.3} />
            <span className="hidden text-xs text-white/60 sm:block">
              Tecnología inteligente para la salud.
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/profesionales" className="text-white/80 hover:text-white">
            Profesionales
          </Link>

          {user?.role === "ADMIN" && (
            <Link href="/admin" className="text-white/80 hover:text-white">
              Admin
            </Link>
          )}

          {user?.role === "PATIENT" && (
            <Link href="/mis-turnos" className="text-white/80 hover:text-white">
              Mis Turnos
            </Link>
          )}

          {user?.role === "SPECIALIST" && (
            <Link href="/profesional" className="text-white/80 hover:text-white">
              Mi Portal
            </Link>
          )}

          {user?.role === "SECRETARY" && (
            <Link href="/secretaria" className="text-white/80 hover:text-white">
              Secretaría
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-white/60">Hola, {user.name}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md border border-white/25 px-3 py-1.5 hover:bg-white/10"
                >
                  Salir
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md border border-white/25 px-3 py-1.5 hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover"
              >
                Registrarme
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
