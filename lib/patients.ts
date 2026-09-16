import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type CreatePatientInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type CreatePatientResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function createPatientUser(
  input: CreatePatientInput
): Promise<CreatePatientResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const password = input.password;

  if (!name || name.length < 2) {
    return { ok: false, error: "El nombre debe tener al menos 2 caracteres." };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Ingresá un email válido." };
  }
  if (!password || password.length < 6) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 6 caracteres.",
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error: "Ya existe una cuenta registrada con ese email.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: "PATIENT",
    },
  });

  return { ok: true, userId: user.id };
}
