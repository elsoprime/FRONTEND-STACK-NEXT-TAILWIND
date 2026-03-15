# Auditoria Frontend Dashboard Tenant - 2026-03-15

## Alcance y metodo
- Repositorio: `FRONTEND-STACK-NEXT-TAILWIND`
- Alcance: dashboard tenant, servicios `src/features/*`, cliente API, docs de integracion y calidad
- Evidencia ejecutada:
  - `npm run lint` -> OK
  - `npm run typecheck` -> OK
  - `npm run test` -> OK (14 archivos, 91 tests)
  - `npm run build` -> OK
  - `npm run test:e2e` -> OK (25/25)
  - `npm run docs:coupling:check` -> OK
  - `npm run test -- --coverage` -> FAIL (falta `@vitest/coverage-v8`)

## Rol 1 - Documentador

### Hallazgos
1. **Inconsistencia de rutas documentales internas** (Severidad: Alta)
- `docs/README.md` referencia `docs/frontend/*`, pero en este repo los documentos vigentes estan en `docs/*.md`.
- Evidencia: `docs/README.md:6`, `docs/README.md:12`, `docs/README.md:53`.
- Impacto: onboarding confuso y riesgo de editar ruta equivocada.

2. **Matriz de deprecacion desalineada con estructura real** (Severidad: Alta)
- `docs/95_DOCS_DEPRECATION_MATRIX.md` continua declarando `docs/frontend/*` como ubicacion canonical.
- Evidencia: `docs/95_DOCS_DEPRECATION_MATRIX.md:9`, `docs/95_DOCS_DEPRECATION_MATRIX.md:45`, `docs/95_DOCS_DEPRECATION_MATRIX.md:72`.
- Impacto: deuda documental y governance inconsistente.

3. **Referencias deprecadas con path incorrecto** (Severidad: Media)
- Documentos en `docs/_deprecated/*` apuntan a rutas `docs/frontend/*` inexistentes en este repo.
- Evidencia: `docs/_deprecated/README.md:8`, `docs/_deprecated/90_INTEGRATION_PLAN_V1.md:6`.
- Impacto: trazabilidad historica debilitada.

4. **Guia de instalacion/configuracion incompleta** (Severidad: Alta)
- No existe `.env.example`; solo `.env.local`.
- README no define pasos minimos de instalacion y despliegue (variables, valores esperados, estrategia por entorno).
- Evidencia: inexistencia de `.env.example`; `README.md` sin seccion formal de setup/deploy.
- Impacto: alta friccion para nuevos contribuidores/CI nuevos.

5. **Typos en DoD** (Severidad: Baja)
- `docs/90_DOD_CHECKLIST.md` contiene typo en el nombre del cliente tenant.
- Evidencia: `docs/90_DOD_CHECKLIST.md:110` (`enantApiRequest`).
- Impacto: menor, pero reduce precision del contrato.

### Recomendaciones
- Normalizar toda referencia interna a `docs/*.md` en este repo.
- Crear `.env.example` con `APP_URL`, `NEXT_PUBLIC_API_BASE_URL` (si aplica), `NEXT_PUBLIC_CSRF_COOKIE_NAME`.
- Agregar en README secciones formales: instalacion, configuracion, despliegue local/CI.
- Corregir typos de DoD y referencias en docs deprecados.

## Rol 2 - Integrador de Componentes

### Hallazgos
1. **Scope split no aplicado de forma explicita en tenant service** (Severidad: Media)
- `tenant.service.ts` usa `apiRequest` directo en rutas mixtas en vez de separar explicitamente llamadas tenant-scoped/no-tenant con wrappers dedicados.
- Evidencia: `src/features/tenant/tenant.service.ts:1`, `src/features/tenant/tenant.service.ts:83`, `src/features/tenant/tenant.service.ts:105`, `src/features/tenant/tenant.service.ts:117`.
- Impacto: menor claridad de intencion y mayor riesgo de regresion en reglas de scope.

2. **Patron de gate repetido en muchas pantallas** (Severidad: Media)
- Combinacion `TenantContextGate + TenantModuleGate` repetida en gran cantidad de rutas.
- Evidencia: multiples ocurrencias en `src/app/app/**/page.tsx`.
- Impacto: mayor costo de mantenimiento y posibilidad de drift entre pantallas.

3. **Dependencias opcionales instaladas sin uso observable** (Severidad: Baja)
- No se observan usos en `src` de `next-intl` ni `@sentry/nextjs`.
- Evidencia: busquedas sin resultados en `src`.
- Impacto: peso de dependencias y complejidad futura sin beneficio actual.

### Recomendaciones
- Introducir helper de composicion de pagina tenant para reducir repeticion.
- Estandarizar uso de `tenantApiRequest`/`platformApiRequest` donde aplica explicitamente.
- Mantener dependencias opcionales documentadas como "instaladas/no activas" o removerlas.

## Rol 3 - QA / Bug Hunter

### Hallazgos
1. **Cobertura no medible en pipeline actual** (Severidad: Alta)
- `npm run test -- --coverage` falla por dependencia ausente.
- Evidencia: error `Cannot find dependency '@vitest/coverage-v8'`.
- Impacto: no hay metrica de cobertura para vigilar regresiones.

2. **Warning de Next por origen dev cruzado** (Severidad: Media)
- E2E pasa, pero aparece warning de `allowedDevOrigins`.
- Evidencia: salida Playwright (`Cross origin request detected from 127.0.0.1 to /_next/* resource`).
- Impacto: ruido operativo y potencial ruptura futura en nuevas versiones Next.

3. **Ruido por proxies fallidos durante E2E** (Severidad: Media)
- Se registran `ECONNREFUSED` a `localhost:4000` durante pruebas (aunque los casos pasan por fallback/mocks).
- Evidencia: salida Playwright en varias rutas `/api/v1/*`.
- Impacto: baja señal en logs de QA y dificultad para detectar fallos reales.

4. **Riesgo operativo en entorno sandbox** (Severidad: Baja)
- En este entorno, `test/build/e2e` fallan con `spawn EPERM` sin permisos elevados.
- Impacto: no es bug del repo, pero afecta reproducibilidad en entornos restringidos.

### Recomendaciones
- Instalar `@vitest/coverage-v8` y definir umbrales minimos.
- Configurar `allowedDevOrigins` para setup Playwright/dev.
- Estabilizar estrategia de proxy/mocks para eliminar `ECONNREFUSED` en E2E.

## Rol 4 - Arquitecto de Codigo

### Hallazgos
1. **TypeScript strict habilitado y sin `any` en `src`** (Estado: Positivo)
- Evidencia: `tsconfig.json` con `strict: true`; busqueda de `any` sin hallazgos en `src`.

2. **Cliente API centralizado correctamente** (Estado: Positivo)
- No se detectan `fetch` directos fuera de `src/lib/api/client.ts`.
- Evidencia: unico `fetch` en `src/lib/api/client.ts`.

3. **Arquitectura modular consistente pero con sobre-repeticion en pages** (Severidad: Media)
- Estructura por feature es consistente; el problema es duplicacion de composicion en UI pages.
- Impacto: deuda de mantenimiento, no falla funcional inmediata.

4. **DoD parcialmente cumplido por falta de cobertura formal** (Severidad: Alta)
- DoD exige evidencia de testing, pero falta medicion de cobertura/umbral automatizado.
- Evidencia: `vitest.config.ts` sin bloque coverage y comando coverage fallido.

### Recomendaciones
- Añadir cobertura a Vitest + umbrales.
- Extraer plantilla/base para paginas tenant con guardas.
- Mantener controles de scope y contratos como barrera arquitectonica.

## Lista priorizada (criticos -> mejoras)

### Criticos
1. Falta de cobertura ejecutable (`@vitest/coverage-v8`) y umbrales.
2. Documentacion interna con rutas canonical equivocadas (`docs/frontend/*` vs `docs/*`).

### Altos
1. README sin guia formal de instalacion/configuracion/despliegue ni `.env.example`.
2. Riesgo futuro por warning `allowedDevOrigins` no configurado.

### Medios
1. Ruido `ECONNREFUSED` durante E2E (logs con baja señal).
2. Repeticion de patron de guardas en multiples pages.
3. Uso de `apiRequest` en `tenant.service.ts` sin separacion explicita por wrapper.

### Bajos
1. Typos documentales (`enantApiRequest`).
2. Dependencias opcionales instaladas sin uso visible (`next-intl`, `@sentry/nextjs`).

## Conclusión de salud del repositorio
- **Salud funcional actual: Buena** (lint/typecheck/unit/e2e/build en verde).
- **Salud de integracion: Buena** (acoplamiento OpenAPI/docs espejo FE-API en verde por script).
- **Riesgo principal: Documental/operacional**, no de integridad funcional inmediata.
- **Impacto global actual en integridad**: **No negativo critico**; hay deuda tecnica controlable que debe remediarse antes de escalar CI/colaboracion.

## Siguientes pasos recomendados
1. Lote A (documental): corregir paths `docs/frontend/*` -> `docs/*`, README y deprecados.
2. Lote B (QA): habilitar coverage + thresholds en Vitest.
3. Lote C (runtime dev): configurar `allowedDevOrigins` y limpiar ruido de proxy E2E.
4. Lote D (arquitectura): extraer wrapper de pagina tenant para reducir duplicacion.
