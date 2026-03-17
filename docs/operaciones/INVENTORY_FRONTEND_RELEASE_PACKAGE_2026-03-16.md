# INVENTORY_FRONTEND_RELEASE_PACKAGE_2026-03-16

## 1) Scope del release

Este paquete cierra la evolucion del modulo Inventory en frontend desde piloto a version operativa consistente.

Incluye:
- Navegacion modular Inventory en sidebar + subitems.
- Panel principal (dashboard) de Inventory.
- Vistas `categorias`, `items`, `stock`, `alertas` con layout unificado.
- Filtros y paginacion backend-driven en vistas principales.
- Componentes reutilizables de modulo (`InventoryModuleNav`, `InventoryHelpPanel`, `InventoryPaginationControls`).
- Cobertura QA: unit/integration + smoke e2e de modulo.

## 2) Changelog tecnico

### UI/UX
- Se normalizo la distribucion visual de paginas inventory con patron `main + aside`.
- Se agrego ayuda contextual operativa por vista.
- Se incorporo navegacion de modulo persistente en todas las paginas inventory.

### Datos y comportamiento
- Filtro por busqueda en categorias.
- Filtros por busqueda/categoria/low-stock en items.
- Filtro por item en movimientos de stock.
- Estados vacios contextuales (sin datos vs sin resultados por filtro).

### QA
- Nuevos tests unitarios de componentes inventory.
- Nuevo smoke e2e en `tests/e2e/modules.spec.ts` para `/app/inventory/stock`.
- Validacion DoD tecnica en verde.

## 3) Evidencia DoD

- `npm run lint` -> OK
- `npm run typecheck` -> OK
- `npm run test` -> OK (99)
- `npm run build` -> OK
- `npx playwright test tests/e2e/modules.spec.ts` -> OK (4/4)

## 4) Go-live checklist (Frontend)

- [ ] Backend desplegado con endpoints inventory activos en entorno objetivo.
- [ ] Runtime efectivo del tenant con modulo `inventory` habilitado.
- [ ] Permiso `tenant:modules:inventory:use` presente en roles esperados.
- [ ] Verificada visibilidad/ocultamiento de menu inventory por tenant/plan.
- [ ] Smoke funcional en ambiente: crear categoria -> crear item -> registrar movimiento -> revisar alerta.
- [ ] Validado `traceId` visible para soporte en casos de error.
- [ ] Validacion responsive (desktop + mobile) de vistas inventory.

## 5) Orden sugerido de activacion por ambiente

1. Dev interno
- Activar modulo inventory para tenants de QA.
- Ejecutar smoke e2e de modulos + QA manual de formularios.

2. Staging
- Activar inventory solo para tenants de validacion.
- Verificar logs/errores de dominio (`INV_*`) y tiempos de respuesta.

3. Produccion controlada
- Activar inventory por lotes de tenant (canary).
- Monitorear errores `INV_STOCK_CONFLICT` y soporte con `traceId`.
- Expandir activacion al resto de tenants una vez estable.

## 6) Riesgos residuales

- Esta version no incluye aun capacidades avanzadas (`warehouses`, `lots`, `stocktakes`, `reconciliation`).
- El roadmap de esas capacidades debe coordinarse con releases backend y diseno UX final.

## 7) Continuidad E2E real (actualizacion 2026-03-17)

Adiciones para continuar integracion contra backend real:

- Script live smoke inventory:
  - `npm run qa:inventory:live`
  - archivo: `scripts/live-inventory-smoke.mjs`
- Guia frontend live:
  - `docs/frontend/inventory-live-integration-guide.md`

Variables requeridas:

- `API_BASE_URL` o `NEXT_PUBLIC_API_BASE_URL`
- `QA_TENANT_ID`
- `QA_BEARER_TOKEN`

Keyword para reanudar etapa:

- `CONTINUAR_ETAPA_9_INVENTARIO_E2E`

## 8) Estado operativo actual (actualizacion 2026-03-17)

- Estado oficial para esta ola: **Cerrado en desarrollo / Ready for Integration Validation**.
- Go-live real (staging canary + produccion) queda **pospuesto** hasta nueva ventana operativa.
- Esta decision no invalida el cierre tecnico frontend; solo posterga la activacion operativa por ambiente.
- Prerrequisito para pasar a go-live: ejecutar `npm run qa:inventory:live` con credenciales reales y completar la evidencia de checklist por entorno.
