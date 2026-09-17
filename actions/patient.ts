"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function updateOwnProfile(formData: FormData) {
  const user = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const name = `${firstName} ${lastName}`.trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const healthInsurance = String(formData.get("healthInsurance") ?? "").trim();
  const healthInsuranceNumber = String(
    formData.get("healthInsuranceNumber") ?? ""
  ).trim();

  if (!firstName || !lastName) {
    redirect("/mis-turnos/perfil?error=nombre");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: phone || null,
      healthInsurance: healthInsurance || null,
      healthInsuranceNumber: healthInsuranceNumber || null,
    },
  });

  revalidatePath("/mis-turnos/perfil");
  redirect("/mis-turnos/perfil?actualizado=1");
}
