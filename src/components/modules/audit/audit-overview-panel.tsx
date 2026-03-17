"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { listTenantAuditLogs } from "@/features/audit/audit.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { cn } from "@/lib/utils";

type AuditOverviewPanelProps = {
  tenantId: string;
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

function formatAction(action: string): string {
  const normalized = action.replace(/[._:]/g, " ").replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return "Evento";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function AuditOverviewPanel({ tenantId }: AuditOverviewPanelProps) {
  const recentQuery = useQuery({
    queryKey: queryKeys.tenantAuditLogs(tenantId, "recent"),
    queryFn: async () => listTenantAuditLogs(tenantId, { page: 1, limit: 12 }),
  });

  const criticalQuery = useQuery({
    queryKey: queryKeys.tenantAuditLogs(tenantId, "critical"),
    queryFn: async () => listTenantAuditLogs(tenantId, { page: 1, limit: 1, severity: "critical" }),
  });

  if (recentQuery.isLoading || criticalQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-6"
        label="Cargando auditoria del tenant..."
        hint="Sincronizando eventos recientes y criticidad operacional."
      />
    );
  }

  const firstError = recentQuery.error ?? criticalQuery.error;

  if (firstError) {
    const { code, message } = resolveError(firstError);

    return (
      <article className="mt-6 rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        <p className="text-sm font-semibold">{message}</p>
        <p className="mt-1 text-xs">Codigo: {code}</p>
      </article>
    );
  }

  const items = recentQuery.data?.data.items ?? [];
  const totalRecent = recentQuery.data?.pagination.total ?? items.length;
  const criticalCount = criticalQuery.data?.pagination.total ?? 0;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="surface-card surface-card-hover rounded-xl border-border/85 bg-card/88 p-4">
          <div className="flex items-center gap-3">
            <Activity className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Eventos registrados
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{totalRecent}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl border-border/85 bg-card/88 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-4 text-red-300" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Eventos criticos
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{criticalCount}</p>
        </article>
      </div>

      <article className="surface-card rounded-xl border-border/85 bg-card/88 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Actividad reciente
        </h3>

        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Sin eventos recientes para mostrar.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border/85 bg-background/68 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{formatAction(item.action)}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.resource.type}
                      {item.resource.label ? ` - ${item.resource.label}` : ""}
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
                  <span className="font-mono">trace: {item.traceId}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
