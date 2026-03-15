# Tenant Dashboard Interaction Guide

## Objetivo

Definir como el dashboard tenant comunica estados de negocio y soporte sin depender de `error.message`.

## Estados soportados

- `loading`: skeletons en metricas y actividad reciente.
- `success`: banner verde al completar acciones (ej. invitacion enviada).
- `warning`: banner ambar para restricciones o validaciones de negocio.
- `error`: banner rojo para fallos de dominio o infraestructura.

## Validaciones de negocio visibles

- `TENANT_MEMBER_LIMIT_REACHED`: mostrar accion sugerida de upgrade o liberacion de cupos.
- `RBAC_PERMISSION_DENIED`: mostrar estado "sin acceso" y bloquear acciones owner-only.
- `RBAC_PLAN_DENIED` / `RBAC_MODULE_DENIED`: indicar limitacion de plan/modulo en dashboard.

## Alertas operativas

- Inventario: usar `GET /api/v1/modules/inventory/alerts/low-stock` para contador de bajo stock.
- Auditoria critica: usar `GET /api/v1/audit?severity=critical` para contador de eventos criticos.

## Soporte y traceId

- Mostrar siempre ultimo `traceId` disponible en la seccion Soporte/Trace.
- Permitir copiar `traceId` para escalar incidencias a soporte.
- Si existe `supportEmail` o `supportUrl` en settings efectivos, priorizar ese canal.

## Acciones rapidas

- Invitar usuario (`POST /api/v1/tenant/invitations`).
- Cambiar plan (`/app/settings/billing`).
- Ver alertas (`/app/inventory`) y auditoria (`/app/audit`).
