# Expenses - Ola 6 Subcategorias Reales (Frontend) - Cierre 2026-03-22

## Objetivo

Cerrar el espejo frontend de subcategorias reales en Expenses, conectando settings y request runtime al contrato backend de subcategorias.

## Alcance ejecutado

1. Se habilito selector jerarquico categoria -> subcategoria en formulario de solicitudes.
2. Se aplico regla estricta: si la categoria tiene subcategorias activas, la subcategoria es obligatoria.
3. Se persiste taxonomia en `metadata.taxonomy` para trazabilidad (`categoryId`, `subcategoryId`, `subcategoryKey`).
4. Se mantuvo gobernanza visual en settings para crear y visualizar subcategorias reales.
5. Se actualizo cobertura e2e focal del flujo de creacion/envio de solicitud con subcategoria.

## Cambios implementados

- `src/modules/expenses/components/requests/ExpenseRequestForm.tsx`
  - Query de subcategorias por categoria seleccionada.
  - Select de subcategoria con estado de carga/error.
  - Validacion runtime de obligatoriedad por catalogo.
  - Persistencia de taxonomia en metadata del request.
- `src/modules/expenses/pages/ExpenseRequestDetailPage.tsx`
  - Lectura de `metadata.taxonomy.subcategoryId` para prellenar modo edicion.
- `tests/e2e/expenses-request-create-submit.spec.ts`
  - Se agrego mock de `/subcategories`.
  - Se agrega seleccion de subcategoria en el formulario.
  - Se valida payload `metadata.taxonomy`.
- `tests/e2e/expenses-catalog-governance.spec.ts`
  - Cobertura vigente de gobernanza y alta de subcategoria real.

## Evidencia de validacion

- `npm run lint` -> passing (sin errores; warning menor de hooks no bloqueante)
- `npm run build` -> passing
- `npx playwright test tests/e2e/expenses-catalog-governance.spec.ts` -> passing
- `npx playwright test tests/e2e/expenses-request-create-submit.spec.ts` -> passing

## DoD Ola 6 (alcance frontend de esta ola)

- [x] UI de subcategorias en settings disponible.
- [x] Selector jerarquico en request form operativo.
- [x] Request persiste taxonomia de subcategoria seleccionada.
- [x] Pruebas e2e focales en verde para settings y request.
- [x] Cierre espejo documentado en `docs/operaciones/`.

## Pendientes explicitos para siguiente ola

1. Definir contrato backend final para exponer subcategoria de forma nativa en `ExpenseRequest` (sin depender de metadata).
2. Ajustar reportes para segmentacion directa por subcategoria en endpoints agregados.
3. Homologar `src/lib/api/expenses.*` para incluir tipos/funciones de subcategorias y eliminar deuda de formato legado.
