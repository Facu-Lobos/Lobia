"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSecretaryUser } from "@/lib/staff";

export async function createSecretary(formData: FormData) {
  await requireAdmin();

  const institutionId = String(formData.get("institutionId") ?? "") || null;

  const result = await createSecretaryUser({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    institutionId,
  });

  if (!result.ok) {
    redirect(`/admin/personal?error=${result.error}`);
  }

  revalidatePath("/admin/personal");
  redirect("/admin/personal?creado=1");
}

export async function createManager(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const institutionId = String(formData.get("institutionId") ?? "");

  if (!name || name.length < 2) {
    redirect("/admin/personal?error=nombre");
  }
  if (!email || !email.includes("@")) {
    redirect("/admin/personal?error=email");
  }
  if (!password || password.length < 6) {
    redirect("/admin/personal?error=password");
  }
  if (!institutionId) {
    redirect("/admin/personal?error=institucion");
  }

  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });
  if (!institution) {
    redirect("/admin/personal?error=institucion");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/admin/personal?error=emailexistente");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, passwordHash, role: "MANAGER", institutionId },
  });

  revalidatePath("/admin/personal");
  redirect("/admin/personal?creado=1");
}
