"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Refresca la página periódicamente para simular actualización en tiempo
// real de la sala de espera, sin necesitar websockets.
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
