import { requireSpecialist } from "@/lib/auth-helpers";
import { updateOwnPaymentSettings } from "@/actions/specialist";

export default async function ProfesionalPagosPage({
  searchParams,
}: {
  searchParams: Promise<{ actualizado?: string }>;
}) {
  const { professional } = await requireSpecialist();
  const { actualizado } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Pagos</h1>
      <p className="mt-1 text-muted">
        Cobrá una seña al reservar, acreditada directamente en tu cuenta de
        Mercado Pago.
      </p>

      <p className="mt-4 rounded-md bg-primary-soft px-4 py-3 text-sm text-foreground">
        Esto es una simulación. La integración real con Mercado Pago (OAuth y
        webhooks de cobro) todavía no está implementada — requiere un dominio
        público con HTTPS. Por ahora podés dejar cargado el monto de la seña y
        marcar el estado de conexión manualmente.
      </p>

      {actualizado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Guardado correctamente.
        </p>
      )}

      <form
        action={updateOwnPaymentSettings}
        className="mt-6 flex max-w-md flex-col gap-4"
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="mercadoPagoConnected"
            defaultChecked={professional.mercadoPagoConnected}
            className="accent-primary"
          />
          Marcar como conectado a Mercado Pago
        </label>
        <div>
          <label htmlFor="depositAmount" className="text-sm font-medium">
            Monto de la seña (opcional)
          </label>
          <input
            id="depositAmount"
            name="depositAmount"
            type="number"
            min={0}
            step={100}
            defaultValue={professional.depositAmount ?? ""}
            placeholder="Dejar vacío si no pedís seña"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
