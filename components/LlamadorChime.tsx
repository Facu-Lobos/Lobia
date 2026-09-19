"use client";

import { useEffect, useRef } from "react";

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new Ctor();
  }
  return sharedAudioContext;
}

// Los navegadores bloquean el audio hasta que haya alguna interacción del
// usuario en la página. En un TV/monitor dejado abierto sin que nadie lo
// toque, esto puede impedir el primer sonido — con un solo click/touch en
// cualquier parte de la pantalla (por ej. al dejarla puesta) alcanza para
// desbloquearlo para el resto de la sesión.
if (typeof window !== "undefined") {
  const unlock = () => {
    getAudioContext()?.resume().catch(() => {});
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function playChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  [880, 660].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.32;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.5, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.42);
  });
}

// Suena un "ding-dong" cada vez que cambia el paciente que está en la
// tarjeta principal (currentId) — no en el primer render, sólo cuando
// pasa de un paciente a otro.
export function LlamadorChime({ currentId }: { currentId: string | null }) {
  const previousId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (
      previousId.current !== undefined &&
      previousId.current !== currentId &&
      currentId
    ) {
      playChime();
    }
    previousId.current = currentId;
  }, [currentId]);

  return null;
}
