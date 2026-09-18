export type CalledPatient = {
  id: string;
  patientName: string;
  professionalName: string;
  consultingRoom: string | null;
  calledAt: Date;
};

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

// Pantalla pensada para un TV/monitor en la sala de espera física: texto
// grande, se refresca sola (ver AutoRefresh en la página), sin acciones.
export function CallerScreen({ patients }: { patients: CalledPatient[] }) {
  if (patients.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-lg border border-border bg-surface">
        <p className="text-2xl text-muted">Sin pacientes en consulta.</p>
      </div>
    );
  }

  const [current, ...rest] = patients;

  return (
    <div>
      <div className="rounded-lg border-2 border-primary bg-primary-soft p-8 text-center">
        <p className="text-5xl font-bold text-foreground">
          {current.patientName}
        </p>
        <p className="mt-4 text-2xl text-muted">
          Acérquese al consultorio{" "}
          <span className="font-semibold text-primary">
            {current.consultingRoom ?? "—"}
          </span>{" "}
          con {current.professionalName}
        </p>
      </div>

      {rest.length > 0 && (
        <div className="mt-6 space-y-2">
          {rest.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3"
            >
              <span className="text-lg font-medium">{p.patientName}</span>
              <span className="text-muted">
                {p.consultingRoom ?? "Sin consultorio"} · {p.professionalName}{" "}
                · {formatTime(p.calledAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
