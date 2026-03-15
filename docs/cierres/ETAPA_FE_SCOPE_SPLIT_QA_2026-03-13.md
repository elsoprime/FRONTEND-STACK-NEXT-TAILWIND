# QA Report - Scope Split Tenant/Platform

Fecha: 2026-03-13
Estado: Cerrado

## 1. Alcance

Validar implementacion de separacion por scope en cliente API frontend:

- `tenantApiRequest` para rutas tenant-scoped
- `platformApiRequest` para rutas platform-scoped
- bloqueo explicito de mezclas de contexto

## 2. Evidencia de codigo

- `src/lib/api/client.ts`
- `src/lib/api/client.test.ts`
- `src/features/platform-settings/platform-settings.service.ts`
- `src/features/tenant/tenant-settings.service.ts`
- `src/features/audit/audit.service.ts`
- `src/features/billing/billing.service.ts`
- `src/features/inventory/inventory.service.ts`
- `src/features/crm/crm.service.ts`
- `src/features/hr/hr.service.ts`

## 3. Validacion automatizada

- `npm run lint` -> OK
- `npm run typecheck` -> OK
- `npm run test` -> OK (14 files, 91 tests)`r`n- `npm run test:e2e -- tests/e2e/tenant-settings.spec.ts` -> OK (2/2)`r`n- `npm run test:e2e -- tests/e2e/tenant.spec.ts` -> OK (3/3)

## 4. Smoke de integracion en vivo (backend local puerto 4100)

Checks ejecutados:

- tenant settings con token tenant + `X-Tenant-Id` -> 200
- platform settings con token tenant-scoped -> 400 `TENANT_SCOPE_MISMATCH`
- platform settings con token base (no tenant-scoped) -> 200

Respuesta capturada para caso negativo:

```json
{
  "success": false,
  "error": {
    "code": "TENANT_SCOPE_MISMATCH",
    "message": "Platform settings do not accept tenant-scoped context."
  }
}
```

## 5. Resultado

Implementacion y validacion completadas. El comportamiento coincide con el contrato de scopes definido en documentacion canon.


## 6. PR Checklist (Scope Split)

- [x] platform-settings.service usa platformApiRequest.
- [x] Servicios tenant (settings/audit/billing/inventory/crm/hr) usan 	enantApiRequest.
- [x] Cliente API bloquea mezcla de scope y tenantId indebido.
- [x] Unit tests de scope en src/lib/api/client.test.ts.
- [x] Lint, typecheck, test unit/integration y e2e focalizado en verde.
- [x] Coupling check FE/API sin drift (
pm run docs:coupling:check).



## 7. Smoke integrado en entorno directo (:4000)

Con backend levantado en http://localhost:4000 y PLATFORM_ADMIN_EMAILS=soporte.info@dev.cl:

- GET /api/v1/tenant/settings (token tenant + X-Tenant-Id) -> 200
- GET /api/v1/tenant/settings/effective -> 200
- GET /api/v1/audit -> 200
- GET /api/v1/platform/settings con token base -> 200
- GET /api/v1/platform/settings con token tenant-scoped -> 400 TENANT_SCOPE_MISMATCH`r

Resultado: el comportamiento runtime coincide con el split por scope implementado en FE.


## 8. Extension UX - Checkout guiado (2026-03-13)

Objetivo: reducir friccion operativa y cerrar activacion de suscripcion desde UI sin llamadas prohibidas a webhook.

Cambios aplicados:

- Seccion de flujo guiado en `src/components/tenant/tenant-billing-provisioning-panel.tsx` con 3 pasos visibles:
  - seleccionar plan
  - iniciar checkout
  - confirmar activacion
- Boton dedicado `Verificar activacion` para refetch de `tenant/mine` + runtime efectivo.
- Boton de activacion bloqueado hasta que exista `checkoutSessionId` del plan seleccionado.
- Banner de cierre automatico cuando el runtime refleja el plan activo despues del checkout.
- Mensajeria ajustada para diferenciar estado intermedio (`checkout`) vs estado final (`activated`).

Validacion ejecutada:

- `npm run lint` -> OK
- `npm run typecheck` -> OK
- `npm run test -- src/features/billing/billing.service.test.ts` -> OK (4/4)

Resultado: UX de provisioning queda alineada con contrato backend (sin invocar `/billing/webhooks/provider` desde FE) y con cierre de estado verificable en dashboard.

## 9. Fix ciclo completo suscripcion (2026-03-13)

Objetivo: corregir el ciclo `activar -> cancelar -> reactivar` y bloquear UX post-cancelacion.

Cambios funcionales:

- `tenant-billing-provisioning-panel.tsx`
  - limpieza de `latestCheckoutSession` al cancelar suscripcion.
  - limpieza de checkout si el usuario cambia de plan.
  - verificacion de activacion basada en runtime efectivo (`tenant/settings/effective`) para evitar falsos negativos por `tenant/mine` stale.
- `dashboard-primitives.tsx`
  - acciones de `DashboardModuleCard` deshabilitadas cuando `state !== active`.
- `tenant-dashboard-marketplace.tsx`
  - quick actions de inventario/auditoria deshabilitadas cuando no hay acceso por runtime/suscripcion.
  - `TENANT_SUBSCRIPTION_PAYMENT_REQUIRED` tratado como estado de bloqueo de acceso en dashboard.
- `tenant-sidebar.tsx`
  - `audit` deja de mostrarse como siempre activo; ahora depende de plan activo.

Pruebas ejecutadas:

- `npm run lint` -> OK
- `npm run typecheck` -> OK
- `npm run test:e2e -- tests/e2e/billing-cycle.spec.ts` -> OK (2/2)

Resultado:

- Reactivacion exige checkout nuevo tras cancelacion.
- UI bloquea accesos funcionales cuando la suscripcion queda inactiva.
- Ciclo completo validado en E2E.
