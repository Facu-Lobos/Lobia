# Lobia — Turnos Médicos

Aplicación web de **Lobia** ("Tecnología inteligente para la salud") para reservar turnos con profesionales de la salud, inspirada en [Webturno](https://webturno.com.ar). Multi-institución (multi-clínica): pacientes, especialistas, secretarias, encargados de institución y administradores tienen cada uno su propio portal.

Ver [CHANGELOG.md](./CHANGELOG.md) para el detalle completo de lo construido y las decisiones técnicas tomadas.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Prisma 7](https://www.prisma.io) + [Supabase](https://supabase.com) (Postgres alojado, vía `@prisma/adapter-pg`)
- [NextAuth.js v5](https://authjs.dev) (Credentials + JWT)
- Tailwind CSS 4

## Base de datos (Supabase Postgres)

`DATABASE_URL` en `.env` apunta al **Session pooler** de Supabase (puerto `5432`, host `aws-0-<región>.pooler.supabase.com`), no a la conexión directa (`db.<ref>.supabase.co`) — esa última sólo tiene IPv6 y suele fallar desde redes sin salida IPv6. El string del pooler se consigue desde el botón **Connect** del dashboard de Supabase → pestaña "Session pooler" (o "Transaction pooler" si se agrega `?pgbouncer=true` más adelante para runtime serverless).

Migrado desde SQLite el 17/09/2026, **con los datos** (no sólo el esquema): se copiaron todas las filas de `dev.db` tabla por tabla, preservando IDs, a una base Postgres recién limpiada. `dev.db` ya no se usa pero se dejó en el filesystem por las dudas.

## Primeros pasos

```bash
npm install
npx prisma migrate dev   # aplica las migraciones contra Supabase
npx prisma db seed       # carga datos de prueba
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

### Usuarios de prueba (creados por el seed)

| Rol | Email | Contraseña | Portal | Institución |
|---|---|---|---|---|
| Admin | `admin@turnos.local` | `admin1234` | `/admin` | todas |
| Encargado | `encargado@turnos.local` | `encargado1234` | `/encargado` | Sede Centro |
| Especialista (Dra. Marina Sosa) | `especialista@turnos.local` | `especialista1234` | `/profesional` | Sede Centro |
| Secretaria | `secretaria@turnos.local` | `secretaria1234` | `/secretaria` | Sede Centro |
| Paciente | `paciente@turnos.local` | `paciente1234` | `/mis-turnos` | — |

Los pacientes se registran desde `/registro`, o la secretaria los da de alta desde `/secretaria/pacientes`. El Encargado ve/gestiona todo lo de su institución (profesionales, horarios, turnos, personal); el Admin ve y gestiona todo, en todas las instituciones.

## Estructura

```
app/
  profesionales/        Listado y detalle público de profesionales
  mis-turnos/            Turnos del paciente logueado
  profesional/           Portal del especialista (agenda, día adicional, licencias, turnos+calendario, mensajes, pagos)
  secretaria/             Portal de la secretaria (pacientes, asignar turno, turnos+calendario con llegada/reprogramar)
  encargado/              Portal del encargado de institución (espejo de admin, acotado a su institución)
  admin/                  Panel de administración (superusuario, todas las instituciones)
  api/auth/               Route handler de NextAuth
actions/                  Server Actions (mutaciones), agrupadas por rol
lib/                       Prisma client, auth helpers, disponibilidad, reservas, mutaciones y guardas de institución compartidas
components/                AppointmentCalendar y demás componentes compartidos
prisma/                    schema.prisma, migraciones y seed
```

## Emails (confirmación, cancelación y recordatorios)

- Al reservar o cancelar un turno (`lib/booking.ts`, `actions/appointments.ts`) se manda un email instantáneo al paciente (destinatario: el email del paciente, nunca el remitente). Si falla el envío, no rompe la reserva/cancelación (sólo se loguea el error).
- `GET /api/cron/reminders` envía un recordatorio a los turnos que ocurren dentro de las próximas 24hs (una sola vez por turno, gracias a `reminderSentAt`). Se dispara solo, una vez por día, vía **Vercel Cron** (`vercel.json`) — funciona automáticamente en cuanto el proyecto esté desplegado en Vercel con `CRON_SECRET` seteado (Vercel manda ese header solo). En local (`npm run dev`) no hay nada que lo dispare; hay que pegarle al endpoint a mano para probarlo.
- **Estado actual: envío real activo y verificado** (17/09/2026) vía Gmail SMTP, remitente `lobiainfo@gmail.com`. Las credenciales viven sólo en `.env` local (gitignoreado, nunca se commitean).

Variables de entorno (`.env`, todas opcionales — sin ellas, los emails se loguean en consola en vez de enviarse, útil para dev):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Para Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=tu@gmail.com`, `SMTP_PASS=<contraseña de aplicación de 16 caracteres, sin espacios>` — **no** la contraseña normal de la cuenta: se genera en Google → Seguridad → Verificación en 2 pasos (activarla primero) → Contraseñas de aplicaciones.
- `CRON_SECRET` — si está definida, el endpoint exige el header `Authorization: Bearer <CRON_SECRET>` (lo manda Vercel Cron automáticamente cuando esta variable está seteada en el proyecto).

## Documentos de pacientes (Supabase Storage)

Los archivos que sube el staff (`/secretaria/pacientes/[id]`) se guardan en un bucket **privado** de Supabase Storage (`patient-documents`), no en disco local — necesario para andar en un hosting serverless como Vercel, donde el filesystem es efímero. Se sirven siempre a través de `/api/documents/[id]` (autenticado, nunca por URL pública directa de Supabase).

Variables de entorno:

- `SUPABASE_URL` — `https://<project-ref>.supabase.co`.
- `SUPABASE_SERVICE_ROLE_KEY` — key de servidor (bypassea RLS). **Nunca** exponerla al cliente/navegador; sólo se usa en `lib/documents.ts` y `lib/supabase.ts`, ambos server-only.

## Mi perfil (paciente)

Desde `/mis-turnos/perfil` el paciente edita nombre, teléfono, obra social y número de afiliado (`actions/patient.ts`). El email no es editable ahí (es el identificador de login).

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npx prisma studio` — explorar la base de datos
- `npx prisma db seed` — recargar datos de prueba
