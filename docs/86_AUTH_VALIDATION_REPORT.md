# 86_AUTH_VALIDATION_REPORT

## 1. Alcance de validacion

Fecha: 2026-03-10
Repositorio: `FRONTEND-STACK-NEXT-TAILWIND`

Flujos revisados:

- Registro de usuario
- Login browser
- Recuperacion de contrasena (forgot/reset)
- Cambio de contrasena autenticado
- Creacion de tenant
- Tenant settings
- Tenant effective settings

## 2. Resultado por flujo

### 2.1 Crear cuenta

Endpoint: `POST /api/v1/auth/register`

Estado:

- Operativo y alineado al contrato de API.
- Formulario limpiado en exito.
- Mensaje de verificacion sin enlace directo.

Archivo clave:

- `src/components/auth/register-form.tsx`

### 2.2 Olvide contrasena

Endpoint: `POST /api/v1/auth/forgot-password`

Estado:

- Operativo y alineado al contrato de seguridad.
- No revela existencia de cuenta.
- Para emails inexistentes se mantiene respuesta generica (`202 accepted`).

Archivos clave:

- `src/components/auth/forgot-password-form.tsx`
- `src/features/auth/auth.service.ts`
- `src/features/auth/auth.service.test.ts`

### 2.3 Reset password

Endpoint: `POST /api/v1/auth/reset-password`

Estado:

- Implementado y validado.
- UI operativa en `/auth/reset-password`.
- Manejo de errores por `error.code` + errores de campo backend.

Archivos clave:

- `src/components/auth/reset-password-form.tsx`
- `src/app/auth/reset-password/page.tsx`

### 2.4 Change password

Endpoint: `POST /api/v1/auth/change-password`

Estado:

- Implementado y validado.
- Integrado en `settings/security`.
- Requiere sesion autenticada + CSRF para mutacion browser.

Archivos clave:

- `src/components/auth/security-two-factor-panel.tsx`
- `src/features/auth/auth.service.ts`

### 2.5 Login

Endpoint: `POST /api/v1/auth/login/browser`

Estado:

- Operativo y alineado.
- Bootstrap de sesion + tenant context via `tenant/mine`.
- Refresh ante `401` gestionado por cliente API con un solo intento.

Archivos clave:

- `src/components/auth/login-form.tsx`
- `src/lib/api/client.ts`
- `src/features/auth/auth.service.ts`

## 3. Tenant settings effective: estado y criterio operativo

### 3.1 Estado actualizado de dependencia backend

- La dependencia de inicializacion de platform settings ya no se considera abierta.
- Backend cuenta con bootstrap de arranque para inicializacion requerida.

### 3.2 Regla frontend para `GET /api/v1/tenant/settings/effective`

- Si backend responde `GEN_INTERNAL_ERROR`, tratar como incidente (no como error recuperable de usuario).
- No aplicar retry loop automatico para este caso.
- Mostrar estado de incidente con `traceId` y escalar a observabilidad/backend.

Archivos clave:

- `src/features/tenant/error-code-map.ts`
- `src/components/tenant/tenant-effective-settings-panel.tsx`
- `src/components/tenant/tenant-settings-form.tsx`

## 4. Ajustes de idioma (Tenant Settings / Effective)

Aplicado:

- Labels y textos principales en espanol para tenant settings y vista efectiva.

Archivos clave:

- `src/components/tenant/tenant-settings-form.tsx`
- `src/components/tenant/tenant-effective-settings-panel.tsx`

## 5. Pruebas y validaciones

- Validacion documental objetivo de esta iteracion: `npm run docs:coupling:check`.

## 6. Deuda tecnica residual (fuera del alcance Auth)

- Integraciones funcionales pendientes de modulos CRM/HR/Inventory.
- Endpoints tenant secundarios aun no expuestos en UI.

Ver detalle en:

- `docs/85_IMPLEMENTATION_STATUS.md`
