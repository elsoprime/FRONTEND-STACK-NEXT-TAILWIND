# Especificacion de Rediseno - Modulo Inventario

Fecha: 2026-03-17
Estado: Propuesta de implementacion
Impacto documental: Este documento no reemplaza ni modifica la documentacion vigente. Define una propuesta acotada de rediseno UI/UX sobre la implementacion actual.

## 1. Objetivo

Definir el rediseno del modulo `Inventario` en frontend para mejorar:

- navegacion del modulo
- claridad operativa del panel principal
- acceso rapido a submodulos existentes
- consistencia visual en vistas internas

La propuesta se apoya en la implementacion actual del repositorio `FRONTEND-STACK-NEXT-TAILWIND` y no altera por si sola contratos OpenAPI ni guias vigentes.

## 2. Contexto actual del repositorio

Hoy el modulo ya dispone de:

- ruta principal `src/app/app/inventory/page.tsx`
- submenu interno `src/components/modules/inventory/inventory-module-nav.tsx`
- sidebar tenant con hijos de inventario en `src/components/tenant/tenant-sidebar.tsx`
- vistas operativas existentes:
  - `items`
  - `categories`
  - `warehouses`
  - `lots`
  - `stocktakes`
  - `stock`
  - `alerts`
  - `reconciliation`
  - `settings`

La implementacion actual ya es funcional. Este requerimiento debe tratarse como rediseno y reorganizacion de experiencia, no como construccion del modulo desde cero.

## 3. Alcance del rediseno

### 3.1 Navegacion principal del modulo

El submenu visible del modulo `Inventario` debe quedar compuesto por solo estas opciones:

- `Panel principal`
- `Alertas`
- `Reconciliacion`
- `Configuracion`

### 3.2 Submodulos operativos

Los submodulos existentes no desaparecen. Se mantienen como funcionalidades del modulo y se exponen principalmente mediante accesos rapidos desde el panel principal:

- `Items`
- `Categorias`
- `Bodegas`
- `Lotes`
- `Conteo`
- `Stock`

Nota: `Conteo` corresponde a la funcionalidad `stocktakes`.

### 3.3 Restriccion de implementacion

Si no existe endpoint backend especifico para metricas agregadas del dashboard, las metricas del panel principal deben mostrarse de forma estatica o mockeada, sin introducir dependencias no documentadas en OpenAPI.

## 4. Estructura objetivo del modulo

## 4.1 Navegacion funcional

### Menu del modulo Inventario

1. `Panel principal` -> `/app/inventory`
2. `Alertas` -> `/app/inventory/alerts`
3. `Reconciliacion` -> `/app/inventory/reconciliation`
4. `Configuracion` -> `/app/inventory/settings`

### Accesos rapidos desde Panel principal

1. `Items` -> `/app/inventory/items`
2. `Categorias` -> `/app/inventory/categories`
3. `Bodegas` -> `/app/inventory/warehouses`
4. `Lotes` -> `/app/inventory/lots`
5. `Conteo` -> `/app/inventory/stocktakes`
6. `Stock` -> `/app/inventory/stock`

## 4.2 Decision de UX

Se separan dos niveles:

- nivel de navegacion del modulo: vistas de supervision y configuracion
- nivel de operacion: submodulos de trabajo diario

Con esto el usuario entra primero a un dashboard y desde ahi salta a la operacion puntual.

## 5. Especificacion del Panel principal

## 5.1 Objetivo de la vista

El `Panel principal` debe comportarse como dashboard operativo del modulo Inventario.

Debe concentrar:

- estado general del modulo
- metricas clave
- graficas de movimientos
- distribucion de stock
- accesos rapidos a submodulos

## 5.2 Secciones obligatorias

### A. Cabecera

La cabecera de la vista debe conservar el patron existente de `TenantPageShell`, con:

- nombre del modulo
- titulo principal
- descripcion corta de supervision operativa

### B. Tarjetas de metricas

Debe existir una primera banda de metricas con tarjetas resumen.

Metricas requeridas:

- total de bodegas activas
- total de lotes
- total de conteos
- total de stock
- total de items
- total de alertas activas

Regla de datos:

- si existe endpoint o combinacion segura de endpoints ya definidos, se puede poblar con datos reales
- si no existe soporte backend directo para la metrica agregada, mostrar valor estatico de referencia

### C. Graficas

Debe existir una seccion visual con al menos dos componentes graficos:

1. grafica de movimientos entrantes y salientes
2. grafica o bloque visual de porcentaje de stock por bodega

Regla de datos:

- usar datos reales solo cuando puedan derivarse sin inventar endpoints
- en caso contrario, usar dataset estatico de demo alineado al diseno

### D. Accesos rapidos

Debe existir una seccion de accesos rapidos con cards de submodulos.

Cantidad:

- 6 cards

Submodulos:

- Items
- Categorias
- Bodegas
- Lotes
- Conteo
- Stock

Cada card debe incluir:

- titulo del submodulo
- breve descripcion funcional
- boton de acceso
- estado visual hover/focus

### E. Bloque de ayuda operativa

Se puede mantener una seccion lateral o inferior con:

- recomendaciones de uso
- recordatorios operativos
- acceso a auditoria si ya existe en el flujo actual

## 5.3 Layout recomendado

### Desktop

- cabecera superior
- fila de metricas
- bloque central en dos columnas:
  - izquierda: graficas
  - derecha: alertas/resumen de apoyo
- bloque inferior de accesos rapidos en grid

### Tablet

- metricas en 2 o 3 columnas
- graficas apiladas
- cards de acceso rapido en 2 columnas

### Mobile

- metricas apiladas
- graficas una debajo de otra
- cards de acceso rapido en 1 columna

## 6. Especificacion de accesos rapidos

## 6.1 Requisito funcional

Los accesos rapidos son la entrada principal a los submodulos operativos.

## 6.2 Requisito visual

El contenedor debe implementarse como grid responsive.

Interpretacion tecnica del pedido:

- en desktop debe verse como un grid de cards equilibrado
- no se fuerza una grilla estricta de 5 columnas porque ahora el alcance confirmado contempla 6 cards
- la solucion recomendada es:
  - `xl`: 3 columnas
  - `md`: 2 columnas
  - `sm`: 1 columna

Esto preserva legibilidad y evita compresion visual.

## 6.3 Contenido minimo por card

- icono representativo
- titulo
- descripcion corta
- boton `Abrir`
- navegacion a la ruta del submodulo

## 7. Regla para vistas de submodulos existentes

## 7.1 Ambito de aplicacion

Este requisito aplica solo a submodulos existentes:

- `items`
- `categories`
- `warehouses`
- `lots`
- `stocktakes`
- `stock`

No aplica a:

- `panel principal`
- `alerts`
- `reconciliation`
- `settings`

## 7.2 Comportamiento obligatorio

Dentro del contenedor con clase `surface-card` se debe agregar:

- la ruta activa
- un boton para volver a `Dashboard` o al `Panel principal`

## 7.3 Forma recomendada

Se recomienda una franja superior dentro del `surface-card` con:

- breadcrumb textual
- accion secundaria de retorno

Ejemplos de breadcrumb:

- `Dashboard / Inventario / Items`
- `Dashboard / Inventario / Categorias`
- `Dashboard / Inventario / Bodegas`

Acciones sugeridas:

- `Volver a Dashboard`
- `Volver a Panel principal`

Se recomienda priorizar `Volver a Panel principal` por consistencia con el flujo del modulo.

## 7.4 Estrategia tecnica sugerida

Para no duplicar logica en cada pagina, se recomienda extender `src/components/tenant/tenant-page-shell.tsx` con props opcionales, por ejemplo:

- `showInventoryBreadcrumb`
- `inventoryBreadcrumbItems`
- `backHref`
- `backLabel`

Luego habilitar estas props solo en las vistas de submodulos existentes.

## 8. Datos y contratos

## 8.1 Regla dura

No se deben crear llamadas a endpoints no definidos en OpenAPI.

## 8.2 Uso de datos en el dashboard

### Permitido

- reutilizar endpoints ya existentes para poblar bloques parciales
- mezclar datos reales con bloques estaticos cuando el agregado no exista en backend

### No permitido

- inventar endpoint `dashboard`
- asumir agregaciones no soportadas por contrato
- documentar como real una metrica que en implementacion sera mock

## 8.3 Politica para metricas estaticas

Cuando una metrica o grafica no tenga soporte de contrato:

- mostrarla como dataset estatico de UI
- mantener valores plausibles y consistentes
- desacoplarla del dominio para que luego pueda reemplazarse por datos reales

## 9. Componentes y archivos impactados

## 9.1 Archivos con mayor probabilidad de cambio

- `src/app/app/inventory/page.tsx`
- `src/components/modules/inventory/inventory-module-nav.tsx`
- `src/components/tenant/tenant-page-shell.tsx`
- `src/components/tenant/tenant-sidebar.tsx` si se decide reflejar la misma simplificacion en el sidebar global

## 9.2 Vistas de submodulos a ajustar

- `src/app/app/inventory/items/page.tsx`
- `src/app/app/inventory/categories/page.tsx`
- `src/app/app/inventory/warehouses/page.tsx`
- `src/app/app/inventory/lots/page.tsx`
- `src/app/app/inventory/stocktakes/page.tsx`
- `src/app/app/inventory/stock/page.tsx`

## 9.3 Posibles componentes nuevos

- componente de metric cards del dashboard
- componente de quick access cards
- componente reutilizable de breadcrumb interno del modulo
- componente visual para charts mockeados o reales

## 10. Criterios de aceptacion

La implementacion se considera conforme si:

1. el submenu del modulo muestra solo `Panel principal`, `Alertas`, `Reconciliacion` y `Configuracion`
2. el panel principal presenta metricas relevantes del modulo
3. el panel principal incluye graficas de entradas/salidas y stock por bodega
4. el panel principal incluye cards de acceso rapido para `Items`, `Categorias`, `Bodegas`, `Lotes`, `Conteo` y `Stock`
5. cada card permite navegar a la vista correspondiente
6. los submodulos existentes muestran ruta activa dentro del `surface-card`
7. los submodulos existentes muestran boton para volver al `Panel principal` o `Dashboard`
8. no se agregan llamadas a endpoints fuera de OpenAPI
9. las metricas sin soporte backend se resuelven con datos estaticos
10. el layout responde correctamente en desktop, tablet y mobile

## 11. Riesgos y notas

- El pedido original hablaba de `Grid 5`, pero el alcance final confirmado incluye 6 accesos rapidos al incorporar `Stock`. Por eso la especificacion recomienda grid responsive y no una fila fija de 5 cards.
- Algunas metricas agregadas del dashboard no tienen endpoint dedicado; por requerimiento expreso deben resolverse como datos estaticos si no existe soporte de contrato.
- Si se quiere consistencia completa, el ajuste del submenu debe evaluarse tanto en la navegacion interna del modulo como en el sidebar tenant.

## 12. Siguiente decision de implementacion

Antes de codificar conviene cerrar solo un punto de alcance:

- si la simplificacion del submenu aplica tambien al `sidebar` global del tenant o solo a la navegacion interna del modulo

Mientras ese punto no cambie, el resto del rediseno puede ejecutarse sin afectar la documentacion actual vigente.
