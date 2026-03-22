# EXPENSES OLA 1 - Catalogo en Solicitud + CLP Default (Frontend)

Fecha: 2026-03-22
Rama: `flow-c-expenses-request-form-ux`

## Objetivo

Reducir errores operativos en creacion de solicitudes de gasto al reemplazar categoria manual por seleccion desde catalogo activo, y estandarizar la moneda inicial a `CLP`.

## Alcance aplicado

- Formulario de solicitud:
  - `categoryKey` ahora se selecciona desde catalogo activo (`listCategories`) en un `select`.
  - Se mantiene compatibilidad en edicion para categorias historicas no activas.
  - Moneda por defecto cambiada de `USD` a `CLP`.
- Prueba E2E critica de creacion/envio actualizada al nuevo comportamiento.

## Archivos modificados

- `src/modules/expenses/components/requests/ExpenseRequestForm.tsx`
- `tests/e2e/expenses-request-create-submit.spec.ts`
- `docs/operaciones/README.md`

## Evidencia de validacion

- `npm run lint` ✅
- `npm run build` ✅
- `npx playwright test tests/e2e/expenses-request-create-submit.spec.ts` ✅ (1 passed)

## DoD - Ola 1

- [x] La categoria en solicitud no se ingresa manualmente; se selecciona de catalogo.
- [x] Se muestran solo categorias activas para creacion.
- [x] El formulario mantiene compatibilidad de lectura/edicion para categoria historica.
- [x] Moneda por defecto en formulario: `CLP`.
- [x] Flujo E2E de creacion y envio ajustado al nuevo contrato visual/funcional.
- [x] `lint` y `build` en verde.

## Fuera de alcance (siguiente ola)

- Alta masiva de categorias (CSV/import).
- Subcategorias.
- Dashboard principal de metricas y graficas.
