# Roadmap — Ampliación hacia sistema clínico integral

Este documento prioriza la incorporación de nuevos módulos al sistema de turnos actual, con la mira puesta en un producto final tipo HIS/ERP clínico (referencia: propuesta de SAM Medicina / Nexa Informática para Clínica Privada del Sol, 07/2026).

## Estado actual (base)

Motor de agenda y turnos multi-institución:

- Login (18/09/2026): paciente y especialista se identifican con **email**; secretaria, encargado y admin lo hacen con **username** (sin email) — `User.email`/`User.username` ahora son ambos opcionales y únicos, un solo campo "Email o usuario" en `/login` prueba contra los dos. Las cuentas de secretaria/encargado ya existentes se migraron a username (ver `git log` de esa fecha si hace falta el detalle).
- Roles: PATIENT, ADMIN, SPECIALIST, SECRETARY, MANAGER — permisos (17/09/2026):
  - **Admin**: todo, todas las instituciones (crea instituciones, asigna roles).
  - **Encargado (MANAGER)**: espejo del Admin acotado a su institución — crea/edita profesionales, especialidades (agregar; borrar sigue siendo admin-only por ser lista global), horarios, días adicionales, licencias, personal.
    - El alta de profesional (18/09/2026) ya pide MP, MN, DNI, fecha de nacimiento, una especialidad y un horario semanal inicial, todos opcionales — se pueden completar ahí mismo o después desde la ficha del profesional. Mismo formulario en Admin (`Professional.mp/mn/dni/birthDate`, nuevos).
  - **Secretaria**: opera el día a día (pacientes, asignar turno, sala de espera, finanzas, facturación) y **ve** profesionales/especialidades de su institución en modo sólo lectura (`/secretaria/profesionales`, `/secretaria/especialidades`) — no puede crear ni borrar configuración.
  - **Paciente**: sus propios turnos, historia clínica y documentos.
- Portales: público (`/profesionales`), paciente (`/mis-turnos`), especialista (`/profesional`), secretaría (`/secretaria`), encargado (`/encargado`), admin (`/admin`)
  - La landing pública (`/`) y `/profesionales` arrancan por institución (18/09/2026), no por especialidad — reflejo del carácter multi-institución del sistema; la especialidad sigue disponible como segundo filtro combinable en `/profesionales`.
- Agenda semanal recurrente + días adicionales + licencias
- Turnos con estado, hora de llegada, mensajes y plantilla de WhatsApp
- Pagos con seña vía Mercado Pago

Lo que falta y motiva este roadmap: historia clínica, facturación, farmacia, internación, liquidación a obras sociales — el grueso de lo que ofrece un sistema como SAM.

**Infraestructura (17/09/2026):** listo para desplegar en Vercel.
- Base de datos migrada de SQLite a Postgres alojado en Supabase, **con datos incluidos** (no sólo el esquema) — ver sección "Base de datos" en el README.
- Documentos de pacientes movidos de disco local a Supabase Storage (bucket privado, `SUPABASE_SERVICE_ROLE_KEY`) — ver sección "Documentos de pacientes" en el README. Esto era el otro bloqueante para un filesystem efímero tipo Vercel.
- `vercel.json` agregado con el Cron Job del recordatorio de 24hs, para que se dispare solo apenas se despliegue (antes había que configurarlo a mano en un scheduler externo).

## Criterio de priorización

1. Cercanía al núcleo actual (agenda/turnos) — menor esfuerzo, valor inmediato.
2. Complejidad regulatoria (AFIP, obras sociales) — se deja para cuando haya necesidad real, no especulativa.
3. Alcance — módulos que aplican a cualquier institución vs. los que solo tienen sentido para clínicas grandes con internación.
4. Dependencias — cada fase apoya a la siguiente (ej. HCE es prerequisito de facturación por prestación, imágenes, etc.).

## Fase 1 — Extender el núcleo

Bajo esfuerzo, alto impacto inmediato.

- [x] **Recepción de pacientes**: sala de espera / cola visual y estado del turno en tiempo real (ya existe `arrivedAt` en secretaría). Implementado como vista "Sala de espera" (secretaría, encargado, admin y profesional) con 4 estados: pendiente → esperando → en consulta → atendido, refrescada automáticamente cada 15s. Navegable por día (almanaque tipo date-picker, no solo ← anterior / siguiente) y filtrable por profesional (staff); usa la misma tabla `Appointment` que "Mis Turnos" del paciente, así que un turno reservado online aparece ahí directo, sin duplicar datos. El especialista ya podía avanzar sus propios turnos (esperando → en consulta → atendido) desde `/profesional/sala-espera` desde el principio.
  - Rediseño en grilla (17/09/2026), inspirado en la lógica del sistema de agenda legado de Clínica del Sol (carpeta `ejemplo/`, no versionada — ver `.gitignore`): al elegir un profesional puntual se muestra una grilla horaria (`DaySlotGrid`) con una fila por turno de su horario del día (hora, paciente, obra social, estado, acción), más una tira semanal (`WeeklyHoursStrip`) con los horarios cargados de esa semana. Nuevo `DatePicker` (almanaque mensual, con atajo "Hoy") reemplaza la navegación día por día.
  - "Todos los profesionales" también usa la grilla (18/09/2026), no el kanban: secretaría/encargado/admin ven una `DaySlotGrid` por cada médico de su institución (`MultiProfessionalGrid`), mientras que el profesional sigue viendo solo la suya propia en `/profesional/sala-espera`. Se quitó el componente `WaitingRoom` (kanban), ya sin uso.
- [x] **Llamador**: pantalla de texto grande pensada para un TV en la sala de espera física (`/secretaria|encargado|admin/llamador`), que muestra el paciente que está pasando a "en consulta" junto con el `consultingRoom` (consultorio) configurado en el profesional. Se actualiza sola cada 8s. `Professional.consultingRoom` es editable desde "Datos generales" en la ficha del profesional (admin/encargado).
- [x] **Notificaciones automáticas**: email instantáneo al reservar/cancelar (`lib/appointment-notifications.ts`) + recordatorio de turno por email dentro de las 24hs previas (ya existe `whatsappMessageTemplate`/wa.me para WhatsApp manual; automatizar WhatsApp de verdad requiere la API de Meta, pago y aprobación de negocio — fuera de alcance por ahora). El recordatorio 24hs es `GET /api/cron/reminders`, a disparar desde un scheduler externo (Vercel Cron, cron-job.org, etc.) — **eso todavía no está configurado**, con `reminderSentAt` para no duplicar envíos cuando se configure. Envío real (SMTP Gmail, remitente `lobiainfo@gmail.com`) **verificado y funcionando desde el 17/09/2026** para reserva/cancelación — probado end-to-end reservando con un usuario real. Ver sección "Emails" en el README.
- [x] **Portal de consulta al paciente**: ver resultados/informes propios + editar sus propios datos. Implementado con el modelo `PatientDocument` (título + archivo, subido por secretaría desde la ficha del paciente en `/secretaria/pacientes/[id]`, servido de forma autenticada vía `/api/documents/[id]`), una sección "Mis documentos" en `/mis-turnos`, y `/mis-turnos/perfil` para que el paciente edite nombre/teléfono/obra social/número de afiliado. Es la puerta de entrada a la HCE (Fase 2).

## Fase 2 — Núcleo clínico

El corazón de un sistema médico real.

- [x] **HCE (Historia Clínica Electrónica)** — versión inicial: `PatientAntecedents` (alergias, enfermedades crónicas, medicación habitual, compartido entre todos los profesionales que atendieron al paciente) y `ClinicalNote` (motivo, diagnóstico, notas, tratamiento — una por turno). El especialista carga ambas desde `/profesional/turnos/[id]/historia-clinica` (con contexto del historial previo del paciente, incluso de otros profesionales); el paciente las ve (sin las notas internas de examen) en `/mis-turnos/historia-clinica`. Pendiente para una v2: imágenes/adjuntos dentro de la evolución, plantillas por especialidad, permisos más finos que "cualquier especialista que lo atendió alguna vez".
- [x] **Gestión con profesionales**: liquidación de honorarios. Se agregó `Professional.feeAmount` (configurable por el propio profesional o por admin/encargado) y se cuenta como "atendido" todo turno con `completedAt` seteado (o sea que pasó por la Sala de Espera hasta el final, Fase 1). Vistas: `/profesional/liquidacion` (propia), `/encargado/liquidacion` (su institución), `/admin/liquidacion` (todas). Nota: turnos viejos, de antes de que existiera la Sala de Espera, no tienen `completedAt` y no cuentan aunque se vean como "Realizado" en Turnos — es esperable, no un bug.

## Fase 3 — Financiero/administrativo

- [x] **Facturación electrónica (AFIP)** — **no implementada de verdad, y no se puede** sin datos fiscales reales del cliente (CUIT, certificado digital, punto de venta homologado en WSFE). Lo que sí se construyó: un modelo `Invoice` de "comprobante interno" (no válido ante AFIP, con disclaimer explícito en cada comprobante) generado con un click desde el Historial de un turno, con vistas de listado y detalle/impresión en `/secretaria`, `/encargado` y `/admin` bajo `/facturacion`. Cuando haya credenciales AFIP reales, este es el punto de enganche para reemplazar la generación por una llamada real a WSFE.
- [x] **Finanzas**: caja de ingresos/egresos cargados a mano por el staff (`Transaction`), con balance mensual. Vistas en `/secretaria/finanzas` y `/encargado/finanzas` (su institución) y `/admin/finanzas` (todas, con selector de institución al cargar). No hay conciliación automática con Mercado Pago porque esa integración sigue siendo una simulación (sin webhooks reales, ver `/profesional/pagos`).
- [ ] **Compras**: se deja afuera, tal como marca este mismo roadmap — sin cliente concreto que la pida todavía (depende de farmacia, Fase 4).

## Fase 4 — Solo para clínicas/hospitales

No aplica a un profesional individual o consultorio chico; se implementa cuando haya un cliente concreto que lo necesite.

- [ ] **Liquidación a obras sociales/gerenciadoras**: nomenclador, presentación de planillas.
- [ ] **Manejo de camas/internación**.
- [ ] **Farmacia interna + vademécum**.
- [ ] **Protocolo e informes de imágenes (ECO/RX/TAC)**.

## Fase 5 — Transversal

Tiene más valor cuando ya hay datos reales circulando de las fases anteriores.

- [ ] **Tablero de control / BI**: reportes y métricas sobre lo ya construido.

## Notas

- Las fases 4 son verticales de nicho: no construir de forma especulativa, esperar demanda real de un cliente.
- Revisar y reordenar este roadmap a medida que cambien las prioridades del negocio.
