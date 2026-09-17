# Roadmap — Ampliación hacia sistema clínico integral

Este documento prioriza la incorporación de nuevos módulos al sistema de turnos actual, con la mira puesta en un producto final tipo HIS/ERP clínico (referencia: propuesta de SAM Medicina / Nexa Informática para Clínica Privada del Sol, 07/2026).

## Estado actual (base)

Motor de agenda y turnos multi-institución:

- Roles: PATIENT, ADMIN, SPECIALIST, SECRETARY, MANAGER
- Portales: público (`/profesionales`), paciente (`/mis-turnos`), especialista (`/profesional`), secretaría (`/secretaria`), encargado (`/encargado`), admin (`/admin`)
- Agenda semanal recurrente + días adicionales + licencias
- Turnos con estado, hora de llegada, mensajes y plantilla de WhatsApp
- Pagos con seña vía Mercado Pago

Lo que falta y motiva este roadmap: historia clínica, facturación, farmacia, internación, liquidación a obras sociales — el grueso de lo que ofrece un sistema como SAM.

## Criterio de priorización

1. Cercanía al núcleo actual (agenda/turnos) — menor esfuerzo, valor inmediato.
2. Complejidad regulatoria (AFIP, obras sociales) — se deja para cuando haya necesidad real, no especulativa.
3. Alcance — módulos que aplican a cualquier institución vs. los que solo tienen sentido para clínicas grandes con internación.
4. Dependencias — cada fase apoya a la siguiente (ej. HCE es prerequisito de facturación por prestación, imágenes, etc.).

## Fase 1 — Extender el núcleo

Bajo esfuerzo, alto impacto inmediato.

- [x] **Recepción de pacientes**: sala de espera / cola visual y estado del turno en tiempo real (ya existe `arrivedAt` en secretaría). Implementado como vista "Sala de espera" (secretaría, encargado, admin y profesional) con 4 estados: pendiente → esperando → en consulta → atendido, refrescada automáticamente cada 15s.
- [x] **Notificaciones automáticas**: email instantáneo al reservar/cancelar (`lib/appointment-notifications.ts`) + recordatorio de turno por email dentro de las 24hs previas (ya existe `whatsappMessageTemplate`/wa.me para WhatsApp manual; automatizar WhatsApp de verdad requiere la API de Meta, pago y aprobación de negocio — fuera de alcance por ahora). El recordatorio 24hs es `GET /api/cron/reminders`, a disparar desde un scheduler externo (Vercel Cron, cron-job.org, etc.), con `reminderSentAt` para no duplicar envíos. Requiere `SMTP_*` en `.env` para enviar de verdad (si no, sólo se loguea en consola). Ver sección "Emails" en el README.
- [x] **Portal de consulta al paciente**: ver resultados/informes propios + editar sus propios datos. Implementado con el modelo `PatientDocument` (título + archivo, subido por secretaría desde la ficha del paciente en `/secretaria/pacientes/[id]`, servido de forma autenticada vía `/api/documents/[id]`), una sección "Mis documentos" en `/mis-turnos`, y `/mis-turnos/perfil` para que el paciente edite nombre/teléfono/obra social/número de afiliado. Es la puerta de entrada a la HCE (Fase 2).

## Fase 2 — Núcleo clínico

El corazón de un sistema médico real.

- [x] **HCE (Historia Clínica Electrónica)** — versión inicial: `PatientAntecedents` (alergias, enfermedades crónicas, medicación habitual, compartido entre todos los profesionales que atendieron al paciente) y `ClinicalNote` (motivo, diagnóstico, notas, tratamiento — una por turno). El especialista carga ambas desde `/profesional/turnos/[id]/historia-clinica` (con contexto del historial previo del paciente, incluso de otros profesionales); el paciente las ve (sin las notas internas de examen) en `/mis-turnos/historia-clinica`. Pendiente para una v2: imágenes/adjuntos dentro de la evolución, plantillas por especialidad, permisos más finos que "cualquier especialista que lo atendió alguna vez".
- [x] **Gestión con profesionales**: liquidación de honorarios. Se agregó `Professional.feeAmount` (configurable por el propio profesional o por admin/encargado) y se cuenta como "atendido" todo turno con `completedAt` seteado (o sea que pasó por la Sala de Espera hasta el final, Fase 1). Vistas: `/profesional/liquidacion` (propia), `/encargado/liquidacion` (su institución), `/admin/liquidacion` (todas). Nota: turnos viejos, de antes de que existiera la Sala de Espera, no tienen `completedAt` y no cuentan aunque se vean como "Realizado" en Turnos — es esperable, no un bug.

## Fase 3 — Financiero/administrativo

- [ ] **Facturación electrónica (AFIP)**: necesaria en cuanto haya cobro formal a pacientes particulares. Complejidad regulatoria alta (WSFE, CAE).
- [ ] **Finanzas**: caja, ingresos/egresos, conciliación con Mercado Pago.
- [ ] **Compras**: baja prioridad salvo que haya insumos que reponer (ligado a farmacia, fase 4).

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
