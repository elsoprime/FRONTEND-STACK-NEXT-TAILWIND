# Billing Local Demo Runbook

Fecha: 2026-03-15  
Estado: Activo

## Objetivo

Cerrar el flujo practico `checkout -> pago simulado -> activacion` sin llamadas UI directas a webhook.

## Contrato operativo

- `POST /api/v1/billing/checkout/session` crea estado intermedio (`pending`).
- `PATCH /api/v1/tenant/subscription` requiere evidencia de pago (`paid` o `activated`).
- `POST /api/v1/billing/webhooks/provider` es `system-to-system` (backend/provider).

## Prerequisitos

- Backend disponible en `http://localhost:4000`.
- Variables backend configuradas: `APP_URL`, `BILLING_WEBHOOK_SECRET`.
- Usuario owner de tenant con sesion valida.

## Secuencia de ejecucion

1. En UI abrir `/app/settings/billing`.
2. Seleccionar plan e iniciar checkout.
3. Capturar `checkoutSessionId`.
4. En backend ejecutar:

```bash
npm run billing:webhook:simulate -- --tenant-id=<tenantId> --checkout-session-id=<checkoutSessionId> --plan-id=<planId> --provider=simulated --type=billing.checkout.paid
```

5. Volver a UI y ejecutar `Verificar activacion`.
6. Confirmar runtime activo en `/app/settings/tenant/effective`.

## Validaciones de cierre

- Antes del webhook: puede aparecer `TENANT_SUBSCRIPTION_PAYMENT_REQUIRED`.
- Despues del webhook paid: runtime y modulos del plan activos.
- Sin loops de requests en vistas runtime.

## Evidencia minima

- `traceId` del 403 pre-activacion (si ocurre).
- `traceId` de confirmacion post-activacion.
- Captura de `/app/settings/billing` y `/app/settings/tenant/effective`.