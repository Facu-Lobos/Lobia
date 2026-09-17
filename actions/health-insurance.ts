"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

function redirectBaseFor(role: string) {
  return role === "MANAGER" ? "/encargado/obras-sociales" : "/admin/obras-sociales";
}

// ADMIN gestiona obras sociales de cualquier institución (pasa institutionId
// por el form); MANAGER sólo la suya (se infiere, ignorando cualquier
// institutionId que llegue del form).
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

function revalidateHealthInsurancePaths() {
  revalidatePath("/admin/obras-sociales");
  revalidatePath("/encargado/obras-sociales");
  revalidatePath("/mis-turnos/perfil");
}

export async function createHealthInsurance(formData: FormData) {
  const { user, ownInstitutionId } = await requireInstitutionManager();
  const name = String(formData.get("name") ?? "").trim();
  const institutionId = ownInstitutionId ?? String(formData.get("institutionId") ?? "");
  const base = redirectBaseFor(user.role);

  if (!name || !institutionId) {
    redirect(`${base}?error=nombre`);
  }

  const existing = await prisma.healthInsurance.findUnique({
    where: { institutionId_name: { institutionId, name } },
  });
  if (existing) {
    redirect(`${base}?error=duplicado`);
  }

  await prisma.healthInsurance.create({ data: { institutionId, name } });

  revalidateHealthInsurancePaths();
  redirect(`${base}?creado=1`);
}

export async function deleteHealthInsurance(formData: FormData) {
  const { user, ownInstitutionId } = await requireInstitutionManager();
  const id = String(formData.get("id") ?? "");
  const base = redirectBaseFor(user.role);

  if (ownInstitutionId) {
    const record = await prisma.healthInsurance.findUnique({ where: { id } });
    if (!record || record.institutionId !== ownInstitutionId) {
      redirect(`${base}?error=noautorizado`);
    }
  }

  await prisma.healthInsurance.delete({ where: { id } });

  revalidateHealthInsurancePaths();
  redirect(`${base}?eliminado=1`);
}
