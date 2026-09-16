import { requireSpecialist } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  upsertOwnScheduleSlot,
  deleteOwnScheduleSlot,
  createOwnExtraDay,
  deleteOwnExtraDay,
  createOwnLicense,
  deleteOwnLicense,
} from "@/actions/specialist";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function formatShortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export default async function ProfesionalAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { professional } = await requireSpecialist();
  const { error } = await searchParams;

  const [schedules, extraDays, licenses] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { professionalId: professional.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.extraDay.findMany({
      where: { professionalId: professional.id },
      orderBy: { date: "asc" },
    }),
    prisma.license.findMany({
      where: { professionalId: professional.id },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Mi agenda</h1>

      {error === "horario" && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          Revisá el horario: la hora de inicio debe ser anterior a la de fin.
        </p>
      )}
      {error === "diaadicional" && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          Revisá la fecha y el horario del día adicional.
        </p>
      )}
      {error === "licencia" && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          Revisá las fechas: el inicio debe ser anterior o igual al fin.
        </p>
      )}

      <section className="mt-6">
        <h2 className="font-medium">Horarios semanales</h2>
        <div className="mt-3 space-y-2">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-2 text-sm"
            >
              <span>
                {DAY_NAMES[s.dayOfWeek]}: {s.startTime} a {s.endTime} (turnos
                de {s.slotMinutes} min)
              </span>
              <form action={deleteOwnScheduleSlot}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="text-danger hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
          {schedules.length === 0 && (
            <p className="text-sm text-muted">Sin horarios cargados.</p>
          )}
        </div>

        <form
          action={upsertOwnScheduleSlot}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div>
            <label htmlFor="dayOfWeek" className="text-sm font-medium">
              Día
            </label>
            <select
              id="dayOfWeek"
              name="dayOfWeek"
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            >
              {DAY_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startTime" className="text-sm font-medium">
              Desde
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue="09:00"
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="text-sm font-medium">
              Hasta
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue="13:00"
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="slotMinutes" className="text-sm font-medium">
              Duración (min)
            </label>
            <input
              id="slotMinutes"
              name="slotMinutes"
              type="number"
              min={5}
              step={5}
              defaultValue={30}
              className="mt-1 w-24 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 hover:border-primary"
          >
            Agregar horario
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Día adicional</h2>
        <p className="mt-1 text-sm text-muted">
          Turnos extra para una fecha puntual, sin tocar tu horario habitual.
        </p>
        <div className="mt-3 space-y-2">
          {extraDays.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-2 text-sm"
            >
              <span>
                {formatShortDate(e.date)}: {e.startTime} a {e.endTime} (turnos
                de {e.slotMinutes} min)
              </span>
              <form action={deleteOwnExtraDay}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="text-danger hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
          {extraDays.length === 0 && (
            <p className="text-sm text-muted">Sin días adicionales cargados.</p>
          )}
        </div>

        <form
          action={createOwnExtraDay}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div>
            <label htmlFor="extraDate" className="text-sm font-medium">
              Fecha
            </label>
            <input
              id="extraDate"
              name="date"
              type="date"
              required
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="extraStartTime" className="text-sm font-medium">
              Desde
            </label>
            <input
              id="extraStartTime"
              name="startTime"
              type="time"
              required
              defaultValue="09:00"
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="extraEndTime" className="text-sm font-medium">
              Hasta
            </label>
            <input
              id="extraEndTime"
              name="endTime"
              type="time"
              required
              defaultValue="13:00"
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="extraSlotMinutes" className="text-sm font-medium">
              Duración (min)
            </label>
            <input
              id="extraSlotMinutes"
              name="slotMinutes"
              type="number"
              min={5}
              step={5}
              defaultValue={30}
              className="mt-1 w-24 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 hover:border-primary"
          >
            Agregar día
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Licencias</h2>
        <p className="mt-1 text-sm text-muted">
          Bloquea toda tu agenda durante un período (ej. vacaciones).
        </p>
        <div className="mt-3 space-y-2">
          {licenses.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-2 text-sm"
            >
              <span>
                {formatShortDate(l.startDate)} a {formatShortDate(l.endDate)}
                {l.reason ? ` — ${l.reason}` : ""}
              </span>
              <form action={deleteOwnLicense}>
                <input type="hidden" name="id" value={l.id} />
                <button type="submit" className="text-danger hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
          {licenses.length === 0 && (
            <p className="text-sm text-muted">Sin licencias cargadas.</p>
          )}
        </div>

        <form
          action={createOwnLicense}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div>
            <label htmlFor="licenseStart" className="text-sm font-medium">
              Desde
            </label>
            <input
              id="licenseStart"
              name="startDate"
              type="date"
              required
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="licenseEnd" className="text-sm font-medium">
              Hasta
            </label>
            <input
              id="licenseEnd"
              name="endDate"
              type="date"
              required
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="licenseReason" className="text-sm font-medium">
              Motivo (opcional)
            </label>
            <input
              id="licenseReason"
              name="reason"
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 hover:border-primary"
          >
            Agregar licencia
          </button>
        </form>
      </section>
    </div>
  );
}
