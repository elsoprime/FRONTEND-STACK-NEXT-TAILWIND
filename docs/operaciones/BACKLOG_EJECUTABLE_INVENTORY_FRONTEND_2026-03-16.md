# BACKLOG_EJECUTABLE_INVENTORY_FRONTEND_2026-03-16

## 1) Contexto y alcance

Objetivo: evolucionar el piloto de Inventory en `FRONTEND-STACK-NEXT-TAILWIND` a un modulo escalable, con UX consistente, subnavegacion por modulo, dashboard operativo y guardas de acceso por runtime/plan/permisos.

Fuentes de verdad:
- `openapi/openapi.yaml` y `openapi/paths/modules/inventory-*`
- `docs/15_INVENTORY_MODULO_IMPLEMENTATION_GUIDE_V2.md`
- `docs/20_ACCESS_MATRIX.md`
- `docs/40_STATE_AND_CACHE_POLICY.md`
- `docs/50_ERROR_CATALOG.md`
- `docs/90_DOD_CHECKLIST.md`

Skills aplicadas para este backlog:
- `frontend-design` (direccion visual y UX de modulo)
- `web-design-guidelines` (criterios de interfaz/accesibilidad para QA visual)
- `typescript-advanced-types` (tipado estricto y contratos)

## 2) Resultado esperado (Definition of Success)

- Sidebar con categoria `Modulos` y subnavegacion de Inventory.
- Ruta `Panel principal` dentro de Inventory con metricas/estado/ayuda operacional.
- Vistas inventory consistentes en layout, estados UX y paneles de ayuda.
- Guardas por modulo/plan/permisos en navegacion, rutas y acciones.
- Query/cache tenant-scoped, invalidaciones correctas en mutaciones.
- Pruebas unit/integration + e2e smoke de flujo inventory.
- Documentacion sincronizada y DoD en verde.

## 3) Backlog por epicas (ejecutable)

### EPIC A - IA-INV-NAV-001: Navegacion modular Inventory

Historia A1: Reorganizar sidebar bajo categoria `Modulos`.
- Prioridad: P0
- Estimacion: 5 pts
- Dependencias: runtime efectivo disponible
- Archivos objetivo:
  - `src/components/tenant/tenant-sidebar.tsx`
  - `src/components/tenant/dashboard-header.tsx` (si hay accesos rapidos cruzados)
- Tareas:
  1. Crear grupo visual `Modulos`.
  2. Mover Inventory al grupo con etiqueta clara.
  3. Incluir subitems inventory (dashboard/items/categories/stock/alerts).
  4. Aplicar gating por `tenant:modules:inventory:use` + runtime modulo activo.
- Criterios de aceptacion:
  - Inventory solo se ve cuando corresponde por modulo/permiso.
  - Subitems muestran estado activo correcto por ruta.
  - Mobile y desktop mantienen consistencia.
- Pruebas:
  - unit: visibilidad por permiso/modulo.
  - integration: navegacion y estado activo.

Historia A2: Definir arquitectura de rutas Inventory.
- Prioridad: P0
- Estimacion: 3 pts
- Archivos objetivo:
  - `src/app/app/inventory/page.tsx`
  - `src/app/app/inventory/*/page.tsx`
- Tareas:
  1. Confirmar rutas existentes vs guia inventory v2.
  2. Normalizar naming y enlaces desde sidebar.
- Criterios de aceptacion:
  - No hay rutas huerfanas desde menu.
  - Cada subitem apunta a una vista util y guardada.

### EPIC B - IA-INV-DASH-002: Panel principal de Inventory

Historia B1: Implementar dashboard inventory operativo.
- Prioridad: P0
- Estimacion: 8 pts
- Endpoints:
  - `GET /api/v1/modules/inventory/alerts/low-stock`
  - `GET /api/v1/modules/inventory/stock-movements`
  - `GET /api/v1/modules/inventory/items`
- Archivos objetivo:
  - `src/app/app/inventory/page.tsx`
  - `src/features/inventory/inventory.service.ts`
  - `src/lib/query/query-keys.ts`
- Tareas:
  1. Diseñar layout dashboard modular (cards + tabla corta + quick actions).
  2. Construir metricas de negocio y estados empty/error/loading.
  3. Incluir bloque ayuda operacional (primeros pasos + recomendaciones).
- Criterios de aceptacion:
  - Dashboard muestra metricas esenciales y acciones claras.
  - Respeta contrato OpenAPI y errores por `error.code`.
  - UX consistente con tenant dashboard.
- Pruebas:
  - integration: estados de carga/empty/error.
  - e2e smoke: ingreso a inventory dashboard y lectura de metricas.

Historia B2: Paneles de ayuda UX orientados a operacion.
- Prioridad: P1
- Estimacion: 3 pts
- Tareas:
  1. Crear componente reusable de ayuda contextual.
  2. Agregarlo en dashboard y formularios criticos.
- Criterios de aceptacion:
  - Ayuda no bloquea flujo, reduce friccion y esta visible en desktop/mobile.

### EPIC C - IA-INV-DATA-003: Vistas funcionales inventory y rendimiento

Historia C1: Mejorar listados y tablas (items/categories/stock/alerts).
- Prioridad: P0
- Estimacion: 8 pts
- Tareas:
  1. Unificar patrones de tabla (filtros, paginacion, densidad).
  2. Implementar badges de estado/severidad donde aplique.
  3. Normalizar formato de fechas legibles.
- Criterios de aceptacion:
  - Todas las tablas usan mismo patron UX.
  - Paginacion backend-driven activa donde soporte endpoint.

Historia C2: Mutaciones robustas de stock/categoria/item.
- Prioridad: P0
- Estimacion: 5 pts
- Tareas:
  1. Manejar errores dominio (`INV_*`) por codigo.
  2. Invalidaciones de cache por entidad afectada.
  3. Mensajeria de exito/error con `traceId` accesible.
- Criterios de aceptacion:
  - No hay decisiones por `error.message`.
  - Refetch consistente post-mutation.

### EPIC D - IA-INV-TS-004: Tipado estricto y contratos

Historia D1: Endurecer tipos inventory con TS avanzado.
- Prioridad: P0
- Estimacion: 5 pts
- Tareas:
  1. Revisar esquemas Zod y tipos inferidos.
  2. Crear tipos utilitarios para filtros/query params (mapped/conditional types).
  3. Evitar `any`/casts inseguros en modulo.
- Criterios de aceptacion:
  - `npm run typecheck` limpio sin supresiones nuevas.
  - Tipos de servicios y UI sincronizados con OpenAPI.

### EPIC E - IA-INV-QA-005: Calidad, pruebas y docs

Historia E1: Test suite inventory.
- Prioridad: P0
- Estimacion: 5 pts
- Tareas:
  1. Unit/integration para guardas y estados UI.
  2. E2E smoke: acceso modulo + flujo basico stock.
- Criterios de aceptacion:
  - `lint`, `typecheck`, `test`, `build` en verde.

Historia E2: Cierre documental.
- Prioridad: P0
- Estimacion: 3 pts
- Archivos docs:
  - `docs/15_INVENTORY_MODULO_IMPLEMENTATION_GUIDE_V2.md`
  - `docs/20_ACCESS_MATRIX.md`
  - `docs/85_IMPLEMENTATION_STATUS.md`
  - `docs/90_DOD_CHECKLIST.md`
- Criterios de aceptacion:
  - Cambios de rutas/guardas/endpoints reflejados.
  - DoD del modulo inventory marcado y verificable.

## 4) Plan de sprints sugerido

Sprint 1 (P0 core): EPIC A + B1 + D1 base
- Salida: sidebar modular + inventory dashboard operativo + tipos base.

Sprint 2 (P0 funcional): EPIC C + B2
- Salida: tablas/listados consistentes + ayudas UX + mutaciones robustas.

Sprint 3 (P0 cierre): EPIC E + hardening
- Salida: pruebas completas, docs actualizadas, checklist DoD cerrado.

## 5) Backlog tecnico por archivos (ownership sugerido)

- Navegacion/UX shell:
  - `src/components/tenant/tenant-sidebar.tsx`
  - `src/components/tenant/dashboard-shell.tsx`
- Paginas inventory:
  - `src/app/app/inventory/page.tsx`
  - `src/app/app/inventory/items/page.tsx`
  - `src/app/app/inventory/categories/page.tsx`
  - `src/app/app/inventory/stock/page.tsx`
  - `src/app/app/inventory/alerts/page.tsx`
- Capa de datos:
  - `src/features/inventory/inventory.service.ts`
  - `src/features/inventory/inventory.schemas.ts`
  - `src/lib/query/query-keys.ts`
  - `src/lib/query/tenant-cache.ts`
- QA:
  - `src/features/inventory/*.test.ts`
  - `tests/e2e/*inventory*`

## 6) Riesgos y mitigaciones

- Riesgo: desalineacion endpoint-ruta UI.
  - Mitigacion: validar contra OpenAPI antes de codificar cada historia.
- Riesgo: fuga de cache cross-tenant.
  - Mitigacion: keys tenant-scoped + invalidaciones en tenant switch.
- Riesgo: UI inconsistente entre subpaginas.
  - Mitigacion: primitives compartidos + checklist `web-design-guidelines` en PR review.

## 7) Checklist de entrada por historia (Ready)

- Endpoint existe en OpenAPI.
- Ruta y permiso estan en Access Matrix.
- Criterios de aceptacion y pruebas definidos.
- Impacto en cache identificado.

## 8) Checklist de salida por historia (Done)

- Guardas de acceso implementadas.
- Estados UX completos (loading/empty/error/success).
- Errores por `error.code`.
- `lint`, `typecheck`, `test`, `build` en verde.
- Docs actualizadas si hubo cambio de flujo/ruta/permiso.

## 9) Propuesta de inicio inmediato (orden de ejecucion)

1. IA-INV-NAV-001.A1
2. IA-INV-NAV-001.A2
3. IA-INV-DASH-002.B1
4. IA-INV-TS-004.D1
5. IA-INV-DATA-003.C1
6. IA-INV-DATA-003.C2
7. IA-INV-DASH-002.B2
8. IA-INV-QA-005.E1
9. IA-INV-QA-005.E2
