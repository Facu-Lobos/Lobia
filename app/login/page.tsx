"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Iniciar sesión
      </h1>

      <form action={formAction} className="flex flex-col gap-4">
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
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>

        {state?.error && (
          <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-primary underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
