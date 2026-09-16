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
        <p className="mb-6 text-muted">
          Tu cuenta se registró correctamente. Ya podés iniciar sesión.
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
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="name"
            name="name"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
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
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
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
