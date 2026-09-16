# Changelog — Lobia

Registro de lo construido en la primera versión (MVP) del proyecto, decisiones técnicas tomadas y cómo correrlo.

## Marca

El nombre de la empresa es **Lobia**, slogan "Tecnología inteligente para la salud." El logo (`logoLobia.png`, provisto por el usuario) se procesó con `sharp` para recortarlo al ícono (monograma "L" + corazón), quitarle el fondo sólido y dejarlo transparente en `public/logo.png`. Se usa en el `Header` (`components/Header.tsx`) y como favicon (`app/icon.png`, generado a partir del mismo logo sobre fondo petróleo).

## Qué se construyó

Una web de turnos médicos multi-institución (multi-clínica) con seis roles:

- **Paciente**: se registra (`/registro`), inicia sesión (`/login`), busca profesionales por especialidad (`/profesionales`), reserva un turno haciendo clic en un horario disponible, y gestiona sus turnos en `/mis-turnos` (ver próximos, historial, cancelar). No filtra por institución — ve todos los profesionales de todas las clínicas.
- **Público** (sin login): puede navegar `/profesionales` y ver el detalle/horarios de cada profesional, pero necesita iniciar sesión para reservar.
- **Especialista**: portal propio en `/profesional` — gestiona su agenda semanal, día adicional, licencias, sus turnos (con calendario), mensajes personalizados para pacientes y la configuración de Mercado Pago. Un especialista es un `User` (rol `SPECIALIST`) linkeado 1:1 a un `Professional` existente; el admin o el encargado de su institución le "otorga acceso" desde la ficha del profesional.
- **Secretaria**: portal en `/secretaria`, acotado a UNA institución — busca o da de alta pacientes, les asigna turnos con los profesionales de su institución, y gestiona turnos existentes (`/secretaria/turnos`): cancelar, marcar llegada del paciente, reprogramar.
- **Encargado** (rol `MANAGER`): portal en `/encargado`, espejo del admin pero acotado a UNA institución — profesionales, horarios/día adicional/licencias/mensajes/pagos, turnos, y alta de cuentas de secretaria, todo limitado a su propia clínica. No puede ver ni tocar nada de otra institución.
- **Admin**: panel en `/admin`, sin restricciones — ve y modifica todo en todas las instituciones. Gestiona instituciones (`/admin/instituciones`), especialidades, profesionales, otorga accesos de portal, crea cuentas de secretaria/encargado (`/admin/personal`), y turnos.

### Funcionalidades agregadas sobre el MVP inicial (según el manual de Webturno + pedidos del usuario)

- **Día adicional**: turnos extra para una fecha puntual sin tocar el horario semanal recurrente (modelo `ExtraDay`).
- **Licencias**: bloquean toda la agenda de un profesional durante un rango de fechas, sin importar si el horario viene del `ScheduleSlot` semanal o de un día adicional (modelo `License`).
- **Mensajes personalizables**: cada profesional puede definir el texto que ve el paciente al reservar y al cancelar (`bookingMessage`/`cancelMessage`), mostrado en `/profesionales/[id]` y en `/mis-turnos`.
- **WhatsApp**: cada profesional configura una plantilla de mensaje (con placeholders `{paciente}`, `{fecha}`, `{hora}`) y el sistema arma un link `wa.me/<teléfono>?text=...` — sin API de WhatsApp Business, es solo un link que abre WhatsApp con el mensaje precargado. Aparece en `/profesional/turnos`, `/secretaria/turnos`, `/secretaria/asignar-turno`, `/encargado/turnos` y `/admin/turnos`.
- **Mercado Pago (placeholder)**: cada profesional tiene un estado `mercadoPagoConnected` y un `depositAmount` (monto de seña) configurables en `/profesional/pagos` / la ficha de admin/encargado. La integración real (OAuth + webhooks de Checkout Pro, como hace Webturno) **no está implementada** — ver la sección de alcance más abajo.
- **Multi-institución**: modelo `Institution`, con `Professional.institutionId` y `User.institutionId` (para MANAGER/SECRETARY) opcionales — `null` significa "sin asignar, solo visible por Admin". Toda mutación de Encargado/Secretaria valida contra la institución antes de escribir (`lib/institution-scope.ts`), no solo oculta opciones en la UI.
- **Llegada del paciente**: `Appointment.arrivedAt` (timestamp nullable, aditivo al status BOOKED/CANCELLED). Se marca desde `/secretaria/turnos`, `/encargado/turnos` o `/admin/turnos`.
- **Reprogramar turno**: cambia la fecha/hora de un turno existente revalidando disponibilidad server-side (`rescheduleBooking` en `lib/booking.ts`); resetea `arrivedAt` al reprogramar.
- **Calendario visual (almanaque)**: `components/AppointmentCalendar.tsx`, grilla mensual sin JS de cliente (navegación de mes vía `?month=YYYY-MM`), en las 4 vistas de turnos de staff (admin/encargado/secretaria/especialista — este último solo lectura). El paciente no lo ve, sigue con la lista simple de horarios.

## Diseño visual

Se reemplazó el look genérico por defecto (blanco/negro de Tailwind) por una identidad propia, para no verse igual que los demás sistemas de turnos del rubro (la mayoría usa azul/celeste). Se analizaron competidores (Webturno, Medife, Doctoralia, ZocDoc) y se eligió deliberadamente evitar el azul típico.

Paleta (definida como tokens en `app/globals.css`, vía `@theme inline` de Tailwind 4):

| Uso | Color | Hex |
|---|---|---|
| Primario (header, botones principales, nav) | Petróleo oscuro | `#0F3D3E` |
| Fondo de página | Hueso | `#F7F5F2` |
| Superficies (cards, inputs) | Blanco | `#FFFFFF` |
| Texto | Casi negro verdoso | `#16211E` |
| Texto secundario | Gris verdoso | `#5C6B67` |
| Acento (CTAs: reservar, registrarme) | Terracota | `#E8825A` |
| Error | Rojo ladrillo apagado | `#B5533C` |
| Éxito | Verde salvia | `#3E6259` |

Se aplicó de forma consistente en Header, landing, login/registro, listado y detalle de profesionales, mis turnos, y todo el panel admin. Se sacaron las variantes `dark:` (modo oscuro automático por `prefers-color-scheme`) que tenía el scaffold original, para tener una sola identidad visual intencional en vez de dos versiones a medio pulir.

## Stack

- **Next.js 16** (App Router) + TypeScript — frontend y backend en el mismo proyecto, usando Server Components para lectura y Server Actions para mutaciones (sin API REST separada).
- **Prisma 7** + **SQLite** (`better-sqlite3` como driver adapter) para desarrollo local sin instalar un servidor de base de datos.
- **NextAuth.js v5 (Auth.js)** con Credentials Provider + sesión JWT.
- **Tailwind CSS 4**.

## Modelo de datos (`prisma/schema.prisma`)

- `User` (rol `PATIENT`/`ADMIN`/`SPECIALIST`/`SECRETARY`/`MANAGER`, contraseña hasheada con bcrypt, `institutionId` opcional). Se guarda como `TEXT` sin `CHECK` constraint en SQLite, así que agregar roles nuevos es 100% aditivo.
- `Institution` (clínica/institución) — `institutionId` en `User` y `Professional` queda **nullable para siempre** (nunca se fuerza `NOT NULL`); `null` = sin asignar, solo visible/gestionable por Admin.
- `Specialty` — global, compartida entre instituciones.
- `Professional` — incluye `institutionId`, `userId` (link 1:1 opcional a `User`, null hasta que se le otorga acceso de portal), `bookingMessage`/`cancelMessage`/`whatsappMessageTemplate`, `mercadoPagoConnected`/`depositAmount`.
- `ProfessionalSpecialty` (tabla intermedia N:M)
- `ScheduleSlot` (plantilla semanal recurrente: día, hora inicio/fin, duración del turno)
- `ExtraDay` ("día adicional": disponibilidad puntual para una fecha específica)
- `License` ("licencia": bloquea toda la agenda en un rango de fechas)
- `Appointment` (turno concreto: fecha/hora exacta, estado `BOOKED`/`CANCELLED`, `arrivedAt` nullable para la llegada del paciente)

`ExtraDay.date` y `License.startDate`/`endDate` siempre se normalizan a medianoche local antes de guardar, para poder comparar por igualdad de fecha calendario sin arrastrar la hora.

La disponibilidad de horarios (`lib/availability.ts`) se calcula en tiempo real: toma los `ScheduleSlot` y `ExtraDay` de un profesional, excluye los días bloqueados por una `License` activa, genera los horarios candidatos para los próximos 14 días, y resta los que ya están reservados. La reserva (`lib/booking.ts`, usada tanto por el autoservicio del paciente como por la secretaria) valida de nuevo en el servidor —dentro de una transacción— vía `isSlotAvailableForBooking` (también en `lib/availability.ts`), que chequea licencia + horario semanal o día adicional, para evitar dobles reservas y bypasses de la UI.

### Mutaciones compartidas entre Admin, Encargado y Especialista

`lib/professional-mutations.ts` centraliza cada operación (horarios, día adicional, licencias, mensajes, pagos) como una función que recibe `professionalId` explícito. El admin (superusuario) le pasa el id tomado del formulario; el especialista siempre usa `professional.id` de su propia sesión (nunca un valor del form); el encargado (`actions/manager.ts`) verifica con `professionalInInstitution(...)` (`lib/institution-scope.ts`) que el id pertenezca a su institución **antes** de delegar a la misma función que usa el admin — si no, redirige con `?error=noautorizado` sin escribir nada. Las variantes de borrado/edición además usan `deleteMany`/`updateMany` con where compuesto `{ id, professionalId }`, así un id manipulado en un form no puede tocar la fila de otro profesional. `lib/patients.ts` (alta de paciente) y `lib/booking.ts` (reserva + `rescheduleBooking`) están extraídas de la misma forma para que el autoservicio del paciente y los flujos asistidos por secretaria/encargado/admin compartan exactamente la misma lógica de validación.

## Decisiones y desvíos respecto al plan original

El proyecto se generó con versiones muy recientes de Next.js y Prisma (más nuevas que las conocidas al planificar), lo que obligó a algunos ajustes:

- **`middleware.ts` → `proxy.ts`**: Next.js 16 renombró Middleware a "Proxy". La protección de rutas (`/admin/*`, `/mis-turnos/*`) vive en `proxy.ts`.
- **Prisma 7 requiere un "driver adapter"**: el cliente generado ya no se conecta solo con la `DATABASE_URL` del schema; hay que pasarle explícitamente un adapter (`@prisma/adapter-better-sqlite3`) al instanciar `PrismaClient` (ver `lib/prisma.ts`). Esto es válido para código de la app; el CLI (`migrate`, `db seed`) sigue usando `prisma.config.ts` normalmente.
- **Sin `@auth/prisma-adapter`**: como la autenticación es solo por Credentials (no OAuth) con sesión JWT, no hace falta que NextAuth persista sesiones en la base — se consulta Prisma directamente dentro de `authorize()`. Usar el adapter de Prisma hubiera exigido campos extra en `User` (`emailVerified`, `image`) sin aportar nada al caso de uso.
- **`tsx` en vez de `ts-node`**: el cliente de Prisma 7 genera código pensado para bundlers (imports sin extensión), que Node no puede ejecutar directamente ni siquiera con soporte nativo de TypeScript. `tsx` (usa esbuild) resuelve esto sin fricción para correr `prisma/seed.ts`.
- **`npx auth secret` no es Auth.js**: ese comando resolvió a un paquete npm distinto (`auth`, de la librería "Better Auth") y generó una variable con otro nombre. El secreto de NextAuth (`AUTH_SECRET`) se generó manualmente y se cargó a mano en `.env`.

## Variables de entorno (`.env`)

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="..."
```

## Cómo correr el proyecto

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

El seed crea 2 instituciones ("Sede Centro", "Sede Norte"), 4 especialidades y 4 profesionales repartidos entre ambas con horarios de ejemplo (lunes, miércoles y viernes de 09:00 a 13:00), una licencia de ejemplo (Dr. Ferreyra, +5 a +7 días), un día adicional de ejemplo (Dra. Beltrán, el próximo sábado) y 2 turnos de ejemplo con la Dra. Sosa (uno con `arrivedAt` marcado, otro sin) para ver el calendario con contenido real. Usuarios de prueba:

| Rol | Email | Contraseña | Institución |
|---|---|---|---|
| Admin | `admin@turnos.local` | `admin1234` | todas |
| Encargado | `encargado@turnos.local` | `encargado1234` | Sede Centro |
| Especialista (Dra. Marina Sosa) | `especialista@turnos.local` | `especialista1234` | Sede Centro |
| Secretaria | `secretaria@turnos.local` | `secretaria1234` | Sede Centro |
| Paciente | `paciente@turnos.local` | `paciente1234` | — (no aplica) |

Los pacientes se registran desde `/registro`, o la secretaria puede darlos de alta desde `/secretaria/pacientes`.

## Verificación realizada

Se probó todo el flujo simulando peticiones HTTP reales: login y aislamiento de rutas por rol (`proxy.ts`), secretaria crea paciente y le asigna turno, especialista ve y cancela sus propios turnos con redirect correcto según rol, disponibilidad correcta con día adicional (se suman slots) y licencia (se bloquean, incluso re-validado server-side con un POST directo que bypasea la UI), mensaje personalizado visible al reservar/cancelar, link de WhatsApp con placeholders resueltos, persistencia del estado de Mercado Pago. Para multi-institución además: encargado de Sede Centro recibe 404 al intentar ver un profesional de Sede Norte, un POST con `professionalId` manipulado de otra institución se rechaza con `?error=noautorizado` sin escribir nada en la base (verificado leyendo la fila después), lo que crea un encargado queda con la institución correcta, y ni la lista ni el calendario de turnos de una institución muestran nunca datos de la otra. También se probó marcar llegada y reprogramar (con reset de `arrivedAt`) de punta a punta, y que un turno ajeno a la institución no se puede tocar. `npm run build` y `npm run lint` sin errores después de cada hito. No se probó manualmente en un navegador real (clicks, UI) — se recomienda una pasada visual.

## Fuera de alcance

Quedó fuera a propósito, para no sobre-construir:

- **Integración real de Mercado Pago**: hoy es un estado simulado (checkbox + monto). Falta el flujo OAuth de Checkout Pro y los webhooks de cobro, que requieren un dominio público con HTTPS — no aplican a este entorno de desarrollo local.
- **API de WhatsApp Business**: se usa un link `wa.me` con mensaje precargado, no envío automático.
- Recordatorios automáticos por email/SMS.
- App móvil.
- Que el paciente filtre/elija institución al buscar (hoy ve todos los profesionales de todas las clínicas).
