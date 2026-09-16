import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type CreateSecretaryInput = {
  name: string;
  email: string;
  password: string;
  institutionId: string | null;
};

export type CreateSecretaryResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function createSecretaryUser(
  input: CreateSecretaryInput
): Promise<CreateSecretaryResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || name.length < 2) {
    return { ok: false, error: "nombre" };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, error: "email" };
  }
  if (!password || password.length < 6) {
    return { ok: false, error: "password" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "emailexistente" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "SECRETARY",
      institutionId: input.institutionId,
    },
  });

  return { ok: true, userId: user.id };
}
