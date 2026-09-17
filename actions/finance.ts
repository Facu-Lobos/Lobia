"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

function redirectBaseFor(role: string) {
  if (role === "MANAGER") return "/encargado/finanzas";
  if (role === "SECRETARY") return "/secretaria/finanzas";
  return "/admin/finanzas";
}

// SECRETARY/MANAGER quedan acotados a su institución (la caja del día a día
// la maneja el front-desk); ADMIN puede cargar en cualquiera.
async function requireFinanceAccess() {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    return { user, ownInstitutionId: null as string | null };
  }
  if (user.role === "MANAGER" || user.role === "SECRETARY") {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.institutionId) redirect("/");
    return { user, ownInstitutionId: dbUser.institutionId as string | null };
  }
  redirect("/");
}

function revalidateFinancePaths() {
  revalidatePath("/admin/finanzas");
  revalidatePath("/encargado/finanzas");
  revalidatePath("/secretaria/finanzas");
}

export async function createTransaction(formData: FormData) {
  const { user, ownInstitutionId } = await requireFinanceAccess();
  const type = String(formData.get("type") ?? "");
  const concept = String(formData.get("concept") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const institutionId =
    ownInstitutionId ?? (String(formData.get("institutionId") ?? "") || null);
  const base = redirectBaseFor(user.role);

  const amount = Number(amountRaw);
  if ((type !== "INCOME" && type !== "EXPENSE") || !concept || !amount || amount <= 0) {
    redirect(`${base}?error=datos`);
  }

  await prisma.transaction.create({
    data: {
      type: type as "INCOME" | "EXPENSE",
      concept,
      amount,
      institutionId,
      createdById: user.id,
    },
  });

  revalidateFinancePaths();
  redirect(`${base}?creado=1`);
}

export async function deleteTransaction(formData: FormData) {
  const { user, ownInstitutionId } = await requireFinanceAccess();
  const id = String(formData.get("id") ?? "");
  const base = redirectBaseFor(user.role);

  if (ownInstitutionId) {
    const record = await prisma.transaction.findUnique({ where: { id } });
    if (!record || record.institutionId !== ownInstitutionId) {
      redirect(`${base}?error=noautorizado`);
    }
  }

  await prisma.transaction.delete({ where: { id } });

  revalidateFinancePaths();
  redirect(`${base}?eliminado=1`);
}
