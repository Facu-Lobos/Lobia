"use client";

import { useEffect, useRef } from "react";

const CHIME_SRC = "/sounds/llamador-chime.mp3";

let sharedAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(CHIME_SRC);
    sharedAudio.preload = "auto";
  }
  return sharedAudio;
}

// Los navegadores bloquean el audio hasta que haya alguna interacción del
// usuario en la página. En un TV/monitor dejado abierto sin que nadie lo
// toque, esto puede impedir el primer sonido — con un solo click/touch en
// cualquier parte de la pantalla (por ej. al dejarla puesta) alcanza para
// desbloquearlo para el resto de la sesión: se reproduce y se pausa al
// toque, sin llegar a sonar, para "destrabar" el elemento de audio.
if (typeof window !== "undefined") {
  const unlock = () => {
    const audio = getAudio();
    if (!audio) return;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {});
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function playChime() {
  const audio = getAudio();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// Suena cada vez que cambia el paciente que está en la tarjeta principal
// (currentId) — no en el primer render, sólo cuando pasa de un paciente a
// otro.
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
