# Reapertura Tecnica Frontend - Integracion REPO

Fecha: 2026-03-13  
Estado: Gate ejecutado OK (re-cierre formal completado)

## 1. Motivo

Formalizar cierre de frontend con evidencia de gate completo.

## 2. Gate ejecutado

- `npm run lint` -> OK
- `npm run typecheck` -> OK
- `npm run test` -> OK
- `npm run build` -> OK
- `npm run test:e2e` -> OK (20/20)
- `npm run openapi:sync` -> OK (OpenAPI sincronizado desde backend)
- `npm run docs:coupling:check` -> OK (OpenAPI FE/API sin drift)

## 3. Observaciones

- Warnings no bloqueantes en Playwright (allowedDevOrigins y proxy a backend local sin levantar). No afecta el gate.

## 4. Pendientes

- Ninguno para el re-cierre formal.

## 5. Resultado

Re-cierre formal completado con gate en verde y OpenAPI acoplado.

## 6. Addendum Scope Split FE/API (2026-03-13)

Hallazgo:

- /api/v1/platform/settings devuelve TENANT_SCOPE_MISMATCH cuando se consume con contexto tenant-scoped.

Accion aplicada:

- se implemento separacion por scope en cliente API (	enantApiRequest y platformApiRequest).
- se migraron servicios tenant/platform al cliente correspondiente.
- se agregaron tests de bloqueo por mezcla de scope.

Evidencia:

- 
pm run lint -> OK
- 
pm run typecheck -> OK
- 
pm run test -> OK
- smoke en vivo documentado en docs/cierres/ETAPA_FE_SCOPE_SPLIT_QA_2026-03-13.md.

