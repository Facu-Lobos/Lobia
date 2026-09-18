const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export type WeekSchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}[];

// Resumen de los horarios semanales cargados del profesional, para dar
// contexto arriba de la grilla del día (a qué hora atiende cada día).
export function WeeklyHoursStrip({ schedules }: { schedules: WeekSchedule }) {
  const byDay = new Map<number, WeekSchedule>();
  for (const s of schedules) {
    const list = byDay.get(s.dayOfWeek) ?? [];
    list.push(s);
    byDay.set(s.dayOfWeek, list);
  }

  return (
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {DAY_LABELS.map((label, idx) => {
        const daySlots = byDay.get(idx) ?? [];
        return (
          <div
            key={label}
            className="rounded-md border border-border bg-surface px-1 py-2"
          >
            <p className="font-medium">{label}</p>
            {daySlots.length === 0 ? (
              <p className="mt-1 text-muted">—</p>
            ) : (
              daySlots.map((s, i) => (
                <p key={i} className="mt-1 text-muted">
                  {s.startTime}-{s.endTime}
                </p>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
