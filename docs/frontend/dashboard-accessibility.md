# Dashboard Accessibility + Responsive Notes

- Hero and metric sections use semantic headings (`h1` for "Dashboard tenant", `h2` for tenant name) so screen readers understand hierarchy.
- All interactive buttons (invitation, module CTAs, billing links) retain Tailwind focus-visible styles and badges include `aria`-friendly text; keyboard tab order follows the visual grid.
- Responsive grids (`grid sm`, `lg:grid-cols`, etc.) ensure the overview, modules, and audit sections stack vertically on small viewports; I verified by shrinking the viewport to 375px width while previewing the layout in the dev server.
- Support/trace area preserves readable monospace `traceId` and the copy button keeps the same aria label across breakpoints.
- No decorative imagery was added to new sections, so contrast ratio remains the same as the existing palette; all text uses `text-muted-foreground` (sufficient contrast).
