"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { formatAuditActionLabel, formatAuditResourceLabel, formatTraceIdShort } from "@/features/audit/audit-ui-labels";
import { listTenantAuditLogs } from "@/features/audit/audit.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { cn } from "@/lib/utils";

type AuditOverviewPanelProps = {
  tenantId: string;
};

type PeriodOption = 7 | 30;

const SEVERITIES: Array<"info" | "warning" | "critical"> = ["info", "warning", "critical"];

const SEVERITY_COLORS: Record<"info" | "warning" | "critical", string> = {
  info: "#38bdf8",
  warning: "#f59e0b",
  critical: "#ef4444",
};

function resolveError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiRequestError) {
    return {
      code: error.code,
      message: resolveTenantErrorMessage(error.code, error.message),
    };
  }

  return {
    code: "GEN_INTERNAL_ERROR",
    message: resolveTenantErrorMessage("GEN_INTERNAL_ERROR"),
  };
}

function resolveSeverityClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "border-destructive/45 bg-destructive/14 text-red-200";
    case "warning":
      return "border-amber-400/70 bg-amber-500/14 text-amber-100";
    default:
      return "border-accent/45 bg-accent/12 text-foreground";
  }
}

function formatDate(value: string): string {
  return formatSpanishLongDate(value);
}

function buildRange(periodDays: number): { from: string; to: string } {
  const toDate = new Date();
  const fromDate = new Date(toDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
}

function buildPreviousRange(periodDays: number): { from: string; to: string } {
  const current = buildRange(periodDays);
  const currentFrom = new Date(current.from).getTime();
  const currentTo = new Date(current.to).getTime();
  const windowMs = currentTo - currentFrom;

  return {
    from: new Date(currentFrom - windowMs).toISOString(),
    to: new Date(currentFrom).toISOString(),
  };
}

function toDayKey(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("es-CL", {
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function buildTrendSeries(createdAtValues: string[], periodDays: number): Array<{ day: string; total: number }> {
  const now = new Date();
  const dayBuckets = new Map<string, number>();

  for (let i = periodDays - 1; i >= 0; i -= 1) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = toDayKey(day.toISOString());
    dayBuckets.set(key, 0);
  }

  createdAtValues.forEach((value) => {
    const key = toDayKey(value);
    if (!dayBuckets.has(key)) {
      return;
    }
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  });

  return [...dayBuckets.entries()].map(([day, total]) => ({ day, total }));
}

function formatTrendValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  return `${rounded.toFixed(1)}%`;
}

export function AuditOverviewPanel({ tenantId }: AuditOverviewPanelProps) {
  const [periodDays, setPeriodDays] = useState<PeriodOption>(30);

  const currentRange = useMemo(() => buildRange(periodDays), [periodDays]);
  const previousRange = useMemo(() => buildPreviousRange(periodDays), [periodDays]);

  const currentQuery = useQuery({
    queryKey: ["tenant", tenantId, "audit", "overview", "current", periodDays],
    queryFn: async () =>
      listTenantAuditLogs(tenantId, {
        page: 1,
        limit: 100,
        from: currentRange.from,
        to: currentRange.to,
      }),
  });

  const previousQuery = useQuery({
    queryKey: ["tenant", tenantId, "audit", "overview", "previous", periodDays],
    queryFn: async () =>
      listTenantAuditLogs(tenantId, {
        page: 1,
        limit: 1,
        from: previousRange.from,
        to: previousRange.to,
      }),
  });

  const severityQueries = {
    info: useQuery({
      queryKey: ["tenant", tenantId, "audit", "overview", "severity", "info", periodDays],
      queryFn: async () =>
        listTenantAuditLogs(tenantId, {
          page: 1,
          limit: 1,
          severity: "info",
          from: currentRange.from,
          to: currentRange.to,
        }),
    }),
    warning: useQuery({
      queryKey: ["tenant", tenantId, "audit", "overview", "severity", "warning", periodDays],
      queryFn: async () =>
        listTenantAuditLogs(tenantId, {
          page: 1,
          limit: 1,
          severity: "warning",
          from: currentRange.from,
          to: currentRange.to,
        }),
    }),
    critical: useQuery({
      queryKey: ["tenant", tenantId, "audit", "overview", "severity", "critical", periodDays],
      queryFn: async () =>
        listTenantAuditLogs(tenantId, {
          page: 1,
          limit: 1,
          severity: "critical",
          from: currentRange.from,
          to: currentRange.to,
        }),
    }),
  };

  const isLoading =
    currentQuery.isLoading ||
    previousQuery.isLoading ||
    severityQueries.info.isLoading ||
    severityQueries.warning.isLoading ||
    severityQueries.critical.isLoading;

  if (isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-6"
        label="Cargando resumen de auditoria..."
        hint="Calculando tendencias y distribucion por severidad."
      />
    );
  }

  const firstError =
    currentQuery.error ??
    previousQuery.error ??
    severityQueries.info.error ??
    severityQueries.warning.error ??
    severityQueries.critical.error;

  if (firstError) {
    const { code, message } = resolveError(firstError);

    return (
      <article className="mt-6 rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        <p className="text-sm font-semibold">{message}</p>
        <p className="mt-1 text-xs">Codigo: {code}</p>
      </article>
    );
  }

  const items = currentQuery.data?.data.items ?? [];
  const currentTotal = currentQuery.data?.pagination.total ?? items.length;
  const previousTotal = previousQuery.data?.pagination.total ?? 0;
  const criticalCount = severityQueries.critical.data?.pagination.total ?? 0;

  const trendPct =
    previousTotal === 0 ? (currentTotal > 0 ? 100 : 0) : ((currentTotal - previousTotal) / previousTotal) * 100;

  const severityCounts = {
    info: severityQueries.info.data?.pagination.total ?? 0,
    warning: severityQueries.warning.data?.pagination.total ?? 0,
    critical: severityQueries.critical.data?.pagination.total ?? 0,
  };

  const severityDistribution = SEVERITIES.map((severity) => {
    const count = severityCounts[severity];
    const pct = currentTotal > 0 ? (count / currentTotal) * 100 : 0;
    return {
      severity,
      count,
      pct,
      color: SEVERITY_COLORS[severity],
    };
  });

  const trendSeries = buildTrendSeries(
    items.map((item) => item.createdAt),
    periodDays,
  );

  const topActions = Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item.action] = (acc[item.action] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div id="audit-panel-overview" role="tabpanel" className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Periodo de analisis
          </p>
          <p className="text-sm dashboard-text-muted">
            Tendencias basadas en datos del endpoint actual de auditoria.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30].map((days) => (
            <Button
              key={days}
              size="sm"
              variant={periodDays === days ? "primary" : "outline"}
              onClick={() => setPeriodDays(days as PeriodOption)}
            >
              {days} dias
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card surface-card-hover rounded-xl border-border/85 bg-card/88 p-4">
          <div className="flex items-center gap-3">
            <Activity className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Eventos ({periodDays} dias)
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{currentTotal}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl border-border/85 bg-card/88 p-4">
          <div className="flex items-center gap-3">
            {trendPct >= 0 ? (
              <TrendingUp className="size-4 text-emerald-300" />
            ) : (
              <TrendingDown className="size-4 text-amber-300" />
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Variacion vs periodo previo
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {trendPct >= 0 ? "+" : "-"}
            {formatTrendValue(trendPct)}
          </p>
          <p className="mt-1 text-xs dashboard-text-muted">Previo: {previousTotal} eventos</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl border-border/85 bg-card/88 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-4 text-red-300" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Eventos criticos
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{criticalCount}</p>
          <p className="mt-1 text-xs dashboard-text-muted">
            {currentTotal > 0 ? ((criticalCount / currentTotal) * 100).toFixed(1) : "0.0"}% del total
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="surface-card rounded-xl border-border/85 bg-card/88 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Tendencia diaria (muestra)
          </h3>
          <p className="mt-1 text-xs dashboard-text-muted">
            Serie calculada con eventos cargados en el periodo actual.
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendSeries} barCategoryGap={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "rgba(15, 23, 42, 0.14)" }}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.94)",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius: "14px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="total" name="Eventos" radius={[8, 8, 0, 0]} fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="surface-card rounded-xl border-border/85 bg-card/88 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Distribucion por severidad
          </h3>
          <p className="mt-1 text-xs dashboard-text-muted">
            Porcentaje real sobre total del periodo ({periodDays} dias).
          </p>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistribution}
                  dataKey="count"
                  nameKey="severity"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {severityDistribution.map((entry) => (
                    <Cell key={entry.severity} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, entry) => {
                    const safeValue = typeof value === "number" ? value : Number(value ?? 0);
                    const payload = entry?.payload as { pct?: number } | undefined;
                    return [`${safeValue} (${(payload?.pct ?? 0).toFixed(1)}%)`, "Eventos"];
                  }}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.94)",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius: "14px",
                    color: "#e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid gap-2">
            {severityDistribution.map((entry) => (
              <div key={entry.severity} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <span className="inline-flex size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.severity}
                </span>
                <span className="dashboard-text-muted">
                  {entry.count} ({entry.pct.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="surface-card rounded-xl border-border/85 bg-card/88 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Hitos mas significativos (top acciones)
        </h3>

        {topActions.length === 0 ? (
          <p className="mt-3 text-sm dashboard-text-muted">Sin eventos en el periodo seleccionado.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {topActions.map(([action, count]) => (
              <li key={action} className="rounded-lg border border-border/85 bg-background/68 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{formatAuditActionLabel(action)}</p>
                  <span className="text-xs dashboard-text-muted">{count} eventos</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="surface-card rounded-xl border-border/85 bg-card/88 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Actividad reciente
        </h3>

        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Sin eventos recientes para mostrar.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {items.slice(0, 10).map((item) => (
              <li key={item.id} className="rounded-lg border border-border/85 bg-background/68 px-3 py-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{formatAuditActionLabel(item.action)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatAuditResourceLabel(item.resource.type, item.resource.label)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                      resolveSeverityClass(item.severity),
                    )}
                  >
                    {item.severity}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(item.createdAt)}</span>
                  <span className="font-mono" title={item.traceId}>trace: {formatTraceIdShort(item.traceId)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}



