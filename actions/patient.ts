"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseDateOnlyLocal } from "@/lib/dates";
import { resolveDniSync } from "@/lib/patients";

export async function updateOwnProfile(formData: FormData) {
  const user = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const name = `${firstName} ${lastName}`.trim();
  const dniRaw = String(formData.get("dni") ?? "").trim();
  const birthDateRaw = String(formData.get("birthDate") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const healthInsurance = String(formData.get("healthInsurance") ?? "").trim();
  const healthInsuranceNumber = String(
    formData.get("healthInsuranceNumber") ?? ""
  ).trim();

  if (!firstName || !lastName) {
    redirect("/mis-turnos/perfil?error=nombre");
  }
  if (!dniRaw) {
    redirect("/mis-turnos/perfil?error=dni");
  }

  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
  });

  // Paciente viejo (de antes de que el DNI fuera el usuario de acceso) que
  // recién ahora carga o cambia su DNI: se le sincroniza el usuario/
  // contraseña de login también, no sólo el dato.
  const dniSync = await resolveDniSync(user.id, currentUser.dni, dniRaw);
  if (!dniSync.ok) {
    redirect(`/mis-turnos/perfil?error=${dniSync.error === "Ingresá un DNI válido." ? "dni" : "dniexistente"}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      dni: dniSync.dni,
      birthDate: birthDateRaw ? parseDateOnlyLocal(birthDateRaw) : null,
      phone: phone || null,
      healthInsurance: healthInsurance || null,
      healthInsuranceNumber: healthInsuranceNumber || null,
      ...dniSync.extra,
    },
  });

  revalidatePath("/mis-turnos/perfil");
  if (dniSync.changed) {
    redirect(
      `/mis-turnos/perfil?actualizado=1&usuario=${encodeURIComponent(dniSync.dni)}&clave=${encodeURIComponent(dniSync.rawPassword ?? "")}`
    );
  }
  redirect("/mis-turnos/perfil?actualizado=1");
}
