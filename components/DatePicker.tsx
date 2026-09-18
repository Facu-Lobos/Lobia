import Link from "next/link";
import { monthParam } from "@/components/AppointmentCalendar";

const WEEKDAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayParamValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Almanaque compacto tipo "date picker": cada día es un link que fija
// ?date=YYYY-MM-DD (preservando el resto de los query params via extraQuery),
// pensado para elegir el día de la grilla de Sala de espera.
export function DatePicker({
  month,
  selectedDate,
  basePath,
  extraQuery = "",
}: {
  month: Date;
  selectedDate: Date;
  basePath: string;
  extraQuery?: string;
}) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
  const totalCells =
    Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1;

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
    <div className="w-full max-w-xs rounded-md border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <Link
          href={`${basePath}?month=${monthParam(prevMonth)}&date=${dayParamValue(selectedDate)}${extraQuery}`}
          className="rounded px-2 py-1 text-sm hover:bg-primary-soft"
        >
          ←
        </Link>
        <p className="text-sm font-medium">
          {MONTH_LABELS[month.getMonth()]} {month.getFullYear()}
        </p>
        <Link
          href={`${basePath}?month=${monthParam(nextMonth)}&date=${dayParamValue(selectedDate)}${extraQuery}`}
          className="rounded px-2 py-1 text-sm hover:bg-primary-soft"
        >
          →
        </Link>
      </div>

      <Link
        href={`${basePath}?date=${dayParamValue(today)}&month=${monthParam(today)}${extraQuery}`}
        className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
      >
        Hoy
      </Link>

      <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-xs">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1 font-medium text-muted">
            {w}
          </div>
        ))}
        {cells.map((day) => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = dayKey(day) === dayKey(today);
          const isSelected = dayKey(day) === dayKey(selectedDate);
          return (
            <Link
              key={day.toISOString()}
              href={`${basePath}?date=${dayParamValue(day)}&month=${monthParam(month)}${extraQuery}`}
              className={`rounded py-1 ${
                isSelected
                  ? "bg-primary font-semibold text-white"
                  : isToday
                    ? "border border-primary text-primary"
                    : inMonth
                      ? "hover:bg-primary-soft"
                      : "text-muted/50 hover:bg-primary-soft"
              }`}
            >
              {day.getDate()}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
