import Link from "next/link";
import { requireSpecialist } from "@/lib/auth-helpers";
import { getLiquidationForProfessional } from "@/lib/liquidation";
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

export default async function ProfesionalLiquidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { professional } = await requireSpecialist();
  const { month: monthParamValue } = await searchParams;

  const month = parseMonthParam(monthParamValue);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  const { attendedCount, feeAmount, total } = await getLiquidationForProfessional(
    professional.id,
    monthStart,
    monthEnd
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Liquidación</h1>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-medium">
          {MONTH_LABELS[month.getMonth()]} {month.getFullYear()}
        </h2>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/profesional/liquidacion?month=${monthParam(prevMonth)}`}
            className="rounded-md border border-border px-2 py-1 hover:border-primary"
          >
            ← Anterior
          </Link>
          <Link
            href={`/profesional/liquidacion?month=${monthParam(nextMonth)}`}
            className="rounded-md border border-border px-2 py-1 hover:border-primary"
          >
            Siguiente →
          </Link>
        </div>
      </div>

      {!feeAmount && (
        <p className="mt-4 rounded-md bg-primary-soft px-4 py-3 text-sm text-foreground">
          Todavía no configuraste tu honorario por turno.{" "}
          <Link href="/profesional/pagos" className="underline">
            Configurarlo en Pagos
          </Link>
          .
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-3xl font-semibold text-primary">{attendedCount}</p>
          <p className="mt-1 text-sm text-muted">Turnos atendidos</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-3xl font-semibold text-primary">
            {feeAmount ?? "—"}
          </p>
          <p className="mt-1 text-sm text-muted">Honorario por turno</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-3xl font-semibold text-primary">{total ?? "—"}</p>
          <p className="mt-1 text-sm text-muted">Total a liquidar</p>
        </div>
      </div>
    </div>
  );
}
