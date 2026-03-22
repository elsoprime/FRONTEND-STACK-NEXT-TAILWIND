import Link from "next/link";
import { cn } from "@/lib/utils";
import { ExpensesWorkspace } from "@/modules/expenses/pages/ExpensesWorkspace";
import {
  EXPENSES_ROUTE_SECTIONS,
  resolveExpensesSectionByKey,
  type ExpensesRouteSection,
  type ExpensesSectionKey,
} from "@/modules/expenses/routes/expenses.routes";

type ExpensesModuleLayoutProps = {
  tenantId: string;
  tenantName?: string;
  activeSectionKey: ExpensesSectionKey;
  visibleSections: readonly ExpensesSectionKey[];
  requestId?: string | null;
};

const SECTION_TONE_CLASSES: Record<ExpensesRouteSection["tone"], string> = {
  default: "border-primary/25 bg-primary/10 text-primary",
  emerald: "border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100",
  amber: "border-amber-300/35 bg-amber-400/10 text-amber-700 dark:text-amber-100",
  cyan: "border-cyan-300/35 bg-cyan-400/10 text-cyan-700 dark:text-cyan-100",
  violet: "border-violet-300/35 bg-violet-400/10 text-violet-700 dark:text-violet-100",
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
    <div className="space-y-7">
      <article className="surface-card relative overflow-hidden p-7 sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/20 via-accent/15 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative space-y-3">
          <p className="label-kicker text-primary/90">Workspace Expenses</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Navegacion interna del modulo
          </h1>
          <p className="max-w-3xl text-sm sm:text-base dashboard-text-muted">
            {tenantName
              ? `Tenant activo: ${tenantName}.`
              : "Solicitudes, aprobaciones, pagos, reportes y configuracion dentro de una misma superficie."}
            {" "}
            Cada vista se renderiza en la misma ruta para mantener continuidad operativa.
          </p>
        </div>

        <div role="tablist" aria-label="Tabs del modulo expenses" className="relative mt-6">
          <div className="flex flex-wrap gap-1 border-b border-border/85 px-1">
            {sections.map((section) => {
              const active = section.key === activeSection.key;

              return (
                <Link
                  key={section.key}
                  href={`/app/expenses?tab=${section.key}`}
                  role="tab"
                  aria-selected={active}
                  className={cn(
                    "group relative flex min-w-[170px] flex-1 flex-col gap-1 px-4 py-3 text-left transition-colors sm:min-w-[160px] sm:flex-none",
                    active
                      ? "rounded-t-xl border-b border-primary bg-white/10 text-primary shadow-lg"
                      : "text-foreground/58 hover:text-foreground",
                  )}
                >
                  <span className="text-sm font-semibold">{section.label}</span>
                  <span className={cn("text-xs text-foreground/60", active ? "font-bold" : "font-extralight")}>
                    {section.summary}
                  </span>
                  <span
                    className={cn(
                      "mt-1 inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                      SECTION_TONE_CLASSES[section.tone],
                    )}
                  >
                    {section.capabilityLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </article>

      <section className="overflow-hidden sm:p-6">
        <ExpensesWorkspace
          tenantId={tenantId}
          activeSectionKey={activeSection.key}
          requestId={requestId ?? null}
        />
      </section>
    </div>
  );
}

