"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { listTenantAuditLogs } from "@/features/audit/audit.service";
import { auditActorKindSchema, auditSeveritySchema } from "@/features/audit/audit.schemas";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { useSessionStore } from "@/store/session-store";

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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function resolveActorLabel(kind: string) {
  switch (kind) {
    case "user":
      return "Usuario";
    case "system":
      return "Sistema";
    default:
      return "Desconocido";
  }
}

function buildStateFromParams(params: URLSearchParams): AuditFiltersState {
  const severity = params.get("severity");
  const actorKind = params.get("actorKind");
  
  return {
    action: params.get("action") ?? "",
    resourceType: params.get("resourceType") ?? "",
    severity: (severity && SEVERITY_OPTIONS.includes(severity as AuditSeverity) ? severity : "") as "" | AuditSeverity,
    actorKind: (actorKind && ACTOR_KIND_OPTIONS.includes(actorKind as AuditActorKind) ? actorKind : "") as "" | AuditActorKind,
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
  };
}

export default function AuditPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [pendingFilters, setPendingFilters] = useState<AuditFiltersState>(() => buildStateFromParams(searchParams));
  const [appliedFilters, setAppliedFilters] = useState<AuditFiltersState>(() => buildStateFromParams(searchParams));

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
    router.replace("/app/audit");
  };

  return (
    <TenantPageShell
      eyebrow="Audit"
      title="Auditoria tenant"
      description="Consulta eventos y trazabilidad operacional del tenant activo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="Audit" config={MODULE_GUARDS.audit}>
            <AuditContent
              tenantId={tenant.id}
              setLastTraceId={setLastTraceId}
              pendingFilters={pendingFilters}
              setPendingFilters={setPendingFilters}
              appliedFilters={appliedFilters}
              onApplyFilters={applyFilters}
              onClearFilters={clearFilters}
            />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type AuditContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  pendingFilters: AuditFiltersState;
  setPendingFilters: (value: AuditFiltersState) => void;
  appliedFilters: AuditFiltersState;
  onApplyFilters: () => void;
  onClearFilters: () => void;
};

function AuditContent({
  tenantId,
  setLastTraceId,
  pendingFilters,
  setPendingFilters,
  appliedFilters,
  onApplyFilters,
  onClearFilters,
}: AuditContentProps) {
  const normalizedFilters = useMemo(() => normalizeFilters(appliedFilters), [appliedFilters]);

  const auditQuery = useQuery({
    queryKey: ["tenant", tenantId, "audit", "filters", normalizedFilters],
    queryFn: async () => {
      const response = await listTenantAuditLogs(tenantId, {
        page: 1,
        limit: 30,
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
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <p className="text-sm font-semibold">Filtros</p>
        <p className="text-xs text-muted-foreground">Refina los eventos por accion, recurso, severidad o actor.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="field-label">Accion</label>
            <Input
              value={pendingFilters.action}
              onChange={(event) => setPendingFilters({ ...pendingFilters, action: event.target.value })}
              placeholder="settings.updated"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Tipo recurso</label>
            <Input
              value={pendingFilters.resourceType}
              onChange={(event) => setPendingFilters({ ...pendingFilters, resourceType: event.target.value })}
              placeholder="tenant"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Severidad</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={pendingFilters.severity}
              onChange={(event) => setPendingFilters({ ...pendingFilters, severity: event.target.value as "" | AuditSeverity })}
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
              onChange={(event) => setPendingFilters({ ...pendingFilters, actorKind: event.target.value as "" | AuditActorKind })}
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
              onChange={(event) => setPendingFilters({ ...pendingFilters, from: event.target.value })}
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Eventos registrados</h2>
          {pagination ? (
            <p className="text-xs text-muted-foreground">
              Total: {pagination.total} � Pagina {pagination.page} de {pagination.totalPages}
            </p>
          ) : null}
        </div>
        {logs.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
            Sin eventos para los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-border/80 bg-background/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.resource.type} {log.resource.label ? `� ${log.resource.label}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {log.severity}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Actor: {resolveActorLabel(log.actor.kind)}</span>
                  <span>{formatTimestamp(log.createdAt)}</span>
                  <span className="font-mono">trace: {log.traceId}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

