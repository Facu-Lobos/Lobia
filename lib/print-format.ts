// Formato de los documentos imprimibles (bono, cierre de caja, historia
// clínica). Los instantes (cuándo se cobró, se abrió la caja, se escribió una
// evolución) se muestran siempre en hora de Argentina, sin importar la zona
// horaria del servidor donde corra el render.
const TZ = "America/Argentina/Buenos_Aires";

export const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Tarjeta de débito",
  CREDITO: "Tarjeta de crédito",
  TRANSFERENCIA: "Transferencia",
  SIN_ESPECIFICAR: "Sin especificar",
};

export function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-AR")}`;
}

export function formatDateAR(date: Date) {
  return date.toLocaleDateString("es-AR", { timeZone: TZ });
}

export function formatDateTimeAR(date: Date) {
  return `${formatDateAR(date)} ${date.toLocaleTimeString("es-AR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

// Fecha de un turno (guardada como medianoche local, ver lib/dates.ts): se
// arma con los componentes locales igual que en el resto de las pantallas.
export function formatAppointmentDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}
