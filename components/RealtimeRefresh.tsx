"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  TURNOS_CHANGED_EVENT,
  turnosChannelName,
} from "@/lib/realtime-channels";

// Refresco de respaldo por si se pierde algún aviso de Realtime.
const FALLBACK_REFRESH_MS = 5 * 60_000;
// Sin Supabase configurado (p. ej. en local sin las variables públicas)
// se vuelve al polling de antes.
const POLLING_WITHOUT_REALTIME_MS = 15_000;
// Varios avisos seguidos (llegó + llamar, por ejemplo) => un solo refresh.
const DEBOUNCE_MS = 500;

let browserClient: SupabaseClient | null = null;

function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  browserClient ??= createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return browserClient;
}

// Refresca la página cuando el server avisa por Supabase Realtime que
// cambió algo en los turnos de la institución (ver lib/realtime.ts), en vez
// de pedirle la página al server cada pocos segundos. institutionId null =
// escucha todas las instituciones (admin, /llamador sin slug).
export function RealtimeRefresh({
  institutionId,
}: {
  institutionId: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) {
      const id = setInterval(() => router.refresh(), POLLING_WITHOUT_REALTIME_MS);
      return () => clearInterval(id);
    }

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => router.refresh(), DEBOUNCE_MS);
    };

    // Si se cortó la conexión pudimos perder avisos: al volver a
    // suscribirse se refresca una vez (pero no en la primera suscripción,
    // que la página ya viene con datos frescos).
    let wasDisconnected = false;
    const channel = supabase
      .channel(turnosChannelName(institutionId))
      .on("broadcast", { event: TURNOS_CHANGED_EVENT }, scheduleRefresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (wasDisconnected) scheduleRefresh();
          wasDisconnected = false;
        } else {
          wasDisconnected = true;
        }
      });

    const fallback = setInterval(() => router.refresh(), FALLBACK_REFRESH_MS);

    return () => {
      if (debounce) clearTimeout(debounce);
      clearInterval(fallback);
      supabase.removeChannel(channel);
    };
  }, [router, institutionId]);

  return null;
}
