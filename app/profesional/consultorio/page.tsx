import { requireSpecialist } from "@/lib/auth-helpers";
import { setOwnConsultingRoom } from "@/actions/specialist";

export default async function ProfesionalConsultorioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { professional } = await requireSpecialist();
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        ¿En qué consultorio vas a atender?
      </h1>
      <p className="mt-1 text-muted">
        Se muestra en la pantalla de llamador cuando llamás a un paciente.
        Podés cambiarlo cuando quieras desde acá.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          Ingresá un consultorio.
        </p>
      )}

      <form
        action={setOwnConsultingRoom}
        className="mt-6 flex flex-col gap-3"
      >
        <div>
          <label htmlFor="consultingRoom" className="text-sm font-medium">
            Consultorio
          </label>
          <input
            id="consultingRoom"
            name="consultingRoom"
            required
            autoFocus
            defaultValue={professional.consultingRoom ?? ""}
            placeholder="Ej: Consultorio 3"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
        >
          Continuar
        </button>
      </form>
    </div>
  );
}
