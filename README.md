# Lobia — Turnos Médicos

Aplicación web de **Lobia** ("Tecnología inteligente para la salud") para reservar turnos con profesionales de la salud, inspirada en [Webturno](https://webturno.com.ar). Multi-institución (multi-clínica): pacientes, especialistas, secretarias, encargados de institución y administradores tienen cada uno su propio portal.

Ver [CHANGELOG.md](./CHANGELOG.md) para el detalle completo de lo construido y las decisiones técnicas tomadas.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Prisma 7](https://www.prisma.io) + SQLite (desarrollo local)
- [NextAuth.js v5](https://authjs.dev) (Credentials + JWT)
- Tailwind CSS 4

## Primeros pasos

```bash
npm install
npx prisma migrate dev   # crea la base de datos SQLite
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

- Al reservar o cancelar un turno (`lib/booking.ts`, `actions/appointments.ts`) se manda un email instantáneo al paciente. Si falla el envío, no rompe la reserva/cancelación (sólo se loguea el error).
- `GET /api/cron/reminders` envía un recordatorio a los turnos que ocurren dentro de las próximas 24hs (una sola vez por turno, gracias a `reminderSentAt`). No hay scheduler propio: hay que dispararlo desde afuera (Vercel Cron, cron-job.org, GitHub Actions, etc.) cada 15-60 minutos.

Variables de entorno (`.env`, todas opcionales):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — sin esto, los emails se loguean en consola en vez de enviarse (útil para probar en dev). Para Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=tu@gmail.com`, `SMTP_PASS=<contraseña de aplicación de 16 caracteres>` (no la contraseña normal — hay que generarla en la cuenta de Google con verificación en 2 pasos activada).
- `CRON_SECRET` — si está definida, el endpoint exige el header `Authorization: Bearer <CRON_SECRET>`.

## Mi perfil (paciente)

Desde `/mis-turnos/perfil` el paciente edita nombre, teléfono, obra social y número de afiliado (`actions/patient.ts`). El email no es editable ahí (es el identificador de login).

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npx prisma studio` — explorar la base de datos
- `npx prisma db seed` — recargar datos de prueba
