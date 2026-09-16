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

- [ ] **Recepción de pacientes**: sala de espera / cola visual y estado del turno en tiempo real (ya existe `arrivedAt` en secretaría).
- [ ] **Notificaciones automáticas**: recordatorios de turno por email/WhatsApp (ya existe `whatsappMessageTemplate`, falta el envío automatizado).
- [ ] **Portal de consulta al paciente**: ver resultados/informes propios. Requiere un modelo mínimo de "documento clínico"; es la puerta de entrada a la HCE.

## Fase 2 — Núcleo clínico

El corazón de un sistema médico real.

- [ ] **HCE (Historia Clínica Electrónica)**: antecedentes, evoluciones, diagnósticos por consulta. La pieza más grande y de mayor valor; todo lo demás (imágenes, farmacia) depende de esto.
- [ ] **Gestión con profesionales**: liquidación de honorarios por turno atendido (ya existe el vínculo Professional↔Appointment, falta cálculo/reporte).

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
