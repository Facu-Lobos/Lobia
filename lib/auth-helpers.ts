import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

export async function requireSpecialist() {
  const user = await requireUser();
  if (user.role !== "SPECIALIST") {
    redirect("/");
  }
  const professional = await prisma.professional.findUnique({
    where: { userId: user.id },
  });
  if (!professional) {
    // Guarda de integridad: todo usuario SPECIALIST debe tener un
    // Professional linkeado (se crea así en grantPortalAccess).
    redirect("/");
  }
  return { user, professional };
}

export async function requireSecretary() {
  const user = await requireUser();
  if (user.role !== "SECRETARY") {
    redirect("/");
  }
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return { user, institutionId: dbUser?.institutionId ?? null };
}

export async function requireManager() {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    redirect("/");
  }
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.institutionId) {
    // Guarda de integridad: todo MANAGER debe tener institución asignada.
    redirect("/");
  }
  return { user, institutionId: dbUser.institutionId };
}

// Usado por las acciones compartidas de gestión de turnos (marcar llegada,
// reprogramar, cancelar): ADMIN no tiene restricción de institución
// (institutionId: null), MANAGER/SECRETARY quedan acotados a la suya.
export async function requireAppointmentStaff() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    return { user, institutionId: null as string | null };
  }

  if (user.role === "MANAGER" || user.role === "SECRETARY") {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.institutionId) {
      redirect("/");
    }
    return { user, institutionId: dbUser.institutionId as string | null };
  }

  redirect("/");
}
