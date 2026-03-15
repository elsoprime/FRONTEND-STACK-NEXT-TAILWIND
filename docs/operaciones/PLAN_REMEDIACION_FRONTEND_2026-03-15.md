# Plan de Remediacion Frontend - 2026-03-15

## Objetivo
Reducir deuda documental y operativa sin alterar contratos funcionales del dashboard tenant.

## Fase 1 - Higiene documental (riesgo bajo)

### Acciones
1. Corregir referencias internas `docs/frontend/*` a `docs/*` en:
- `docs/README.md`
- `docs/95_DOCS_DEPRECATION_MATRIX.md`
- `docs/_deprecated/README.md`
- `docs/_deprecated/90_INTEGRATION_PLAN_V1.md`
2. Corregir typo DoD en `docs/90_DOD_CHECKLIST.md`.
3. Crear `.env.example` con variables minimas y notas de uso.
4. Ampliar `README.md` con:
- instalacion
- configuracion `.env`
- ejecucion local
- build/start para smoke de despliegue

### Criterios de salida
- Cero referencias internas rotas hacia `docs/frontend/*`.
- Onboarding local reproducible con README + `.env.example`.

## Fase 2 - QA baseline duro (riesgo medio)

### Acciones
1. Instalar `@vitest/coverage-v8`.
2. Agregar script `test:coverage` en `package.json`.
3. Definir coverage en `vitest.config.ts` con umbrales iniciales realistas.
4. Ejecutar:
- `npm run test:coverage`

### Criterios de salida
- Cobertura medible y versionada en CI local.
- Umbrales minimos validados.

## Fase 3 - Estabilidad entorno dev/e2e (riesgo medio)

### Acciones
1. Configurar `allowedDevOrigins` en `next.config.ts` para entorno Playwright/dev.
2. Revisar estrategia de proxy/mock para disminuir `ECONNREFUSED` durante e2e.
3. Re-ejecutar `npm run test:e2e` y validar reduccion de ruido.

### Criterios de salida
- Warning de origin mitigado.
- Menor ruido de proxy en logs QA.

## Fase 4 - Refactor estructural controlado (riesgo medio)

### Acciones
1. Crear componente/hoc de pagina tenant para encapsular:
- `TenantContextGate`
- `TenantModuleGate`
- shell base
2. Aplicar en lotes pequenos a rutas `inventory/crm/hr/audit`.
3. Validar sin regresion con lint/typecheck/test/e2e smoke.

### Criterios de salida
- Menor duplicacion entre pages.
- Misma funcionalidad y guardas conservadas.

## Priorizacion y orden sugerido
1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4

## Riesgo esperado
- Integridad funcional: bajo si se ejecuta por lotes atomicos con validacion completa.
- Ganancia: alta en claridad documental y control de calidad.
