"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAppointmentStaff } from "@/lib/auth-helpers";
import type { AppRole } from "@/types/roles";

function redirectBaseFor(role: AppRole) {
  if (role === "MANAGER") return "/encargado/caja";
  if (role === "SECRETARY") return "/secretaria/caja";
  return "/admin/caja";
}

function revalidateCajaPaths() {
  revalidatePath("/admin/caja");
  revalidatePath("/encargado/caja");
  revalidatePath("/secretaria/caja");
}

export async function openCajaAction(formData: FormData) {
  const { user, institutionId } = await requireAppointmentStaff();
  const base = redirectBaseFor(user.role);
  const institution =
    institutionId ?? String(formData.get("institutionId") ?? "");

  if (!institution) {
    redirect(`${base}?error=institucion`);
  }

  const openingAmountRaw = String(formData.get("openingAmount") ?? "0").trim();
  const openingAmount = Number(openingAmountRaw || "0");
  if (!Number.isFinite(openingAmount) || openingAmount < 0) {
    redirect(`${base}?error=monto`);
  }

  const existing = await prisma.caja.findFirst({
    where: { institutionId: institution, closedAt: null },
  });
  if (existing) {
    redirect(`${base}?error=abierta`);
  }

  await prisma.caja.create({
    data: { institutionId: institution, openedById: user.id, openingAmount },
  });

  revalidateCajaPaths();
  redirect(`${base}?abierta=1`);
}

export async function closeCajaAction(formData: FormData) {
  const { user, institutionId } = await requireAppointmentStaff();
  const base = redirectBaseFor(user.role);
  const cajaId = String(formData.get("cajaId") ?? "");

  const caja = await prisma.caja.findUnique({ where: { id: cajaId } });
  if (!caja || caja.closedAt) {
    redirect(`${base}?error=noautorizado`);
  }
  if (institutionId && caja.institutionId !== institutionId) {
    redirect(`${base}?error=noautorizado`);
  }

  const closingAmountRaw = String(formData.get("closingAmount") ?? "").trim();
  const closingAmount = Number(closingAmountRaw);
  if (!Number.isFinite(closingAmount) || closingAmount < 0) {
    redirect(`${base}?error=monto`);
  }

  await prisma.caja.update({
    where: { id: cajaId },
    data: { closedById: user.id, closedAt: new Date(), closingAmount },
  });

  revalidateCajaPaths();
  redirect(`${base}?cerrada=${cajaId}`);
}
