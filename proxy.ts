import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CONSULTORIO_COOKIE } from "@/lib/consultorio";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isPatientRoute = nextUrl.pathname.startsWith("/mis-turnos");
  const isSpecialistRoute = nextUrl.pathname.startsWith("/profesional");
  const isSecretaryRoute = nextUrl.pathname.startsWith("/secretaria");
  const isManagerRoute = nextUrl.pathname.startsWith("/encargado");

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (isSpecialistRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "SPECIALIST") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    // Apenas entra, se le pregunta en qué consultorio va a atender (para
    // el llamador) antes de dejarlo pasar a cualquier otra pantalla.
    const hasConsultingRoom = req.cookies.get(CONSULTORIO_COOKIE)?.value === "1";
    if (!hasConsultingRoom && nextUrl.pathname !== "/profesional/consultorio") {
      return NextResponse.redirect(new URL("/profesional/consultorio", nextUrl));
    }
  }

  if (isSecretaryRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "SECRETARY") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (isManagerRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "MANAGER") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (isPatientRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/mis-turnos/:path*",
    "/profesional/:path*",
    "/secretaria/:path*",
    "/encargado/:path*",
  ],
};
