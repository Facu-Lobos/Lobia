import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  updateProfessional,
  assignSpecialty,
  removeSpecialty,
  upsertScheduleSlot,
  deleteScheduleSlot,
  createExtraDay,
  deleteExtraDay,
  createLicense,
  deleteLicense,
  updateMessages,
  updatePaymentSettings,
  grantPortalAccess,
} from "@/actions/manager";

function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatShortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default async function EncargadoProfesionalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    creado?: string;
    actualizado?: string;
    accesoCreado?: string;
  }>;
}) {
  const { institutionId } = await requireManager();
  const { id } = await params;
  const { error, creado, actualizado, accesoCreado } = await searchParams;

  const [professional, allSpecialties] = await Promise.all([
    prisma.professional.findUnique({
      where: { id },
      include: {
        specialties: { include: { specialty: true } },
        schedules: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
        extraDays: { orderBy: { date: "asc" } },
        licenses: { orderBy: { startDate: "asc" } },
        user: true,
      },
    }),
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!professional || professional.institutionId !== institutionId) {
    notFound();
  }

  const assignedIds = new Set(professional.specialties.map((ps) => ps.specialtyId));
  const availableSpecialties = allSpecialties.filter((s) => !assignedIds.has(s.id));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {professional.fullName}
      </h1>

      {error === "nombre" && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          Ingresá el nombre del profesional.
        </p>
      )}
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
      {error === "acceso" && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          Revisá el email y la contraseña (mínimo 6 caracteres).
        </p>
      )}
      {error === "emailexistente" && (
        <p className="mt-4 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          Ya existe una cuenta con ese email.
        </p>
      )}
      {(creado || actualizado || accesoCreado) && (
        <p className="mt-4 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          Guardado correctamente.
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-medium">Datos generales</h2>
        <form
          action={updateProfessional}
          className="mt-3 flex max-w-lg flex-col gap-3"
        >
          <input type="hidden" name="id" value={professional.id} />
          <div>
            <label htmlFor="fullName" className="text-sm font-medium">
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              defaultValue={professional.fullName}
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={2}
              defaultValue={professional.bio ?? ""}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={professional.active}
              className="accent-primary"
            />
            Activo (visible para pacientes)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mp" className="text-sm font-medium">
                MP
              </label>
              <input
                id="mp"
                name="mp"
                defaultValue={professional.mp ?? ""}
                placeholder="Matrícula provincial"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="mn" className="text-sm font-medium">
                MN
              </label>
              <input
                id="mn"
                name="mn"
                defaultValue={professional.mn ?? ""}
                placeholder="Matrícula nacional"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="dni" className="text-sm font-medium">
                DNI
              </label>
              <input
                id="dni"
                name="dni"
                defaultValue={professional.dni ?? ""}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="birthDate" className="text-sm font-medium">
                Fecha de nacimiento
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={
                  professional.birthDate
                    ? formatDateInputValue(professional.birthDate)
                    : ""
                }
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label htmlFor="consultingRoom" className="text-sm font-medium">
              Consultorio
            </label>
            <input
              id="consultingRoom"
              name="consultingRoom"
              defaultValue={professional.consultingRoom ?? ""}
              placeholder="Ej: Consultorio 3"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-muted">
              Se muestra en la pantalla de llamador cuando el paciente pasa a
              &quot;en consulta&quot;.
            </p>
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Guardar
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Especialidades</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {professional.specialties.map((ps) => (
            <form key={ps.specialtyId} action={removeSpecialty}>
              <input type="hidden" name="professionalId" value={professional.id} />
              <input type="hidden" name="specialtyId" value={ps.specialtyId} />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-sm hover:border-danger hover:text-danger"
              >
                {ps.specialty.name} ✕
              </button>
            </form>
          ))}
          {professional.specialties.length === 0 && (
            <p className="text-sm text-muted">Sin especialidades asignadas.</p>
          )}
        </div>

        {availableSpecialties.length > 0 && (
          <form action={assignSpecialty} className="mt-4 flex items-end gap-2">
            <input type="hidden" name="professionalId" value={professional.id} />
            <div>
              <label htmlFor="specialtyId" className="text-sm font-medium">
                Agregar especialidad
              </label>
              <select
                id="specialtyId"
                name="specialtyId"
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              >
                {availableSpecialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md border border-border px-4 py-2 hover:border-primary"
            >
              Agregar
            </button>
          </form>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Horarios semanales</h2>
        <div className="mt-3 space-y-2">
          {professional.schedules.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-2 text-sm"
            >
              <span>
                {DAY_NAMES[s.dayOfWeek]}: {s.startTime} a {s.endTime} (turnos de{" "}
                {s.slotMinutes} min)
              </span>
              <form action={deleteScheduleSlot}>
                <input type="hidden" name="id" value={s.id} />
                <input
                  type="hidden"
                  name="professionalId"
                  value={professional.id}
                />
                <button
                  type="submit"
                  className="text-danger hover:underline"
                >
                  Eliminar
                </button>
              </form>
            </div>
          ))}
          {professional.schedules.length === 0 && (
            <p className="text-sm text-muted">Sin horarios cargados.</p>
          )}
        </div>

        <form
          action={upsertScheduleSlot}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="professionalId" value={professional.id} />
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
          Turnos extra para una fecha puntual, sin tocar el horario habitual.
        </p>
        <div className="mt-3 space-y-2">
          {professional.extraDays.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-2 text-sm"
            >
              <span>
                {formatShortDate(e.date)}: {e.startTime} a {e.endTime} (turnos
                de {e.slotMinutes} min)
              </span>
              <form action={deleteExtraDay}>
                <input type="hidden" name="id" value={e.id} />
                <input
                  type="hidden"
                  name="professionalId"
                  value={professional.id}
                />
                <button type="submit" className="text-danger hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
          {professional.extraDays.length === 0 && (
            <p className="text-sm text-muted">Sin días adicionales cargados.</p>
          )}
        </div>

        <form
          action={createExtraDay}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="professionalId" value={professional.id} />
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
          Bloquea toda la agenda del profesional durante un período (ej.
          vacaciones).
        </p>
        <div className="mt-3 space-y-2">
          {professional.licenses.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-2 text-sm"
            >
              <span>
                {formatShortDate(l.startDate)} a {formatShortDate(l.endDate)}
                {l.reason ? ` — ${l.reason}` : ""}
              </span>
              <form action={deleteLicense}>
                <input type="hidden" name="id" value={l.id} />
                <input
                  type="hidden"
                  name="professionalId"
                  value={professional.id}
                />
                <button type="submit" className="text-danger hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
          {professional.licenses.length === 0 && (
            <p className="text-sm text-muted">Sin licencias cargadas.</p>
          )}
        </div>

        <form
          action={createLicense}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="professionalId" value={professional.id} />
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

      <section className="mt-10">
        <h2 className="font-medium">Mensajes</h2>
        <p className="mt-1 text-sm text-muted">
          Textos personalizados que ve el paciente y mensaje predeterminado de
          WhatsApp.
        </p>
        <form
          action={updateMessages}
          className="mt-3 flex max-w-lg flex-col gap-4"
        >
          <input type="hidden" name="professionalId" value={professional.id} />
          <div>
            <label htmlFor="bookingMessage" className="text-sm font-medium">
              Mensaje al reservar
            </label>
            <textarea
              id="bookingMessage"
              name="bookingMessage"
              rows={2}
              defaultValue={professional.bookingMessage ?? ""}
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
              Podés usar {"{paciente}"}, {"{fecha}"} y {"{hora}"}.
            </p>
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Guardar
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Mercado Pago</h2>
        <p className="mt-1 rounded-md bg-primary-soft px-4 py-3 text-sm text-foreground">
          Simulación. La integración real (OAuth y webhooks de cobro) todavía
          no está implementada — requiere un dominio público con HTTPS.
        </p>
        <form
          action={updatePaymentSettings}
          className="mt-3 flex max-w-md flex-col gap-4"
        >
          <input type="hidden" name="professionalId" value={professional.id} />
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
              placeholder="Dejar vacío si no pide seña"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="feeAmount" className="text-sm font-medium">
              Honorario por turno atendido (opcional)
            </label>
            <input
              id="feeAmount"
              name="feeAmount"
              type="number"
              min={0}
              step={100}
              defaultValue={professional.feeAmount ?? ""}
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
      </section>

      <section className="mt-10">
        <h2 className="font-medium">Acceso al portal</h2>
        {professional.user ? (
          <p className="mt-3 text-sm text-muted">
            Este profesional ya tiene acceso a su portal con el email{" "}
            <span className="font-medium text-foreground">
              {professional.user.email}
            </span>
            .
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">
              Creá un login para que este profesional gestione su propia
              agenda en /profesional.
            </p>
            <form
              action={grantPortalAccess}
              className="mt-3 flex max-w-lg flex-col gap-3"
            >
              <input
                type="hidden"
                name="professionalId"
                value={professional.id}
              />
              <div>
                <label htmlFor="accessEmail" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="accessEmail"
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="accessPassword"
                  className="text-sm font-medium"
                >
                  Contraseña
                </label>
                <input
                  id="accessPassword"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
              >
                Crear acceso
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
