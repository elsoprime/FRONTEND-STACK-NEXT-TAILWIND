# Expenses - Cierre Ola 5 Frontend

Fecha de corte: 2026-03-21  
Repositorio: FRONTEND-STACK-NEXT-TAILWIND

## Alcance cerrado

- Contrato OpenAPI de `expenses` sincronizado desde backend a frontend.
- Cliente API tipado (`expenses.client.ts`, `expenses.types.ts`, `expenses.mappers.ts`).
- Guardas/rutas/layout de `expenses` operativos.
- Workspace de solicitudes: queue + detalle + workflow.
- Adjuntos: `presign -> upload -> register` en UI.
- Bulk actions: approve/reject/mark-paid/export con feedback por item.
- Rutas App Router:
  - `/app/expenses`
  - `/app/expenses/[requestId]`
  - redirect `/app/modules/expenses` -> `/app/expenses`

## Evidencia de validacion

Validaciones tecnicas:

- `npm run typecheck` -> OK
- `npx eslint ...` (scope `expenses`) -> OK

E2E ejecutados:

- `npm run test:e2e -- tests/e2e/expenses-critical-flow.spec.ts` -> 1/1 PASS
- `npm run test:e2e -- tests/e2e/expenses-bulk.spec.ts` -> 1/1 PASS

Nota de corrida:

- La corrida conjunta de ambos specs tuvo un fallo transitorio de conexion (`ERR_CONNECTION_FAILED`); cada suite por separado pasó correctamente en la misma sesion.

## DoD Ola 5 Frontend

Estado: Cumplido con observacion

- [x] Frontend consume endpoints `expenses` publicados en OpenAPI.
- [x] Guardas de modulo/permiso activas para acceso a `expenses`.
- [x] Flujo de workflow operativo desde detalle.
- [x] Adjuntos y bulk actions disponibles en UI.
- [x] E2E criticos del alcance implementados y en verde.
- [ ] E2E de creacion de solicitud (`create request`) pendiente de UI dedicada.

## Riesgos y pendientes

- Si se requiere criterio estricto de cierre original, falta incorporar flujo UI explicito para `create request` y su E2E asociado.
- Conviene consolidar un comando E2E de `expenses` en package scripts para ejecucion estable en CI.
