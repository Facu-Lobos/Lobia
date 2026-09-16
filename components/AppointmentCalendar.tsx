import Link from "next/link";

export type CalendarAppointment = {
  id: string;
  date: Date;
  status: "BOOKED" | "CANCELLED";
  arrivedAt: Date | null;
  label: string;
};

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function monthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Parsea "?month=YYYY-MM"; si falta o es inválido, usa el mes actual.
export function parseMonthParam(value: string | undefined): Date {
  if (value) {
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const year = Number(match[1]);
      const monthIndex = Number(match[2]) - 1;
      if (monthIndex >= 0 && monthIndex <= 11) {
        return new Date(year, monthIndex, 1);
      }
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function AppointmentCalendar({
  appointments,
  month,
  basePath,
}: {
  appointments: CalendarAppointment[];
  month: Date;
  basePath: string;
}) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
  const totalCells =
    Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1;

  const byDay = new Map<string, CalendarAppointment[]>();
  for (const a of appointments) {
    const key = dayKey(a.date);
    const list = byDay.get(key) ?? [];
    list.push(a);
    byDay.set(key, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const today = new Date();

  const cells: Date[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    cells.push(d);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          {MONTH_LABELS[month.getMonth()]} {month.getFullYear()}
        </h3>
        <div className="flex gap-2 text-sm">
          <Link
            href={`${basePath}?month=${monthParam(prevMonth)}`}
            className="rounded-md border border-border px-2 py-1 hover:border-primary"
          >
            ← Anterior
          </Link>
          <Link
            href={`${basePath}?month=${monthParam(nextMonth)}`}
            className="rounded-md border border-border px-2 py-1 hover:border-primary"
          >
            Siguiente →
          </Link>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-xs">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="px-1 py-1 text-center font-medium text-muted">
            {w}
          </div>
        ))}

        {cells.map((day) => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = dayKey(day) === dayKey(today);
          const dayAppointments = byDay.get(dayKey(day)) ?? [];
          const visible = dayAppointments.slice(0, 3);
          const overflow = dayAppointments.length - visible.length;

          return (
            <div
              key={day.toISOString()}
              className={`min-h-20 rounded-md border p-1 ${
                inMonth ? "border-border bg-surface" : "border-border/40 bg-surface/40"
              } ${isToday ? "border-primary" : ""}`}
            >
              <p
                className={`text-right ${
                  inMonth ? "text-foreground" : "text-muted"
                } ${isToday ? "font-semibold text-primary" : ""}`}
              >
                {day.getDate()}
              </p>
              <div className="mt-1 space-y-0.5">
                {visible.map((a) => (
                  <p
                    key={a.id}
                    className={`truncate rounded bg-primary-soft px-1 text-foreground ${
                      a.status === "CANCELLED" ? "line-through opacity-50" : ""
                    }`}
                    title={a.label}
                  >
                    {a.arrivedAt && "✓ "}
                    {String(a.date.getHours()).padStart(2, "0")}:
                    {String(a.date.getMinutes()).padStart(2, "0")} {a.label}
                  </p>
                ))}
                {overflow > 0 && (
                  <p className="text-muted">+{overflow} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
