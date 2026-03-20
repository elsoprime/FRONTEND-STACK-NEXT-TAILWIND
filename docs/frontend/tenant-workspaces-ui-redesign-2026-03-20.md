# Rediseno UI Tenant Workspaces 2026-03-20

## Objetivo
Documentar el rediseno frontend aplicado al entorno tenant sin modificar ni reemplazar la documentacion vigente. Este documento resume decisiones de UX/UI, modulos intervenidos, rutas activas y vistas evolutivas agregadas durante la refactorizacion reciente.

## Alcance
Se intervinieron superficies del tenant bajo un patron comun de workspace con tabs, navegacion contextual y consistencia visual compartida.

Modulos incluidos:
- Inventory
- Profile
- Tenant settings
- Billing
- Members
- Sidebar tenant y navegacion contextual asociada
- Estandar visual del componente `Button`

Fuera de alcance:
- contratos backend nuevos
- documentacion de API
- detalle de clases utilitarias o cambios cosmeticos menores
- backlog backend derivado

## Principios de diseno aplicados
- Unificar modulos complejos bajo un solo entry point por ruta principal.
- Reducir duplicacion entre paginas aisladas y navegacion interna.
- Separar visualmente operacion, runtime y superficies evolutivas.
- Mantener compatibilidad por ruta cuando existian accesos previos.
- Reutilizar componentes existentes antes de crear nuevos contenedores.
- Mantener consistencia visual con `TenantPageShell`, cards `surface-card`, tabs workspace y jerarquia comun de botones.

## Patron comun de workspace
Cada modulo redisenado usa este criterio:
- una ruta principal del modulo
- tabs internas para sub-superficies funcionales
- query param `?tab=` para abrir vistas especificas
- fallback seguro a una tab por defecto
- sin sincronizacion reactiva de URL en cada render
- sin loops de navegacion

Beneficios:
- menos dispersion de rutas
- menos duplicacion de contenido
- lectura mas clara para el usuario
- mayor escalabilidad para vistas futuras

## Inventory
### Estado final
`Inventory` paso a ser un workspace centralizado en:
- `/app/inventory`

Tabs y superficies principales:
- panel principal
- submodules
- alerts
- reconciliation
- settings

### Navegacion
Rutas con query param soportadas:
- `/app/inventory?tab=submodules`
- `/app/inventory?tab=alerts`
- `/app/inventory?tab=reconciliation`
- `/app/inventory?tab=settings`

### Cambios estructurales
- `InventoryModuleNav` deja de duplicar el panel principal y pasa a navegar por tabs del workspace.
- El sidebar tenant deja un solo entry point para `Inventario`.
- Las rutas antiguas de `alerts`, `reconciliation` y `settings` quedan como compatibilidad/redirect hacia el workspace.
- Los submodulos operativos usan breadcrumb hacia `Panel principal` con regreso al workspace.

### Submodulos operativos alineados
- categories
- items
- warehouses
- lots
- stocktakes
- stock

Ajustes comunes:
- `TenantPageShell` unificado
- paginacion compartida
- toolbar de tabla y formularios en modal
- consistencia de botones y navegacion

### Vistas evolutivas / datos no cerrados
- metricas agregadas del dashboard cuando backend no exista
- graficas y agregaciones derivadas con datos mock/estaticos si no hay endpoint

## Profile
### Estado final
`Profile` se redisenio como workspace principal en:
- `/app/settings/profile`

Tabs activas:
- `profile`
- `security`
- `roadmap`

Rutas soportadas:
- `/app/settings/profile`
- `/app/settings/profile?tab=security`
- `/app/settings/profile?tab=roadmap`

### Cambios estructurales
- La seguridad del usuario se centraliza dentro del modulo `Profile`.
- La vista de identidad personal, sesion y contexto activo convive con 2FA, recovery y cambio de contrasena.
- Se agrego una tercera superficie escalable para capacidades futuras sin mezclarla con seguridad actual.

### Seguridad de usuario
Se reutiliza el panel existente de 2FA y seguridad personal, redisenado para alinearlo al lenguaje visual del tenant.
Incluye:
- setup 2FA
- confirmacion TOTP
- regeneracion de recovery codes
- deshabilitar 2FA
- cambio de contrasena
- refresh headless

### Ajustes UX relevantes
- fecha/hora de expiracion de sesion formateada para `es-CL`
- separacion clara entre seguridad personal y seguridad de plataforma

## Seguridad de plataforma
### Estado final
La ruta:
- `/app/settings/security`

queda redefinida como superficie de `Seguridad de plataforma`, separada de `Profile`.

Tabs o superficies presentes:
- resumen
- politicas
- en desarrollo

### Objetivo
Reservar esta ruta para capacidades globales del sistema y no para identidad del usuario.

### Estado funcional
- la vista es frontend-ready
- parte del contenido es conceptual/evolutivo
- no depende de backend final para existir como modulo

## Tenant settings
### Estado final
`Tenant settings` se unifica en:
- `/app/settings/tenant`

Tabs soportadas:
- `config`
- `effective`
- `operations`

Rutas soportadas:
- `/app/settings/tenant?tab=config`
- `/app/settings/tenant?tab=effective`
- `/app/settings/tenant?tab=operations`

Ruta de compatibilidad:
- `/app/settings/tenant/effective` redirige a `/app/settings/tenant?tab=effective`

### Reutilizacion aplicada
- `TenantSettingsForm`
- `TenantEffectiveSettingsPanel`
- `TenantContextGate`
- `TenantPageShell`

### Cambios relevantes
- `Configuracion` ahora distribuye en grid los bloques:
  - Marca
  - Localizacion
  - Contacto
  - Facturacion
- `Vista efectiva` elimina encabezado redundante y agrega un resumen ejecutivo en grid.
- `Operativa` queda preparada para validaciones, historial, comparativa y rollback futuro.

### Vistas evolutivas
En `operations` se dejaron visibles superficies no conectadas aun a backend:
- validaciones por bloque
- historial de cambios
- comparativa y rollback

## Billing
### Estado final
`Billing` se redisenio como workspace principal en:
- `/app/settings/billing`

Tabs soportadas:
- `subscription`
- `runtime`
- `operations`

Rutas soportadas:
- `/app/settings/billing`
- `/app/settings/billing?tab=subscription`
- `/app/settings/billing?tab=runtime`
- `/app/settings/billing?tab=operations`

### Reutilizacion aplicada
- `TenantBillingProvisioningPanel`
- `TenantEffectiveSettingsPanel`
- `TenantContextGate`
- `TenantPageShell`

### Cambios estructurales
- `subscription` concentra el flujo comercial de plan, checkout, activacion y cancelacion.
- `runtime` separa la validacion del impacto efectivo del plan.
- `operations` reserva la superficie para conciliacion, auditoria y roadmap.

### Ajuste de layout principal
Dentro de `subscription`:
- la cabecera de aprovisionamiento ocupa una fila completa
- el contenido operativo principal queda a la izquierda
- la columna derecha concentra:
  - flujo guiado de activacion
  - recomendacion operativa
  - alcance del modulo
  - ultima sesion de checkout cuando exista

### Riesgo residual conocido
Si el usuario cambia de tab durante una operacion en curso, el panel de suscripcion puede perder estado temporal por remount. El flujo principal asume permanencia en esa tab hasta cerrar la operacion. Esto se considera aceptable en la fase actual.

## Members
### Estado final
`Members` se redisenio como workspace principal en:
- `/app/members`

Tabs soportadas:
- `team`
- `invitations`
- `ownership`
- `roadmap`

Rutas soportadas:
- `/app/members`
- `/app/members?tab=team`
- `/app/members?tab=invitations`
- `/app/members?tab=ownership`
- `/app/members?tab=roadmap`

Rutas de compatibilidad:
- `/app/members/invitations` redirige a `/app/members?tab=invitations`
- `/app/tenant/ownership` redirige a `/app/members?tab=ownership`

### Cambios estructurales
- Invitaciones y ownership dejan de vivir como paginas aisladas.
- El sidebar tenant y la navegacion del header apuntan a un entry point unico de `Miembros`.
- Ownership se integra en el dominio correcto de gobierno de acceso del tenant.
- Se agrega una tercera superficie evolutiva para politicas de acceso y auditoria futura.
- Se incorpora una tab `Equipo` con tabla paginada para validar la superficie de miembros del tenant.

### Alcance funcional actual
- tabla paginada de equipo con datos mock explicitos mientras no exista endpoint real de miembros del tenant
- envio de invitaciones
- revocacion de invitaciones
- transferencia de ownership
- vistas laterales de contexto y recomendaciones

### Vista evolutiva
En `roadmap` se deja preparada la expansion para:
- politicas de invitacion
- auditoria de accesos
- aprobaciones sensibles

## Sidebar tenant y navegacion global
### Cambios aplicados
- Si no existe tenant activo, se ocultan opciones dependientes del tenant.
- Se mantiene la logica actual de bloqueo por plan.
- `Inventario` queda como entry point unico en el sidebar.
- `Miembros` queda como entry point unico para equipo, invitaciones y ownership.
- El bloque de informacion de usuario se mueve al final del sidebar y se simplifica a una vista minimalista.

### Resultado
- menor ruido visual
- menos accesos invalidos sin tenant activo
- mejor separacion entre identidad del usuario y navegacion operativa

## Estandar visual de botones
### Objetivo
Alinear acciones del tenant a una jerarquia unica para dark/light y evitar apariencias inconsistentes entre modulos.

### Estado actual
El componente `Button` soporta variantes alineadas al tenant y se reutiliza en workspaces, toolbars, modales y vistas operativas.

Jerarquia usada:
- `primary`
- `secondary`
- `tertiary`
- `outline`
- `destructive`
- `toolbar`
- `dashboard`
- `ghost`
- `link`

### Criterio de uso
- `primary`: confirmar, crear, guardar
- `secondary`: volver, cancelar no destructivo, continuidad
- `tertiary`: acciones de apoyo visibles
- `outline`: apoyo contextual
- `destructive`: acciones irreversibles

## Vistas en desarrollo incorporadas
Se agregaron superficies intencionalmente visibles aunque no tengan backend completo. Su objetivo es dejar preparada la arquitectura sin inventar logica final.

Vistas o tabs evolutivas presentes:
- `Profile > En desarrollo`
- `Security de plataforma > En desarrollo`
- `Tenant settings > Operativa`
- `Billing > Operativa`
- `Members > En desarrollo`
- varias superficies auxiliares de roadmap dentro de workspaces existentes

### Regla aplicada
Estas vistas deben comunicar claramente que representan capacidad futura, soporte operativo o modulo no disponible, y no deben simular integracion backend inexistente.

## Compatibilidades mantenidas
Se dejaron rutas de compatibilidad para no romper accesos previos donde correspondia, especialmente en Inventory, Tenant settings y Members.

Ejemplos:
- rutas antiguas de inventory absorbidas por query param del workspace
- `settings/tenant/effective` redirigida al workspace
- `members/invitations` y `tenant/ownership` absorbidas por el workspace `Members`

## Componentes nuevos creados con uso real
Solo se crearon contenedores nuevos cuando eran necesarios para montar el patron de workspace y quedaron en uso directo:
- `src/components/modules/profile/profile-settings-workspace.tsx`
- `src/components/modules/tenant/tenant-settings-workspace.tsx`
- `src/components/modules/billing/billing-settings-workspace.tsx`
- `src/components/modules/members/members-workspace.tsx`

## Riesgos conocidos y decisiones pendientes
- algunos tabs evolutivos aun no consumen backend real
- billing mantiene riesgo bajo de perdida de estado temporal al abandonar `subscription` en mitad de una operacion
- la tab `Members > Equipo` usa datos mock explicitos hasta contar con un endpoint real de miembros del tenant
- futuras mejoras pueden convertir ciertos paneles operativos en vistas persistentes o keep-mounted si QA lo exige
- parte de dashboards y resumentes ejecutivos siguen usando datos mock/estaticos cuando no hay endpoint agregado

## Resultado general del rediseno frontend
El tenant pasa de un conjunto de paginas aisladas a una estructura mas coherente basada en workspaces, tabs internas y navegacion contextual. El resultado esperado es:
- menor duplicacion de rutas
- mejor consistencia entre modulos
- escalabilidad para capacidades futuras
- separacion mas clara entre operacion, runtime y evolucion del sistema

## Uso de este documento
Este documento sirve para:
- alineacion frontend
- QA funcional
- trazabilidad de rediseno UI/UX
- futura derivacion a un handoff backend si se decide despues

No reemplaza documentacion tecnica existente ni contratos API.
