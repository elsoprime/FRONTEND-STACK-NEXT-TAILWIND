# Expenses Ola 4 - Catalogo y Gobernanza (Cierre)

Fecha de cierre: 2026-03-22  
Branch: `flow-b-expenses-catalog-governance`

## Alcance implementado

- Se incorporo capa de gobernanza sobre el catalogo de categorias en `Settings`.
- Se agrego flujo de `Alta masiva guiada` sin archivo CSV (lineas estructuradas).
- Se mantuvo compatibilidad con el contrato actual de backend (sin endpoints nuevos).
- Se documenta y expone convencion de subcategorias por key:
  - `parent_subcategory` (ej: `travel_local`).
- Se deja explicitado en UI que subcategorias nativas quedan en estado `contrato pendiente API`.

## Evidencia tecnica

Archivos principales:
- `src/modules/expenses/components/settings/ExpenseCategoryCatalogManager.tsx`
- `src/modules/expenses/components/settings/ExpenseCategoryBulkCreateDialog.tsx`
- `src/lib/api/expenses.client.ts`
- `src/lib/api/expenses.types.ts`
- `src/lib/query/query-keys.ts`
- `src/modules/expenses/pages/ExpensesWorkspace.tsx`
- `tests/e2e/expenses-catalog-governance.spec.ts`

Validaciones ejecutadas:
- `npm run lint` - OK
- `npm run build` - OK
- `npx playwright test tests/e2e/expenses-catalog-governance.spec.ts` - OK

## DoD Ola 4

- [x] Gobernanza visible en tab `settings`.
- [x] Alta masiva guiada funcional con validacion por linea.
- [x] Prevencion de duplicados por key contra catalogo existente.
- [x] Feedback operacional de ejecucion masiva.
- [x] Contrato de subcategorias explicitado sin romper API vigente.
- [x] Lint/build/e2e focal en verde.

## Riesgos residuales

- La convencion de subcategoria es de gobernanza (`key`) y no una entidad backend independiente.
- Para subcategorias nativas (CRUD dedicado) se requiere nueva ola con contrato OpenAPI y migracion.