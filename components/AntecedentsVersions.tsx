import type { listAntecedentsHistory } from "@/lib/clinical";
import { formatDateTimeAR } from "@/lib/print-format";

type Entries = Awaited<ReturnType<typeof listAntecedentsHistory>>;

// Versiones anteriores de los antecedentes (todas menos la vigente, que es
// la primera de la lista). Nunca se editan: cada cambio es una versión nueva.
export function AntecedentsVersions({
  entries,
  open = false,
}: {
  entries: Entries;
  open?: boolean;
}) {
  const previous = entries.slice(1);
  if (previous.length === 0) return null;

  return (
    <details open={open} className="mt-3 text-sm">
      <summary className="cursor-pointer text-muted hover:text-foreground print:hidden">
        Versiones anteriores ({previous.length})
      </summary>
      <p className="hidden font-medium print:block">
        Versiones anteriores de los antecedentes
      </p>
      <div className="mt-2 space-y-2">
        {previous.map((entry) => (
          <div
            key={entry.id}
            className="break-inside-avoid rounded-md border border-border bg-surface/60 px-4 py-3"
          >
            <p className="text-xs text-muted">
              {formatDateTimeAR(entry.createdAt)}
              {entry.createdBy ? ` · ${entry.createdBy.name}` : ""}
            </p>
            <p className="mt-1">
              <span className="font-medium">Alergias: </span>
              {entry.allergies || "—"}
            </p>
            <p>
              <span className="font-medium">Enfermedades crónicas: </span>
              {entry.chronicConditions || "—"}
            </p>
            <p>
              <span className="font-medium">Medicación habitual: </span>
              {entry.currentMedications || "—"}
            </p>
            <p>
              <span className="font-medium">Otros: </span>
              {entry.notes || "—"}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
