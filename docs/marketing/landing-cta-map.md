# CTA Map - Landing y Marketing

## Alcance

Documento exclusivo para marketing y conversion.
No incluye detalle de implementacion backend/plataforma.

## Mapa de CTAs

1. Comenzar Evaluacion Gratis
- Origen: `src/components/landing/saas-corporate.tsx`
- Ruta: `/contact/demo`
- Pagina: `src/app/(marketing)/contact/demo/page.tsx`

2. Agendar Reunion Estrategica
- Origen: `src/components/landing/saas-corporate.tsx`
- Ruta: `/contact/strategy`
- Pagina: `src/app/(marketing)/contact/strategy/page.tsx`

3. Solicitar Plan Detallado
- Origen: `src/app/(marketing)/methodology/page.tsx`
- Ruta: `/contact/plan`
- Pagina: `src/app/(marketing)/contact/plan/page.tsx`

4. Solicitar Conector Propio
- Origen: `src/app/(marketing)/integrations/page.tsx`
- Ruta: `/contact/custom-connector`
- Pagina: `src/app/(marketing)/contact/custom-connector/page.tsx`

5. Ver API Docs
- Origen: `src/app/(marketing)/integrations/page.tsx` y `src/app/(marketing)/developers/page.tsx`
- Ruta: `/developers#api-docs`
- Pagina: `src/app/(marketing)/developers/page.tsx`

6. Configurar Conectores
- Origen: `src/app/(marketing)/integrations/page.tsx`
- Ruta: `/contact/connectors`
- Pagina: `src/app/(marketing)/contact/connectors/page.tsx`

7. Agendar Consultoria Tecnica
- Origen: `src/app/(marketing)/developers/page.tsx`
- Ruta: `/contact/technical-consulting`
- Pagina: `src/app/(marketing)/contact/technical-consulting/page.tsx`

## Criterios de mantenimiento

- Si cambia un CTA, actualizar este mapa en el mismo PR.
- Mantener copy y estilo consistente con el landing actual.
- Evitar registrar aqui detalles de API, OpenAPI o dependencias backend.
