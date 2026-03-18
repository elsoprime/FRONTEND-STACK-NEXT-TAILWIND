"use client";

import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

type GridContainerProps = {
  columns?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
};

type MetricTone = "default" | "success" | "warning" | "accent";

type ModuleState = "active" | "enabled" | "disabled" | "restricted";

const METRIC_TONE_CLASSNAMES: Record<MetricTone, string> = {
  default: "border-border/82 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(245,240,234,0.94)_100%)]",
  success:
    "border-emerald-300/72 bg-[linear-gradient(180deg,rgba(236,253,245,0.98)_0%,rgba(220,252,231,0.96)_100%)] text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-100",
  warning:
    "border-amber-300/76 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(254,243,199,0.95)_100%)] text-amber-950 dark:border-amber-500/32 dark:bg-amber-500/12 dark:text-amber-100",
  accent:
    "border-sky-300/74 bg-[linear-gradient(180deg,rgba(239,246,255,0.98)_0%,rgba(219,234,254,0.95)_100%)] text-sky-950 dark:border-accent/40 dark:bg-accent/12 dark:text-foreground",
};

const MODULE_STATE_COPY: Record<ModuleState, string> = {
  active: "Activo",
  enabled: "Disponible",
  disabled: "No incluido",
  restricted: "Sin acceso",
};

const MODULE_STATE_CLASSNAMES: Record<ModuleState, string> = {
  active:
    "border-emerald-300/78 bg-emerald-100/78 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-500/14 dark:text-emerald-100",
  enabled:
    "border-amber-300/80 bg-amber-100/78 text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/14 dark:text-amber-100",
  disabled: "border-border/85 bg-background/82 text-foreground/72",
  restricted:
    "border-red-300/78 bg-red-100/78 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200",
};

const FEEDBACK_CLASSNAMES = {
  success:
    "border-emerald-300/80 bg-emerald-100/82 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-500/14 dark:text-emerald-100",
  warning:
    "border-amber-300/80 bg-amber-100/82 text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/14 dark:text-amber-100",
  error:
    "border-red-300/80 bg-red-100/82 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200",
  info: "border-accent/35 bg-accent/12 text-foreground",
} as const;

export function DashboardSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SectionProps) {
  return (
    <section className={cn("surface-card relative overflow-hidden p-5 sm:p-6", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-primary/14 via-accent/8 to-transparent" />
      <header className="relative flex flex-col gap-4 border-b border-border/82 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="label-kicker text-primary/90">{eyebrow}</p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="max-w-2xl text-sm leading-relaxed dashboard-text-muted">{description}</p>
        </div>
        {action ? <div className="relative flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </header>
      <div className={cn("relative pt-4", contentClassName)}>{children}</div>
    </section>
  );
}

export function DashboardGridContainer({ columns = 2, children, className }: GridContainerProps) {
  const columnClassName =
    columns === 4
      ? "sm:grid-cols-2 xl:grid-cols-4"
      : columns === 3
        ? "sm:grid-cols-2 xl:grid-cols-3"
        : columns === 2
          ? "xl:grid-cols-2"
          : "grid-cols-1";

  return <div className={cn("grid gap-4", columnClassName, className)}>{children}</div>;
}

type DashboardMetricCardProps = {
  title: string;
  value: string;
  hint: string;
  icon: ElementType;
  tone?: MetricTone;
  isLoading?: boolean;
};

export function DashboardMetricCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
  isLoading = false,
}: DashboardMetricCardProps) {
  return (
    <article
      className={cn(
        "surface-card surface-card-hover relative flex h-full flex-col justify-between gap-5 overflow-hidden rounded-2xl p-4",
        METRIC_TONE_CLASSNAMES[tone],
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary/30 via-primary/8 to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/68">
          {title}
        </p>
        <div className="flex size-10 items-center justify-center rounded-2xl border border-primary/24 bg-foreground/[0.03] text-primary shadow-inner">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="space-y-1.5">
        {isLoading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        )}
        <p className="text-sm dashboard-text-muted">{hint}</p>
      </div>
    </article>
  );
}

type DashboardModuleCardProps = {
  title: string;
  description: string;
  icon: ElementType;
  state: ModuleState;
  metrics: Array<{ label: string; value: string }>;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  note?: string;
  accentClassName?: string;
};

export function DashboardModuleCard({
  title,
  description,
  icon: Icon,
  state,
  metrics,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  note,
  accentClassName = "from-primary/35 via-primary/15 to-transparent",
}: DashboardModuleCardProps) {
  return (
    <article className="surface-card surface-card-hover relative isolate overflow-hidden p-5">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
          accentClassName,
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/24 bg-foreground/[0.03] text-primary">
          <Icon className="size-5" />
        </div>
        <DashboardModuleStateBadge state={state} />
      </div>

      <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed dashboard-text-muted">{description}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border/82 bg-background/76 px-3 py-2.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-foreground/60">
              {metric.label}
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">{metric.value}</p>
          </div>
        ))}
      </div>

      {note ? (
        <p className="mt-4 rounded-xl border border-border/75 bg-background/72 px-3 py-2 text-xs dashboard-text-muted">
          {note}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border/72 pt-4">
        {state === "active" ? (
          <Link href={primaryHref}>
            <Button>
              {primaryLabel}
              <ArrowUpRight className="size-4" />
            </Button>
          </Link>
        ) : (
          <Button disabled>
            {primaryLabel}
          </Button>
        )}

        {state === "active" ? (
          <Link href={secondaryHref}>
            <Button variant="toolbar">
              {secondaryLabel}
            </Button>
          </Link>
        ) : (
          <Button variant="toolbar" disabled>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </article>
  );
}

type DashboardQuickActionCardProps = {
  title: string;
  description: string;
  icon: ElementType;
  children: ReactNode;
};

export function DashboardQuickActionCard({
  title,
  description,
  icon: Icon,
  children,
}: DashboardQuickActionCardProps) {
  return (
    <article className="surface-card surface-card-hover relative h-full overflow-hidden rounded-2xl p-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/32 via-primary/12 to-transparent" />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl border border-primary/24 bg-foreground/[0.03] text-primary">
          <Icon className="size-4" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="text-sm leading-relaxed dashboard-text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

type DashboardFeedbackBannerProps = {
  tone: keyof typeof FEEDBACK_CLASSNAMES;
  title: string;
  description: string;
  code?: string | null;
};

export function DashboardFeedbackBanner({
  tone,
  title,
  description,
  code,
}: DashboardFeedbackBannerProps) {
  const Icon = tone === "success" ? ShieldCheck : tone === "warning" ? AlertTriangle : Lock;

  return (
    <div className={cn("rounded-2xl border px-4 py-3", FEEDBACK_CLASSNAMES[tone])}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm">{description}</p>
          {code ? (
            <Badge variant="outline" className="mt-1 border-current/30 bg-transparent text-[11px]">
              {code}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DashboardModuleStateBadge({ state }: { state: ModuleState }) {
  const Icon = state === "active" ? ShieldCheck : state === "restricted" ? Lock : AlertTriangle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.11em]",
        MODULE_STATE_CLASSNAMES[state],
      )}
    >
      <Icon className="size-3.5" />
      {MODULE_STATE_COPY[state]}
    </span>
  );
}

