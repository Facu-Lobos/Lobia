import { requireSpecialist } from "@/lib/auth-helpers";
import { updateOwnMessages } from "@/actions/specialist";

export default async function ProfesionalMensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ actualizado?: string }>;
}) {
  const { professional } = await requireSpecialist();
  const { actualizado } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Mensajes</h1>
      <p className="mt-1 text-muted">
        Personalizá lo que ven tus pacientes al reservar o cancelar, y el
        mensaje predeterminado para contactarlos por WhatsApp.
      </p>

      {actualizado && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Guardado correctamente.
        </p>
      )}

      <form
        action={updateOwnMessages}
        className="mt-6 flex max-w-lg flex-col gap-4"
      >
        <div>
          <label htmlFor="bookingMessage" className="text-sm font-medium">
            Mensaje al reservar
          </label>
          <textarea
            id="bookingMessage"
            name="bookingMessage"
            rows={2}
            defaultValue={professional.bookingMessage ?? ""}
            placeholder="Ej: Llegá 10 minutos antes de tu turno."
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="cancelMessage" className="text-sm font-medium">
            Mensaje al cancelar
          </label>
          <textarea
            id="cancelMessage"
            name="cancelMessage"
            rows={2}
            defaultValue={professional.cancelMessage ?? ""}
            placeholder="Ej: Si necesitás reprogramar, escribinos por WhatsApp."
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label
            htmlFor="whatsappMessageTemplate"
            className="text-sm font-medium"
          >
            Mensaje predeterminado de WhatsApp
          </label>
          <textarea
            id="whatsappMessageTemplate"
            name="whatsappMessageTemplate"
            rows={2}
            defaultValue={professional.whatsappMessageTemplate ?? ""}
            placeholder="Hola {paciente}, te escribimos por tu turno del {fecha} a las {hora}."
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted">
            Podés usar {"{paciente}"}, {"{fecha}"} y {"{hora}"} — se
            reemplazan automáticamente.
          </p>
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
