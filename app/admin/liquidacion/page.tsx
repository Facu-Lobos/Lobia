import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { getLiquidationForInstitution } from "@/lib/liquidation";
import { monthParam, parseMonthParam } from "@/components/AppointmentCalendar";

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

export default async function AdminLiquidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin();
  const { month: monthParamValue } = await searchParams;

  const month = parseMonthParam(monthParamValue);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  const rows = await getLiquidationForInstitution(null, monthStart, monthEnd);
  const grandTotal = rows.reduce((sum, r) => sum + (r.total ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Liquidación</h1>
      <p className="mt-1 text-muted">Todas las instituciones.</p>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-medium">
          {MONTH_LABELS[month.getMonth()]} {month.getFullYear()}
        </h2>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/admin/liquidacion?month=${monthParam(prevMonth)}`}
            className="rounded-md border border-border px-2 py-1 hover:border-primary"
          >
            ← Anterior
          </Link>
          <Link
            href={`/admin/liquidacion?month=${monthParam(nextMonth)}`}
            className="rounded-md border border-border px-2 py-1 hover:border-primary"
          >
            Siguiente →
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="py-2">Profesional</th>
              <th className="py-2">Atendidos</th>
              <th className="py-2">Honorario</th>
              <th className="py-2">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-2 font-medium">{r.fullName}</td>
                <td className="py-2">{r.attendedCount}</td>
                <td className="py-2">{r.feeAmount ?? "—"}</td>
                <td className="py-2">{r.total ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-4 text-sm text-muted">No hay profesionales cargados.</p>
        )}
      </div>

      <p className="mt-6 text-lg font-semibold">Total general: {grandTotal}</p>
    </div>
  );
}
