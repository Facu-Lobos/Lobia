"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function createSpecialty(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect("/admin/especialidades?error=nombre");
  }

  const existing = await prisma.specialty.findUnique({ where: { name } });
  if (existing) {
    redirect("/admin/especialidades?error=duplicado");
  }

  await prisma.specialty.create({ data: { name } });

  revalidatePath("/admin/especialidades");
  revalidatePath("/profesionales");
  revalidatePath("/");
  redirect("/admin/especialidades?creado=1");
}

export async function deleteSpecialty(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  await prisma.specialty.delete({ where: { id } });

  revalidatePath("/admin/especialidades");
  revalidatePath("/profesionales");
  revalidatePath("/");
  redirect("/admin/especialidades?eliminado=1");
}
