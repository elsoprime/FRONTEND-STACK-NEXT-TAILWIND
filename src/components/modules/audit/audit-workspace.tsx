"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ClipboardList, Settings2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuditOverviewPanel } from "@/components/modules/audit/audit-overview-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { formatAuditActionLabel, formatAuditResourceLabel, formatTraceIdShort } from "@/features/audit/audit-ui-labels";
import { listTenantAuditLogs } from "@/features/audit/audit.service";
import { listTenantMemberships } from "@/features/tenant/tenant.service";
import { auditActorKindSchema, auditSeveritySchema, type AuditLog } from "@/features/audit/audit.schemas";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { cn } from "@/lib/utils";

const SEVERITY_OPTIONS = auditSeveritySchema.options;
const ACTOR_KIND_OPTIONS = auditActorKindSchema.options;

type AuditSeverity = (typeof SEVERITY_OPTIONS)[number];
type AuditActorKind = (typeof ACTOR_KIND_OPTIONS)[number];

type AuditFiltersState = {
  action: string;
  resourceType: string;
  severity: "" | AuditSeverity;
  actorKind: "" | AuditActorKind;
  from: string;
  to: string;
};

type AuditTabKey = "overview" | "events" | "operations";

type AuditTabItem = {
  key: AuditTabKey;
  label: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
};

const AUDIT_TABS: readonly AuditTabItem[] = [
  {
    key: "overview",
    label: "Resumen",
    summary: "Estado general y criticidad",
    icon: Activity,
  },
  {
    key: "events",
    label: "Eventos",
    summary: "Busqueda y filtros avanzados",
    icon: ClipboardList,
  },
  {
    key: "operations",
    label: "Operativa",
    summary: "Flujos de respuesta y mejora",
    icon: Settings2,
  },
] as const;

export function resolveAuditTabKey(value: string | null): AuditTabKey {
  switch (value) {
    case "events":
    case "operations":
    case "overview":
      return value;
    default:
      return "overview";
  }
}

function normalizeFilters(filters: AuditFiltersState) {
  return {
    action: filters.action.trim() || undefined,
    resourceType: filters.resourceType.trim() || undefined,
    severity: filters.severity || undefined,
    actorKind: filters.actorKind || undefined,
    from: filters.from.trim() || undefined,
    to: filters.to.trim() || undefined,
  };
}

function formatTimestamp(value: string) {
  return formatSpanishLongDate(value);
}

type ActorIdentity = {
  primary: string;
  secondary?: string;
};

function resolveAuditActorDisplay(
  actor: AuditLog["actor"],
  membersByUserId: Map<string, { fullName: string; email: string }>,
): ActorIdentity {
  if (actor.kind === "user") {
    const member = membersByUserId.get(actor.userId);
    if (member) {
      return {
        primary: member.fullName,
        secondary: member.email,
      };
    }

    return {
      primary: "Usuario",
      secondary: actor.userId,
    };
  }

  if (actor.kind === "system") {
    return {
      primary: "Sistema",
      secondary: actor.label || actor.systemId,
    };
  }

  return {
    primary: "Desconocido",
    secondary: actor.reason,
  };
}

function resolveSeverityBadge(severity: string): string {
  switch (severity) {
    case "critical":
      return "border-red-300/80 bg-red-100/70 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200";
    case "warning":
      return "border-amber-300/80 bg-amber-100/70 text-amber-900 dark:border-amber-400/55 dark:bg-amber-500/14 dark:text-amber-100";
    default:
      return "border-primary/35 bg-primary/12 text-primary";
  }
}

function buildStateFromParams(params: URLSearchParams): AuditFiltersState {
  const severity = params.get("severity");
  const actorKind = params.get("actorKind");

  return {
    action: params.get("action") ?? "",
    resourceType: params.get("resourceType") ?? "",
    severity: (severity && SEVERITY_OPTIONS.includes(severity as AuditSeverity) ? severity : "") as
      | ""
      | AuditSeverity,
    actorKind: (actorKind && ACTOR_KIND_OPTIONS.includes(actorKind as AuditActorKind)
      ? actorKind
      : "") as "" | AuditActorKind,
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
  };
}

type AuditWorkspaceProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  initialTab?: AuditTabKey;
};

export function AuditWorkspace({
  tenantId,
  setLastTraceId,
  initialTab = "overview",
}: AuditWorkspaceProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AuditTabKey>(initialTab);
  const [pendingFilters, setPendingFilters] = useState<AuditFiltersState>(() =>
    buildStateFromParams(searchParams),
  );
  const [appliedFilters, setAppliedFilters] = useState<AuditFiltersState>(() =>
    buildStateFromParams(searchParams),
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const applyFilters = () => {
    const normalized = normalizeFilters(pendingFilters);
    const params = new URLSearchParams();

    if (normalized.action) params.set("action", normalized.action);
    if (normalized.resourceType) params.set("resourceType", normalized.resourceType);
    if (normalized.severity) params.set("severity", normalized.severity);
    if (normalized.actorKind) params.set("actorKind", normalized.actorKind);
    if (normalized.from) params.set("from", normalized.from);
    if (normalized.to) params.set("to", normalized.to);

    setAppliedFilters(pendingFilters);
    setPage(1);
    router.replace(params.toString().length > 0 ? `/app/audit?${params.toString()}` : "/app/audit");
  };

  const clearFilters = () => {
    const cleared: AuditFiltersState = {
      action: "",
      resourceType: "",
      severity: "",
      actorKind: "",
      from: "",
      to: "",
    };
    setPendingFilters(cleared);
    setAppliedFilters(cleared);
    setPage(1);
    router.replace("/app/audit");
  };

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-xl border-border/90 bg-card/96 p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="label-kicker text-primary/90">Workspace Audit</p>
            <h2 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
              Trazabilidad, filtros y operacion de respuesta
            </h2>
            <p className="max-w-3xl text-sm dashboard-text-muted">
              Consolida visibilidad de eventos, severidad y acciones operativas sin salir del
              contexto del tenant activo.
            </p>
          </div>
        </div>

        <div role="tablist" aria-label="Tabs del modulo audit" className="mt-6 overflow-x-auto">
          <div className="flex min-w-max gap-1.5 border-b border-border/85 px-1">
            {AUDIT_TABS.map((tab) => {
              const active = tab.key === activeTab;

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`audit-panel-${tab.key}`}
                  onClick={() => startTransition(() => setActiveTab(tab.key))}
                  className={cn(
                    "group relative flex min-w-37.5 flex-col gap-1.5 px-5 py-3.5 text-left transition-colors",
                    active
                      ? "rounded-t-xl border-b border-primary bg-white/10 text-primary shadow-lg"
                      : "text-foreground/58 hover:text-foreground",
                  )}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <tab.icon className={cn("size-4", active ? "text-primary" : "text-foreground/45")} />
                    {tab.label}
                  </span>
                  <span className={cn("text-xs text-foreground/60", active ? "font-bold" : "font-extralight")}>
                    {tab.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {activeTab === "overview" ? <AuditOverviewPanel tenantId={tenantId} /> : null}

      {activeTab === "events" ? (
        <AuditEventsTab
          tenantId={tenantId}
          setLastTraceId={setLastTraceId}
          pendingFilters={pendingFilters}
          setPendingFilters={setPendingFilters}
          appliedFilters={appliedFilters}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
        />
      ) : null}

      {activeTab === "operations" ? <AuditOperationsTab /> : null}
    </div>
  );
}

type AuditEventsTabProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  pendingFilters: AuditFiltersState;
  setPendingFilters: (value: AuditFiltersState) => void;
  appliedFilters: AuditFiltersState;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  page: number;
  setPage: (next: number) => void;
  limit: number;
  setLimit: (next: number) => void;
};

function AuditEventsTab({
  tenantId,
  setLastTraceId,
  pendingFilters,
  setPendingFilters,
  appliedFilters,
  onApplyFilters,
  onClearFilters,
  page,
  setPage,
  limit,
  setLimit,
}: AuditEventsTabProps) {
  const normalizedFilters = useMemo(() => normalizeFilters(appliedFilters), [appliedFilters]);

  const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);
  const membersQuery = useQuery({
    queryKey: ["tenant", tenantId, "members", "audit-actors"],
    queryFn: async () => {
      const response = await listTenantMemberships(tenantId, {
        page: 1,
        limit: 200,
      });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const membersByUserId = useMemo(
    () =>
      new Map(
        (membersQuery.data?.data.items ?? []).map((member) => [
          member.userId,
          { fullName: member.fullName, email: member.email },
        ]),
      ),
    [membersQuery.data?.data.items],
  );

  const copyTraceId = async (traceId: string) => {
    try {
      await navigator.clipboard.writeText(traceId);
      setCopiedTraceId(traceId);
      setTimeout(() => setCopiedTraceId((current) => (current === traceId ? null : current)), 1200);
    } catch {
      setCopiedTraceId(null);
    }
  };

  const auditQuery = useQuery({
    queryKey: ["tenant", tenantId, "audit", "filters", normalizedFilters, page, limit],
    queryFn: async () => {
      const response = await listTenantAuditLogs(tenantId, {
        page,
        limit,
        ...normalizedFilters,
      });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  if (auditQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando auditoria..."
        hint="Consultando eventos del tenant activo."
      />
    );
  }

  if (auditQuery.error) {
    const err = auditQuery.error;
    const message =
      err instanceof ApiRequestError
        ? resolveTenantErrorMessage(err.code, err.message)
        : resolveTenantErrorMessage("GEN_INTERNAL_ERROR");

    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        {message}
      </div>
    );
  }

  const logs = auditQuery.data?.data.items ?? [];
  const pagination = auditQuery.data?.pagination;

  return (
    <div id="audit-panel-events" role="tabpanel" className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <p className="text-sm font-semibold">Filtros</p>
        <p className="text-xs dashboard-text-muted">
          Refina eventos por accion, recurso, severidad, actor y ventana temporal.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="field-label">Accion</label>
            <Input
              value={pendingFilters.action}
              onChange={(event) =>
                setPendingFilters({ ...pendingFilters, action: event.target.value })
              }
              placeholder="settings.updated"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Tipo recurso</label>
            <Input
              value={pendingFilters.resourceType}
              onChange={(event) =>
                setPendingFilters({ ...pendingFilters, resourceType: event.target.value })
              }
              placeholder="tenant"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Severidad</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={pendingFilters.severity}
              onChange={(event) =>
                setPendingFilters({
                  ...pendingFilters,
                  severity: event.target.value as "" | AuditSeverity,
                })
              }
            >
              <option value="">Todas</option>
              {SEVERITY_OPTIONS.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="field-label">Actor</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={pendingFilters.actorKind}
              onChange={(event) =>
                setPendingFilters({
                  ...pendingFilters,
                  actorKind: event.target.value as "" | AuditActorKind,
                })
              }
            >
              <option value="">Todos</option>
              {ACTOR_KIND_OPTIONS.map((actorKind) => (
                <option key={actorKind} value={actorKind}>
                  {actorKind}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="field-label">Desde (ISO)</label>
            <Input
              value={pendingFilters.from}
              onChange={(event) =>
                setPendingFilters({ ...pendingFilters, from: event.target.value })
              }
              placeholder="2026-01-01T00:00:00-03:00"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Hasta (ISO)</label>
            <Input
              value={pendingFilters.to}
              onChange={(event) => setPendingFilters({ ...pendingFilters, to: event.target.value })}
              placeholder="2026-12-31T23:59:59-03:00"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={onApplyFilters}>
            Aplicar filtros
          </Button>
          <Button size="sm" variant="outline" onClick={onClearFilters}>
            Limpiar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Eventos registrados</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
              Filas
            </label>
            <select
              className="h-9 rounded-md border border-border/80 bg-background/70 px-2 text-sm"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 30, 50].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm dashboard-text-muted">
            Sin eventos para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/85">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border/80 bg-background/80">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                    Accion
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                    Recurso
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                    Severidad
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                    Actor
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                    Fecha
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                    Trace
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/70 last:border-b-0">
                    <td className="px-3 py-2.5">
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground">{formatAuditActionLabel(log.action)}</p>
                        <p className="font-mono text-[11px] text-foreground/50">{log.action}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-foreground/80">
                      <div className="space-y-0.5">
                        <p>{formatAuditResourceLabel(log.resource.type, log.resource.label)}</p>
                        <p className="font-mono text-[11px] text-foreground/50">{log.resource.type}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em]",
                          resolveSeverityBadge(log.severity),
                        )}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-foreground/80">
                      {(() => {
                        const actorDisplay = resolveAuditActorDisplay(log.actor, membersByUserId);
                        return (
                          <div className="space-y-0.5">
                            <p>{actorDisplay.primary}</p>
                            {actorDisplay.secondary ? (
                              <p className="font-mono text-[11px] text-foreground/50" title={actorDisplay.secondary}>
                                {formatTraceIdShort(actorDisplay.secondary, 10, 6)}
                              </p>
                            ) : null}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5 text-foreground/80">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground/70">
                      <div className="flex items-center gap-2">
                        <span className="font-mono" title={log.traceId}>{formatTraceIdShort(log.traceId)}</span>
                        <button
                          type="button"
                          className="rounded border border-border/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-foreground/70 hover:bg-background/70"
                          onClick={() => void copyTraceId(log.traceId)}
                        >
                          {copiedTraceId === log.traceId ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/80 p-3">
            <p className="text-xs dashboard-text-muted">
              Total: {pagination.total} - Pagina {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AuditOperationsTab() {
  return (
    <div id="audit-panel-operations" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Operativa</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Respuesta y mejora continua
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Define flujos de triage y accion para eventos criticos, con foco en tiempos de respuesta,
          trazabilidad y escalamiento.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AuditOperationCard
          title="Triage de severidad"
          description="Clasifica eventos por impacto y asigna responsables para respuesta en tiempo real."
        />
        <AuditOperationCard
          title="Playbooks de respuesta"
          description="Estandariza acciones para errores recurrentes, permisos y eventos de seguridad."
        />
        <AuditOperationCard
          title="Ciclo de mejora"
          description="Usa patrones de auditoria para ajustar politicas, permisos y controles preventivos."
        />
      </div>
    </div>
  );
}

function AuditOperationCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
      <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
        Audit Ops
      </span>
      <h4 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed dashboard-text-muted">{description}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        Recomendado
        <Sparkles className="size-4" />
      </div>
    </article>
  );
}













