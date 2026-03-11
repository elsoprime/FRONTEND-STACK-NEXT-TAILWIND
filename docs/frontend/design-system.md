# Frontend Design System

## Objetivo

Consolidar una guia visual consistente para `FRONTEND-STACK-NEXT-TAILWIND`, manteniendo la estetica actual y elevando identidad, jerarquia visual y calidad de interaccion.

## Principios

- Mantener coherencia entre marketing, auth y app.
- Priorizar legibilidad, foco visible y contraste.
- Usar componentes base (`Button`, `Input`, `Badge`) antes de estilos inline.
- Usar superficies reutilizables (`surface-card`, `surface-card-hover`) para tarjetas y paneles.
- Evitar variaciones ad-hoc de color/sombra fuera de tokens.

## Tokens y Fundaciones

Fuente de verdad principal:

- `src/app/globals.css`

Tokens usados:

- Color semantico: `--primary`, `--accent`, `--muted`, `--destructive`, `--border`.
- Superficies: `--background`, `--card`, `--popover`.
- Radio: `--radius`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.

Utilidades clave agregadas:

- `surface-card`: tarjeta base con borde + blur + sombra controlada.
- `surface-card-hover`: elevacion suave para hover.
- `nav-link-pill`: links de navegacion para header marketing.
- `dashboard-nav-pill`: links de navegacion para modulos en app.
- `field-label`: label estandar para formularios.

## Header Profesional

### Marketing Header (`CorporatePortalHeader`)

Objetivos:

- Marca destacada con simbolo y subtitulo.
- Navegacion clara con estado activo visible.
- Quick actions consistentes (`Acceso`, `Solicitar demo`).
- Version movil con navegacion horizontal accesible.

Patron recomendado para link activo:

```tsx
<Link
  className={cn(
    "nav-link-pill",
    isActive && "bg-primary/14 text-foreground shadow-[inset_0_0_0_1px_oklch(0.58_0.16_42/0.24)]"
  )}
>
  Label
</Link>
```

### App Header (`DashboardHeader`)

Objetivos:

- Mostrar contexto de tenant y rol de forma jerarquica.
- Navegacion de modulos clara y responsive.
- Acciones rapidas visibles (cambio de tenant, perfil, logout).

Patron recomendado para pildora de modulo:

```tsx
<Link
  className={cn(
    "dashboard-nav-pill",
    isActive && "border-primary/35 bg-primary/14 text-foreground"
  )}
>
  <Icon className="size-4" />
  Inventory
</Link>
```

## Componentes Base

### Button

Archivo:

- `src/components/ui/button.tsx`

Convenciones:

- Usar variantes (`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`).
- Mantener estados `hover`, `active`, `focus-visible`, `disabled`.
- Para CTA principal usar `variant="default"` y, si aplica, `rounded-full`.

Ejemplo:

```tsx
<Button size="lg" className="rounded-full">Solicitar demo</Button>
```

### Input

Archivo:

- `src/components/ui/input.tsx`

Convenciones:

- No usar `<input>` sin el wrapper `Input` salvo casos excepcionales.
- Mantener altura consistente (`h-10`/`h-11`) y foco visible.
- Para formularios de conversion usar `field-label` + `Input`.

Ejemplo:

```tsx
<label className="field-label">Correo *</label>
<Input type="email" className="h-11 rounded-xl bg-card/80" />
```

### Badge

Archivo:

- `src/components/ui/badge.tsx`

Convenciones:

- `outline` para context labels y metadata.
- `default` para estados clave.
- Evitar badges sin contexto visual (texto aislado).

### DecisionDialog (modal reusable)

Archivos:

- `src/components/ui/decision-dialog.tsx`
- `src/components/auth/logout-confirm-dialog.tsx` (wrapper de caso real)

Convenciones:

- Usar `DecisionDialog` para acciones irreversibles o de alto impacto.
- `tone="default"` para confirmaciones generales.
- `tone="danger"` para acciones sensibles (logout total, borrado, revocaciones).
- No tomar decisiones por `error.message`; mantener flujos de negocio por `error.code`.

Ejemplo base:

```tsx
<DecisionDialog
  open={open}
  onOpenChange={setOpen}
  title="Aplicar cambios estrategicos"
  description="Esta accion actualizara la configuracion del tenant activo."
  confirmLabel="Aplicar cambios"
  cancelLabel="Revisar de nuevo"
  onConfirm={async () => {
    await saveSettings();
  }}
>
  <p>El impacto se refleja inmediatamente para todos los usuarios del tenant.</p>
</DecisionDialog>
```

Ejemplo logout:

```tsx
<LogoutConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  mode="all"
  loading={isSubmitting}
  onConfirm={async () => {
    await executeLogoutAll();
  }}
/>
```

## Tarjetas y Paneles

Patron para metricas:

```tsx
<article className="surface-card surface-card-hover rounded-xl p-4">
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Metric</p>
  <p className="mt-3 text-3xl font-bold">42</p>
</article>
```

Patron para listas dentro de panel:

```tsx
<li className="rounded-lg border border-border/80 bg-background/70 px-3 py-2.5 hover:border-primary/30">
  ...
</li>
```

## Microinteracciones

Reglas:

- Hover con elevacion leve (`hover:-translate-y-0.5`) en CTA y tarjetas.
- Transiciones cortas (`duration-200`/`duration-300`) sin animaciones agresivas.
- Estados activos en navegacion siempre visibles.

## Accesibilidad

- Mantener `focus-visible:ring` en botones, inputs y links interactivos.
- Usar `aria-current="page"` en navegacion activa.
- Evitar texto con contraste bajo sobre fondos translucidos.
- Mantener navegacion operable por teclado.

## Integracion Frontend/API

Este documento no cambia contratos backend. Se mantiene:

- Ningun endpoint nuevo fuera de `openapi/openapi.yaml`.
- Manejo de errores por `error.code` (no por texto libre).
- Trazabilidad por `traceId` en flujos de error/soporte.

Referencias:

- `docs/30_API_CLIENT_STANDARD.md`
- `docs/50_ERROR_CATALOG.md`
- `docs/20_ACCESS_MATRIX.md`

## Estilos a Deprecar

Se deben evitar en nuevas pantallas:

- Botones custom inline con colores hardcodeados cuando `Button` cubre el caso.
- Campos nativos sin `Input`.
- Tarjetas repetidas con combinaciones manuales de `border + bg + shadow` sin `surface-card`.

## Checklist de contribucion visual

Antes de merge:

1. Se usan componentes base del sistema (`Button`, `Input`, `Badge`).
2. Header/paneles respetan patrones responsive.
3. Hay estados visuales para `hover`, `focus-visible`, `disabled`, `loading`.
4. No se agregan endpoints fuera de OpenAPI.
5. Si hay errores de dominio, la UI sigue resolviendo por `error.code` con `traceId` trazable.
