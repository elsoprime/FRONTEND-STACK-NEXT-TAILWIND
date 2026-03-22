import Link from "next/link";
import { ArrowRight, BadgeDollarSign, ClipboardList, FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExpensesWorkspace } from "@/modules/expenses/pages/ExpensesWorkspace";
import {
  EXPENSES_ROUTE_SECTIONS,
  resolveExpensesSectionByKey,
  type ExpensesSectionKey,
  type ExpensesRouteSection,
} from "@/modules/expenses/routes/expenses.routes";

type ExpensesModuleLayoutProps = {
  tenantId: string;
  tenantName: string;
  activeSectionKey: ExpensesSectionKey;
  visibleSections: readonly ExpensesSectionKey[];
  requestId?: string | null;
};

const SECTION_TONE_CLASSES: Record<ExpensesRouteSection["tone"], string> = {
  default: "text-primary border-primary/20 bg-primary/10",
  emerald: "text-emerald-100 border-emerald-200/20 bg-emerald-300/12",
  amber: "text-amber-100 border-amber-200/20 bg-amber-300/12",
  cyan: "text-cyan-100 border-cyan-200/20 bg-cyan-300/12",
  violet: "text-violet-100 border-violet-200/20 bg-violet-300/12",
};

function resolveVisibleSections(keys: readonly ExpensesSectionKey[]): readonly ExpensesRouteSection[] {
  const keySet = new Set(keys);
  return EXPENSES_ROUTE_SECTIONS.filter((section) => keySet.has(section.key));
}

function resolveActiveSection(activeSectionKey: ExpensesSectionKey): ExpensesRouteSection {
  return resolveExpensesSectionByKey(activeSectionKey) ?? EXPENSES_ROUTE_SECTIONS[0];
}

export function ExpensesModuleLayout({
  tenantId,
  tenantName,
  activeSectionKey,
  visibleSections,
  requestId,
}: ExpensesModuleLayoutProps) {
  const sections = resolveVisibleSections(visibleSections);
  const activeSection = resolveActiveSection(activeSectionKey);

  return (
    <div className="space-y-6">
      <section className="surface-card relative overflow-hidden rounded-[1.75rem] border-border/90 bg-card/96 p-6 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.35)] sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-r from-emerald-400/15 via-cyan-400/10 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="label-kicker text-primary/90">Modulo Expenses</p>
            <h2 className="text-[1.7rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
              Centro operativo de gastos para {tenantName}
            </h2>
            <p className="max-w-3xl text-sm dashboard-text-muted">
              Workspace del módulo con navegación por dominios, guardas RBAC y superficies
              operativas por sección.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/8 px-3 py-1">
              Tenant scoped
            </Badge>
            <Badge variant="outline" className="rounded-full border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-emerald-100">
              RBAC first
            </Badge>
            <Badge variant="outline" className="rounded-full border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-cyan-100">
              Requests default
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl border",
                SECTION_TONE_CLASSES[activeSection.tone],
              )}
            >
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Seccion activa
              </p>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                {activeSection.label}
              </h3>
            </div>
          </div>

          <p className="mt-4 text-sm dashboard-text-muted">{activeSection.summary}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-border/80 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="size-4 text-emerald-300" />
                Acceso
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Se filtra por modulo, plan y permiso.</p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ClipboardList className="size-4 text-cyan-300" />
                Acciones
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Catalogo visible por seccion y permiso.</p>
            </article>
            <article className="rounded-2xl border border-border/80 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BadgeDollarSign className="size-4 text-amber-300" />
                UX
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Loading, error y no access quedan cubiertos.</p>
            </article>
          </div>
        </article>

        <aside className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Secciones visibles
              </p>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Navegacion interna
              </h3>
            </div>
            <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">
              {sections.length}
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {sections.map((section) => {
              const isActive = section.key === activeSection.key;

              return (
                <Link
                  key={section.key}
                  href={`/app/expenses?tab=${section.key}`}
                  className={cn(
                    "group flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors",
                    isActive
                      ? "border-primary/25 bg-primary/8"
                      : "border-border/80 bg-background/65 hover:border-primary/20 hover:bg-background/80",
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{section.label}</span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          SECTION_TONE_CLASSES[section.tone],
                        )}
                      >
                        {section.capabilityLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{section.summary}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-border/80 bg-background/68 p-4">
            <p className="text-sm font-semibold text-foreground">Contrato visible</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Solo se presentan secciones con permisos reales del tenant activo.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">
                `/app/expenses`
              </Badge>
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">
                `tab={activeSection.key}`
              </Badge>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <ExpensesWorkspace
          tenantId={tenantId}
          activeSectionKey={activeSection.key}
          requestId={requestId ?? null}
        />

        <article className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Guia operativa
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
            Queue, detalle y workflow
          </h3>
          <p className="mt-3 text-sm dashboard-text-muted">
            Abre una solicitud para revisar su estado, ejecutar aprobacion o rechazo y volver a la
            cola sin abandonar el contexto del tenant.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/app/expenses"
              className="inline-flex items-center justify-center rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-background/90"
            >
              Ver cola
            </Link>
            <Link
              href="/app/expenses?tab=reports"
              className="inline-flex items-center justify-center rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-background/90"
            >
              Ir a reportes
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

