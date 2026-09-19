"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

function redirectBaseFor(role: string) {
  return role === "MANAGER" ? "/encargado/nomenclador" : "/admin/nomenclador";
}

// ADMIN gestiona el nomenclador de cualquier institución (pasa
// institutionId por el form); MANAGER sólo el de la suya.
async function requireInstitutionManager() {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    return { user, ownInstitutionId: null as string | null };
  }
  if (user.role === "MANAGER") {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.institutionId) redirect("/");
    return { user, ownInstitutionId: dbUser.institutionId as string | null };
  }
  redirect("/");
}

function revalidateNomencladorPaths() {
  revalidatePath("/admin/nomenclador");
  revalidatePath("/encargado/nomenclador");
}

export async function createNomenclador(formData: FormData) {
  const { user, ownInstitutionId } = await requireInstitutionManager();
  const code = String(formData.get("code") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const institutionId =
    ownInstitutionId ?? String(formData.get("institutionId") ?? "");
  const base = redirectBaseFor(user.role);

  if (!code || !description || !institutionId) {
    redirect(`${base}?error=datos`);
  }

  const existing = await prisma.nomenclador.findUnique({
    where: { institutionId_code: { institutionId, code } },
  });
  if (existing) {
    redirect(`${base}?error=duplicado`);
  }

  await prisma.nomenclador.create({ data: { institutionId, code, description } });

  revalidateNomencladorPaths();
  redirect(`${base}?creado=1`);
}

async function assertOwnNomenclador(id: string, ownInstitutionId: string | null) {
  if (!ownInstitutionId) return;
  const record = await prisma.nomenclador.findUnique({ where: { id } });
  if (!record || record.institutionId !== ownInstitutionId) {
    redirect(`${redirectBaseFor("MANAGER")}?error=noautorizado`);
  }
}

export async function toggleNomencladorActive(formData: FormData) {
  const { user, ownInstitutionId } = await requireInstitutionManager();
  const id = String(formData.get("id") ?? "");
  const base = redirectBaseFor(user.role);
  await assertOwnNomenclador(id, ownInstitutionId);

  const record = await prisma.nomenclador.findUnique({ where: { id } });
  if (!record) redirect(`${base}?error=noautorizado`);

  await prisma.nomenclador.update({
    where: { id },
    data: { active: !record.active },
  });

  revalidateNomencladorPaths();
  redirect(`${base}?actualizado=1`);
}

export async function setNomencladorValue(formData: FormData) {
  const { user, ownInstitutionId } = await requireInstitutionManager();
  const nomencladorId = String(formData.get("nomencladorId") ?? "");
  const healthInsurance = String(formData.get("healthInsurance") ?? "").trim();
  const valueRaw = String(formData.get("value") ?? "").trim();
  const base = redirectBaseFor(user.role);
  await assertOwnNomenclador(nomencladorId, ownInstitutionId);

  const value = Number(valueRaw);
  if (!Number.isFinite(value) || value < 0) {
    redirect(`${base}?error=valor`);
  }

  await prisma.nomencladorValor.upsert({
    where: {
      nomencladorId_healthInsurance: { nomencladorId, healthInsurance },
    },
    create: { nomencladorId, healthInsurance, value },
    update: { value },
  });

  revalidateNomencladorPaths();
  redirect(`${base}?actualizado=1`);
}

export async function deleteNomencladorValue(formData: FormData) {
  const { user, ownInstitutionId } = await requireInstitutionManager();
  const id = String(formData.get("id") ?? "");
  const base = redirectBaseFor(user.role);

  const value = await prisma.nomencladorValor.findUnique({
    where: { id },
    include: { nomenclador: true },
  });
  if (
    !value ||
    (ownInstitutionId && value.nomenclador.institutionId !== ownInstitutionId)
  ) {
    redirect(`${base}?error=noautorizado`);
  }

  await prisma.nomencladorValor.delete({ where: { id } });

  revalidateNomencladorPaths();
  redirect(`${base}?actualizado=1`);
}
