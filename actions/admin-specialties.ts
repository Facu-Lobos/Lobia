"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

function redirectBaseFor(role: string) {
  return role === "MANAGER" ? "/encargado/especialidades" : "/admin/especialidades";
}

// Specialty es una lista global (no por institución): Encargado puede
// agregar (lo necesita para sus profesionales), pero borrar queda
// admin-only porque podría afectar profesionales de otras instituciones
// (ProfessionalSpecialty tiene onDelete: Cascade).
async function requireSpecialtyManager() {
  const user = await requireUser();
  if (user.role === "ADMIN" || user.role === "MANAGER") return user;
  redirect("/");
}

export async function createSpecialty(formData: FormData) {
  const user = await requireSpecialtyManager();
  const name = String(formData.get("name") ?? "").trim();
  const base = redirectBaseFor(user.role);

  if (!name) {
    redirect(`${base}?error=nombre`);
  }

  const existing = await prisma.specialty.findUnique({ where: { name } });
  if (existing) {
    redirect(`${base}?error=duplicado`);
  }

  await prisma.specialty.create({ data: { name } });

  revalidatePath("/admin/especialidades");
  revalidatePath("/encargado/especialidades");
  revalidatePath("/profesionales");
  revalidatePath("/");
  redirect(`${base}?creado=1`);
}

export async function deleteSpecialty(formData: FormData) {
  const user = await requireSpecialtyManager();
  if (user.role !== "ADMIN") {
    redirect("/encargado/especialidades?error=noautorizado");
  }
  const id = String(formData.get("id") ?? "");

  await prisma.specialty.delete({ where: { id } });

  revalidatePath("/admin/especialidades");
  revalidatePath("/encargado/especialidades");
  revalidatePath("/profesionales");
  revalidatePath("/");
  redirect("/admin/especialidades?eliminado=1");
}
