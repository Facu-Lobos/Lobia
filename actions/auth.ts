"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { createPatientUser } from "@/lib/patients";

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
  | { success: true }
  | undefined;

export async function registerPatient(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const result = await createPatientUser({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true };
}
