# Inventory Live Integration Guide

Estado: Activo
Ultima actualizacion: 2026-03-17

## 1. Objetivo

Definir como ejecutar la integracion end-to-end del modulo Inventory contra backend real, con evidencia trazable y criterio DoD por bloque.

## 2. Prerrequisitos

- Backend `API-REST-STACK-NODE` desplegado y accesible.
- Frontend en ejecucion local o entorno de QA.
- Tenant con modulo `inventory` habilitado.
- Credenciales con permisos de uso del modulo.
- Variables:

```bash
API_BASE_URL=https://api.tu-entorno.com
NEXT_PUBLIC_API_BASE_URL=https://api.tu-entorno.com
QA_TENANT_ID=<tenant-id>
QA_BEARER_TOKEN=<token-con-permisos>
```

## 3. Smoke live ejecutable

Comando:

```bash
npm run qa:inventory:live
```

El smoke valida:

- `GET /health`
- `GET /api/v1/modules/inventory/categories`
- `GET /api/v1/modules/inventory/items`
- `GET /api/v1/modules/inventory/warehouses`
- `GET /api/v1/modules/inventory/lots`
- `GET /api/v1/modules/inventory/stock-movements`
- `GET /api/v1/modules/inventory/stocktakes`
- `GET /api/v1/modules/inventory/alerts/low-stock`
- `GET /api/v1/modules/inventory/alerts/expiring-lots`
- `GET /api/v1/modules/inventory/reconciliation`
- `GET /api/v1/modules/inventory/settings`

Por defecto es read-only.

## 4. Probe opcional de mutacion

Si necesitas validar escritura real en ambiente controlado:

```bash
QA_INVENTORY_MUTATION_MODE=true npm run qa:inventory:live
```

Esto ejecuta una creacion de item de prueba (`items.createProbe`).

## 5. DoD del bloque live

- `qa:inventory:live` exitoso (sin errores de contrato).
- `traceId` registrado por cada endpoint validado.
- Header tenant aplicado en todos los endpoints tenant-scoped.
- Evidencia guardada en runbook operativo del release.

## 6. Criterio de pausa/reanudacion

Para retomar exactamente desde esta etapa usar:

`CONTINUAR_ETAPA_9_INVENTARIO_E2E`

Orden sugerido al reanudar:

1. Ejecutar smoke live read-only.
2. Ejecutar e2e UI de modulo (`tests/e2e/modules.spec.ts`).
3. (Opcional) mutation probe controlado.
4. Registrar resultado en `docs/85_IMPLEMENTATION_STATUS.md`.
