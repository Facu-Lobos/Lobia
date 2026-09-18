"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerPatient } from "@/actions/auth";

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(
    registerPatient,
    undefined
  );

  if (state && "success" in state && state.success) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">
          ¡Cuenta creada!
        </h1>
        <p className="mb-2 text-muted">
          Tu cuenta se registró correctamente. Para entrar usá tu DNI como
          usuario y estos datos:
        </p>
        <p className="mb-6 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          Usuario: <span className="font-medium">{state.username}</span>
          <br />
          Contraseña: <span className="font-medium">{state.rawPassword}</span>{" "}
          (los últimos 3 números de tu DNI)
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Crear cuenta
      </h1>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="firstName" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="firstName"
              name="firstName"
              required
              className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="lastName" className="text-sm font-medium">
              Apellido
            </label>
            <input
              id="lastName"
              name="lastName"
              required
              className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dni" className="text-sm font-medium">
            DNI
          </label>
          <input
            id="dni"
            name="dni"
            required
            placeholder="Sin puntos"
            className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
          <p className="text-xs text-muted">
            Es tu usuario para entrar. La contraseña van a ser los últimos 3
            números.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
          <p className="text-xs text-muted">
            Para mandarte la confirmación de tus turnos.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="birthDate" className="text-sm font-medium">
            Fecha de nacimiento (opcional)
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono (opcional)
          </label>
          <input
            id="phone"
            name="phone"
            className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="healthInsurance" className="text-sm font-medium">
            Obra social (opcional)
          </label>
          <input
            id="healthInsurance"
            name="healthInsurance"
            placeholder="Particular si no tenés"
            className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="healthInsuranceNumber"
            className="text-sm font-medium"
          >
            Número de afiliado (opcional)
          </label>
          <input
            id="healthInsuranceNumber"
            name="healthInsuranceNumber"
            className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>

        {state && "error" in state && (
          <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-primary underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
