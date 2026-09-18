"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { createPatientUser } from "@/lib/patients";
import { parseDateOnlyLocal } from "@/lib/dates";

export type LoginState = { error: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      identifier: formData.get("identifier"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Usuario/email o contraseña incorrectos." };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

export type RegisterState =
  | { error: string }
  | { success: true; username: string; rawPassword: string }
  | undefined;

export async function registerPatient(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const birthDateRaw = String(formData.get("birthDate") ?? "").trim();

  const result = await createPatientUser({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    dni: String(formData.get("dni") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    birthDate: birthDateRaw ? parseDateOnlyLocal(birthDateRaw) : null,
    healthInsurance: String(formData.get("healthInsurance") ?? ""),
    healthInsuranceNumber: String(formData.get("healthInsuranceNumber") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true, username: result.username, rawPassword: result.rawPassword };
}
