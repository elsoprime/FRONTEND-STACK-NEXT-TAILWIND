# FRONTEND-STACK-NEXT-TAILWIND

Base frontend con Next.js 16 + TypeScript + Tailwind 4 orientada a integracion SaaS (cookies HttpOnly + CSRF + X-Tenant-Id).

## Stack instalado

### Base

- next, react, react-dom
- tailwindcss, @tailwindcss/postcss, postcss
- typescript, @types/node, @types/react, @types/react-dom

### Integracion API SaaS

- @tanstack/react-query
- zod
- react-hook-form, @hookform/resolvers
- zustand
- js-cookie

### UI

- class-variance-authority, clsx, tailwind-merge
- lucide-react
- tw-animate-css
- next-themes
- shadcn (CLI + componentes iniciales)

### Testing y calidad

- @playwright/test
- msw
- vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event
- eslint-config-next, prettier, husky, lint-staged

### Opcionales instalados

- next-intl
- @sentry/nextjs

## Comandos

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run test:e2e
npm run format
npm run format:check
```

## Estructura relevante

- `src/lib/api/client.ts`: cliente fetch con `credentials: "include"`, CSRF cookie/header y `X-Tenant-Id`.
- `src/store/tenant-store.ts`: estado cliente base con Zustand para tenant activo.
- `src/mocks/*`: setup de MSW para mocks por contrato.
- `tests/e2e/*`: pruebas E2E con Playwright.

## Notas

- No se configuro NextAuth/Auth.js para evitar duplicar la capa de autenticacion de backend.
- `next-intl` y `@sentry/nextjs` estan instalados, pero sin bootstrap adicional.

## Documentacion de integracion FE/API

Documentacion sincronizada desde `API-REST-STACK-NODE/docs/frontend/*`:

- `docs/10_IMPLEMENTATION_GUIDE_V2.md`
- `docs/20_ACCESS_MATRIX.md`
- `docs/30_API_CLIENT_STANDARD.md`
- `docs/40_STATE_AND_CACHE_POLICY.md`
- `docs/50_ERROR_CATALOG.md`
- `docs/60_MOCKING_GUIDE.md`
- `docs/70_E2E_CRITICAL_FLOWS.md`
- `docs/80_BACKEND_DEPENDENCIES.md`
- `docs/90_DOD_CHECKLIST.md`
- `docs/95_DOCS_DEPRECATION_MATRIX.md`
- `docs/_deprecated/*`

Validacion de acoplamiento:

```bash
npm run openapi:sync
npm run docs:coupling:check
```
