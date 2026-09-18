import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Usuario de staff (secretaria/encargado/admin): sin espacios ni "@" — para
// distinguirlo a simple vista de un email, y evitar login ambiguo si algún
// día alguien elige un username con forma de email.
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,40}$/.test(username);
}

export type CreateSecretaryInput = {
  name: string;
  username: string;
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
  const username = input.username.trim().toLowerCase();
  const password = input.password;

  if (!name || name.length < 2) {
    return { ok: false, error: "nombre" };
  }
  if (!isValidUsername(username)) {
    return { ok: false, error: "usuario" };
  }
  if (!password || password.length < 6) {
    return { ok: false, error: "password" };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { ok: false, error: "usuarioexistente" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      username,
      passwordHash,
      role: "SECRETARY",
      institutionId: input.institutionId,
    },
  });

  return { ok: true, userId: user.id };
}
