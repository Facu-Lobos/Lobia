"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function createInstitution(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect("/admin/instituciones?error=nombre");
  }

  const existing = await prisma.institution.findUnique({ where: { name } });
  if (existing) {
    redirect("/admin/instituciones?error=duplicado");
  }

  await prisma.institution.create({ data: { name } });

  revalidatePath("/admin/instituciones");
  revalidatePath("/admin/personal");
  redirect("/admin/instituciones?creado=1");
}

export async function deleteInstitution(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const [professionalInUse, userInUse] = await Promise.all([
    prisma.professional.findFirst({ where: { institutionId: id } }),
    prisma.user.findFirst({ where: { institutionId: id } }),
  ]);
  if (professionalInUse || userInUse) {
    redirect("/admin/instituciones?error=enuso");
  }

  await prisma.institution.delete({ where: { id } });

  revalidatePath("/admin/instituciones");
  revalidatePath("/admin/personal");
  redirect("/admin/instituciones?eliminado=1");
}
