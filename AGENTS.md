# AGENTS - FRONTEND-STACK-NEXT-TAILWIND

## Objetivo

Definir roles operativos para que distintos agentes trabajen el frontend sin romper contratos de integracion con backend.

## Skill inventory revisado

Skills disponibles hoy en el entorno:

- `find-skills`
- `landing-page-guide-v2`
- `skill-creator`
- `skill-installer`
- `slides`
- `spreadsheets`

Regla de orquestacion:

- Los roles de agentes se definen con base en este inventario.
- Si una tarea cae en el dominio de una skill, se prioriza el agente asociado a esa skill.

## Prompt templates

Plantillas listas para ejecutar:

- `agents/README.md`
- `agents/prompts/*.md`

## Fuentes de verdad (orden de prioridad)

1. `openapi/openapi.yaml` y `openapi/paths/*`
2. `docs/10_IMPLEMENTATION_GUIDE_V2.md`
3. `docs/20_ACCESS_MATRIX.md`
4. `docs/30_API_CLIENT_STANDARD.md`
5. `docs/40_STATE_AND_CACHE_POLICY.md`
6. `docs/50_ERROR_CATALOG.md`
7. `docs/70_E2E_CRITICAL_FLOWS.md`
8. `docs/80_BACKEND_DEPENDENCIES.md`
9. `docs/90_DOD_CHECKLIST.md`

Regla dura:

- Si un endpoint no existe en OpenAPI, no se implementa en frontend.

## Router de roles

Usar este enrutamiento para asignar el agente correcto:

- Cambios de contrato, alcance de endpoints, bloqueos backend: `agent-integracion`
- Diseño visual, sistema de estilos, consistencia UI y conversion pages: `agent-design-system`
- Cliente HTTP, auth browser/headless, CSRF, tenant header, traceId: `agent-api-auth`
- Vistas, formularios, guardas RBAC/modulo/plan, UX de errores: `agent-ui-rbac`
- Query keys, cache, invalidaciones, tenant switch/logout: `agent-state-cache`
- Mocks MSW, tests unit/integration, E2E Playwright: `agent-testing`
- Actualizacion de docs y checklist DoD: `agent-docs-gate`
- Descubrir skills utiles para una necesidad nueva: `agent-skill-discovery`
- Instalar skills (curadas o GitHub): `agent-skill-ops`
- Crear o mantener skills internas del equipo: `agent-skill-author`
- Crear/editar presentaciones: `agent-presentations`
- Crear/editar planillas y modelos tabulares: `agent-spreadsheets`

Si una tarea cruza capas, usar esta secuencia:

1. `agent-integracion`
2. `agent-design-system`
3. `agent-api-auth`
4. `agent-ui-rbac`
5. `agent-state-cache`
6. `agent-testing`
7. `agent-docs-gate`

## Roles

### `agent-integracion`

Responsabilidad:

- Traducir requerimientos a alcance real segun contratos vigentes.
- Detectar rapidamente si hay bloqueo backend.

Debe verificar siempre:

- Endpoint existe en OpenAPI.
- Ruta UI, permiso y modulo estan en `20_ACCESS_MATRIX.md`.
- Si falta contrato, registrar en `80_BACKEND_DEPENDENCIES.md`.

Entrega minima:

- Lista de endpoints reales a tocar.
- Lista de permisos y guardas requeridos.
- Riesgos y bloqueos backend explicitos.

### `agent-api-auth`

Responsabilidad:

- Mantener cliente HTTP unico y estandarizado.

Reglas MUST:

- `credentials: include` en browser.
- `X-Tenant-Id` en rutas tenant-scoped.
- `X-CSRF-Token` en mutaciones cookie-auth.
- Normalizar `error.code` + `traceId`.
- Hacer solo un retry por refresh ante 401.

Ownership recomendado:

- `src/lib/api/*`
- `src/lib/http/*`
- `src/store/session*` (si aplica)

Tests minimos:

- Caso exito con headers.
- Caso 401 -> refresh ok -> reintento.
- Caso 401 -> refresh fail -> cierre de sesion.

### `agent-design-system`

Skill base:

- `landing-page-guide-v2`

Responsabilidad:

- Definir y mantener sistema de estilos del proyecto (tokens, tipografia, color, motion, layout).
- Evitar estetica generica y asegurar coherencia visual en pantallas nuevas.
- Guiar implementacion de landing/marketing pages con criterios de conversion y calidad visual.

Reglas MUST:

- Definir variables de diseno en CSS y variantes reutilizables.
- Mantener consistencia entre Tailwind, Shadcn y componentes custom.
- Incluir estados visuales claros de hover/focus/disabled/loading.
- Mantener accesibilidad de contraste y navegacion por teclado.

Ownership recomendado:

- `src/app/globals.css`
- `src/components/ui/**`
- `src/components/**` (layout y primitives)
- `components.json`

Tests minimos:

- Validacion visual basica de estados principales.
- Verificacion de accesibilidad minima (focus visible y contraste).

### `agent-ui-rbac`

Responsabilidad:

- Implementar UI segura por permisos, modulos y plan.

Reglas MUST:

- No usar `error.message` para decisiones, usar `error.code`.
- Estados obligatorios: loading, empty, error, success.
- Estado explicito "sin acceso" para 403/RBAC.
- No persistir tokens en storage.

Ownership recomendado:

- `src/app/**`
- `src/components/**`
- `src/features/**`

Tests minimos:

- Guarda de ruta/accion por permiso.
- Mensaje UX correcto para error de dominio.

### `agent-state-cache`

Responsabilidad:

- Aislar estado por tenant y evitar fuga de datos cross-tenant.

Reglas MUST:

- Query keys tenant-scoped deben incluir `tenantId`.
- En tenant switch, invalidar cache del tenant anterior.
- En logout o refresh fallido, limpiar estado y cache completos.
- No guardar snapshots sensibles en storage.

Ownership recomendado:

- `src/store/**`
- `src/lib/query/**`
- `src/providers/**`

Tests minimos:

- Invalida cache en tenant switch.
- Limpia estado en logout y refresh fallido.

### `agent-testing`

Responsabilidad:

- Sostener calidad funcional y regresion.

Reglas MUST:

- Mocks solo de endpoints existentes en OpenAPI.
- Usar envelope estandar en MSW (success/error + traceId).
- Mantener casos E2E criticos del documento oficial.

Ownership recomendado:

- `src/mocks/**`
- `src/**/*.test.ts(x)`
- `tests/e2e/**`
- `playwright.config.ts`, `vitest.config.ts`

Suite minima por PR:

- Unit/integration del flujo tocado.
- E2E smoke del flujo afectado si es core auth/tenant/modulos.

### `agent-docs-gate`

Responsabilidad:

- Asegurar consistencia documental y cierre DoD.

Reglas MUST:

- Actualizar docs si cambia contrato, flujo o permisos.
- Reflejar nuevos `error.code` en catalogo.
- Mantener backlog de dependencias backend actualizado.

Ownership recomendado:

- `docs/*.md`
- `README.md`

Checklist de cierre:

- `10_IMPLEMENTATION_GUIDE_V2.md` al dia.
- `20_ACCESS_MATRIX.md` al dia.
- `90_DOD_CHECKLIST.md` cumplido para el alcance.

### `agent-skill-discovery`

Skill base:

- `find-skills`

Responsabilidad:

- Buscar skills nuevas cuando aparezca una necesidad no cubierta por el stack actual.
- Proponer opciones instalables con impacto y costo de adopcion.

Salida esperada:

- Lista corta de skills candidatas.
- Motivo de recomendacion y alcance.

### `agent-skill-ops`

Skill base:

- `skill-installer`

Responsabilidad:

- Instalar skills aprobadas de fuente curada o repositorio GitHub.
- Mantener trazabilidad de que se instalo y para que.

Salida esperada:

- Skill instalada.
- Nota operativa: reiniciar Codex para cargar skills nuevas.

### `agent-skill-author`

Skill base:

- `skill-creator`

Responsabilidad:

- Crear o actualizar skills internas del equipo para tareas repetitivas.
- Mantener instrucciones concisas, accionables y con validacion.

Ownership recomendado:

- Carpeta de skills interna definida por el equipo.

### `agent-presentations`

Skill base:

- `slides`

Responsabilidad:

- Crear y editar decks `.pptx` desde requerimientos de negocio o producto.

Uso:

- Solo cuando la tarea pida presentaciones.

### `agent-spreadsheets`

Skill base:

- `spreadsheets`

Responsabilidad:

- Crear y editar workbooks `.xlsx` para modelos, reportes o analisis operativos.

Uso:

- Solo cuando la tarea pida planillas o modelos tabulares.

## Gate de calidad obligatorio

Antes de cerrar una tarea, todos los roles deben dejar:

1. Evidencia de que no se llamaron endpoints fuera de OpenAPI.
2. Evidencia de manejo de `traceId` y `error.code`.
3. Evidencia de pruebas relevantes en verde:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e` (cuando cambie flujo critico)

## Politica de rechazo inmediato

Rechazar cambios si:

- Falta `X-Tenant-Id` en ruta tenant-scoped.
- Falta CSRF en mutaciones cookie-auth.
- Se implementa endpoint no documentado.
- No hay manejo de errores de dominio relevantes.
- No hay evidencia minima de testing.
