import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type CreatePatientInput = {
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  phone: string;
  birthDate: Date | null;
  healthInsurance: string | null;
  healthInsuranceNumber: string | null;
};

export type CreatePatientResult =
  | { ok: true; userId: string; username: string; rawPassword: string }
  | { ok: false; error: string };

export function normalizeDni(value: string): string {
  return value.replace(/\D/g, "");
}

export type DniSyncResult =
  | {
      ok: true;
      dni: string;
      changed: boolean;
      extra: { username?: string; passwordHash?: string };
      rawPassword?: string;
    }
  | { ok: false; error: string };

// Cuando un paciente viejo (de antes de que el DNI fuera el usuario de
// acceso) carga o cambia su DNI desde "Mi perfil", hay que sincronizar
// username/contraseña también — si no, quedaría con un DNI guardado que
// nunca sirve para entrar. Sólo toca la contraseña si el DNI realmente
// cambió (no en cada guardado del perfil).
export async function resolveDniSync(
  userId: string,
  currentDni: string | null,
  dniRaw: string
): Promise<DniSyncResult> {
  const dni = normalizeDni(dniRaw);
  if (dni.length < 6) {
    return { ok: false, error: "Ingresá un DNI válido." };
  }
  if (currentDni === dni) {
    return { ok: true, dni, changed: false, extra: {} };
  }

  const existing = await prisma.user.findUnique({ where: { username: dni } });
  if (existing && existing.id !== userId) {
    return { ok: false, error: "Ya existe una cuenta con ese DNI." };
  }

  const rawPassword = dni.slice(-3);
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  return {
    ok: true,
    dni,
    changed: true,
    extra: { username: dni, passwordHash },
    rawPassword,
  };
}

// El paciente pide email (para las notificaciones de turnos) pero entra con
// su DNI como usuario y contraseña = los últimos 3 dígitos de ese DNI — no
// elige contraseña propia, ni acá ni cuando lo crea secretaría/encargado.
export async function createPatientUser(
  input: CreatePatientInput
): Promise<CreatePatientResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const name = `${firstName} ${lastName}`.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const dni = normalizeDni(input.dni);
  const healthInsurance = input.healthInsurance?.trim() || null;
  const healthInsuranceNumber = input.healthInsuranceNumber?.trim() || null;

  if (!firstName || !lastName) {
    return { ok: false, error: "Completá nombre y apellido." };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Ingresá un email válido." };
  }
  if (dni.length < 6) {
    return { ok: false, error: "Ingresá un DNI válido." };
  }

  const [existingEmail, existingDni] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username: dni } }),
  ]);
  if (existingEmail) {
    return {
      ok: false,
      error: "Ya existe una cuenta registrada con ese email.",
    };
  }
  if (existingDni) {
    return {
      ok: false,
      error: "Ya existe una cuenta registrada con ese DNI.",
    };
  }

  const rawPassword = dni.slice(-3);
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      username: dni,
      dni,
      phone: phone || null,
      birthDate: input.birthDate,
      healthInsurance,
      healthInsuranceNumber,
      passwordHash,
      role: "PATIENT",
    },
  });

  return { ok: true, userId: user.id, username: dni, rawPassword };
}
