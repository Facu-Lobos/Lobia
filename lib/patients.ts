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

function normalizeDni(value: string): string {
  return value.replace(/\D/g, "");
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
