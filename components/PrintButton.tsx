"use client";

import { useEffect, useRef } from "react";

// Botón "Imprimir" (abre el diálogo del navegador, desde donde también se
// puede guardar como PDF). Con `auto`, abre el diálogo apenas carga la
// página — se usa cuando se llega desde "Guardar y cobrar" o "Cerrar caja".
export function PrintButton({
  label = "Imprimir",
  auto = false,
}: {
  label?: string;
  auto?: boolean;
}) {
  const printed = useRef(false);

  useEffect(() => {
    if (!auto || printed.current) return;
    printed.current = true;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [auto]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover print:hidden"
    >
      {label}
    </button>
  );
}
