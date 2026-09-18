import "server-only";

// Un <input type="date"> manda "YYYY-MM-DD"; `new Date(esaString)` la
// interpreta como medianoche UTC, que en husos horarios detrás de UTC
// (Argentina) cae en el día anterior en hora local. Se arma la fecha con
// los componentes directamente, en hora local, para evitar ese corrimiento.
export function parseDateOnlyLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}
