"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignAppointmentAtSlotAction,
  searchPatientsForSlotAction,
} from "@/actions/booking-slot";
import type { PatientBrief } from "@/lib/patients";

const REASON_MESSAGES: Record<string, string> = {
  invalido: "Ese horario ya no está disponible (puede haber pasado o no ser válido).",
  ocupado: "Ese horario ya fue tomado por otro turno.",
};

export function AssignSlotButton({
  professionalId,
  professionalName,
  dayLabel,
  time,
  dateIso,
}: {
  professionalId: string;
  professionalName: string;
  dayLabel: string;
  time: string;
  dateIso: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientBrief[]>([]);
  const [selected, setSelected] = useState<PatientBrief | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      searchPatientsForSlotAction(query)
        .then(setResults)
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  function reset() {
    setQuery("");
    setResults([]);
    setSelected(null);
    setError(null);
  }

  function handleConfirm() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await assignAppointmentAtSlotAction({
        patientId: selected.id,
        professionalId,
        dateIso,
      });
      if (!result.ok) {
        setError(REASON_MESSAGES[result.reason] ?? "No se pudo asignar el turno.");
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left text-muted hover:text-primary hover:underline"
      >
        —
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Asignar turno</h2>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              {professionalName} · {dayLabel} {time}
            </p>

            {!selected ? (
              <>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar paciente por nombre o DNI…"
                  className="mt-4 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                />
                <div className="mt-3 max-h-60 divide-y divide-border overflow-y-auto">
                  {searching && <p className="py-2 text-sm text-muted">Buscando…</p>}
                  {!searching &&
                    results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelected(p)}
                        className="flex w-full items-center justify-between py-2 text-left text-sm hover:text-primary"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted">
                          {p.dni ? `DNI ${p.dni}` : ""} {p.healthInsurance ? `· ${p.healthInsurance}` : ""}
                        </span>
                      </button>
                    ))}
                  {!searching && query.trim().length >= 2 && results.length === 0 && (
                    <p className="py-2 text-sm text-muted">Sin resultados.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-md border border-border bg-background p-4">
                <p className="font-medium">{selected.name}</p>
                <p className="text-sm text-muted">
                  {selected.dni ? `DNI ${selected.dni}` : "Sin DNI"} ·{" "}
                  {selected.healthInsurance || "Particular"}
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Elegir otro paciente
                </button>
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selected || pending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {pending ? "Asignando…" : "Asignar turno"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
