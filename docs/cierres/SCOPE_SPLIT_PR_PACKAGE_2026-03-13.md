# PR Package - Scope Split Tenant/Platform

Fecha: 2026-03-13
Estado: Listo para PR

## 1. Objetivo

Evitar mezcla de contexto tenant/platform en frontend mediante separacion explicita de cliente API por scope.

## 2. Cambios principales

- `src/lib/api/client.ts`
  - agrega `scope` (`auto | tenant | platform`)
  - agrega wrappers `tenantApiRequest` y `platformApiRequest`
  - bloquea mezclas invalidas con `TENANT_SCOPE_MISMATCH`
- `src/lib/api/client.test.ts`
  - tests nuevos para bloqueos de mezcla de scope
- servicios migrados por scope:
  - platform: `src/features/platform-settings/platform-settings.service.ts`
  - tenant: `src/features/tenant/tenant-settings.service.ts`, `src/features/audit/audit.service.ts`, `src/features/billing/billing.service.ts`, `src/features/inventory/inventory.service.ts`, `src/features/crm/crm.service.ts`, `src/features/hr/hr.service.ts`

## 3. Evidencia de validacion

- `npm run lint` -> OK
- `npm run typecheck` -> OK
- `npm run test` -> OK
- `npm run test:e2e -- tests/e2e/tenant-settings.spec.ts` -> OK (2/2)
- `npm run test:e2e -- tests/e2e/tenant.spec.ts` -> OK (3/3)
- `npm run docs:coupling:check` -> OK (sin drift)

## 4. QA live API

Backend local `http://localhost:4100`:

- tenant route con token tenant + `X-Tenant-Id` -> 200
- platform route con token tenant-scoped -> 400 `TENANT_SCOPE_MISMATCH`
- platform route con token base (no tenant-scoped) -> 200

## 5. Riesgo residual

- Cambiar semantica backend `TENANT_SCOPE_MISMATCH` de 400 a 403 queda como decision futura.

## 6. Criterios de aceptacion

- No hay llamadas platform con `tenantApiRequest`.
- No hay llamadas tenant con `platformApiRequest`.
- Tests de scope en verde.
- Sin drift documental FE/API.
