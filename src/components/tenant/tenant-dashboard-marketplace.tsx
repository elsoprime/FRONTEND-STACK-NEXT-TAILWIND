"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  BellRing,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ClipboardCopy,
  LoaderCircle,
  ReceiptText,
  ScanSearch,
  Sparkles,
  UserPlus,
  Users2,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantDashboardInteractionGuide } from "@/components/tenant/dashboard/dashboard-interaction-guide";
import {
  DashboardFeedbackBanner,
  DashboardGridContainer,
  DashboardMetricCard,
  DashboardModuleCard,
  DashboardQuickActionCard,
  DashboardSection,
} from "@/components/tenant/dashboard/dashboard-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAuditActionLabel, formatAuditResourceLabel, formatTraceIdShort } from "@/features/audit/audit-ui-labels";
import { listTenantAuditLogs } from "@/features/audit/audit.service";
import { getBillingPlans } from "@/features/billing/billing.service";
import { getCrmCounters } from "@/features/crm/crm.service";
import { listHrEmployees } from "@/features/hr/hr.service";
import { listInventoryLowStockAlerts } from "@/features/inventory/inventory.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import {
  resolveTenantModuleState,
  type TenantModuleState,
} from "@/features/tenant/tenant-runtime-guards";
import { getTenantSettingsEffective } from "@/features/tenant/tenant-settings.service";
import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";
import { createTenantInvitation } from "@/features/tenant/tenant.service";
import { type MembershipView, type TenantView } from "@/features/tenant/tenant.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type ModuleKey = "inventory" | "crm" | "hr";

type DashboardFeedbackState =
  | { status: "idle" }
  | { status: "success"; message: string; code?: string | null }
  | { status: "warning"; message: string; code: string }
  | { status: "error"; message: string; code: string };

const ACCESS_BLOCKING_CODES = new Set([
  "RBAC_PERMISSION_DENIED",
  "RBAC_ROLE_DENIED",
  "RBAC_PLAN_DENIED",
  "RBAC_MODULE_DENIED",
  "TENANT_OWNER_REQUIRED",
  "TENANT_SUBSCRIPTION_PAYMENT_REQUIRED",
]);
function resolveModuleState(
  tenant: TenantView,
  moduleKey: ModuleKey,
  runtimeState: TenantRuntime | null,
): TenantModuleState {
  if (runtimeState) {
    return resolveTenantModuleState(runtimeState, moduleKey);
  }

  return tenant.activeModuleKeys.includes(moduleKey) ? "active" : "disabled";
}

function resolveUnknownError(error: unknown): { code: string; message: string } {
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

function isBlockedByAccessControl(error: unknown): boolean {
  return error instanceof ApiRequestError && ACCESS_BLOCKING_CODES.has(error.code);
}

function formatAuditTimestamp(value: string): string {
  return formatSpanishLongDate(value);
}

function resolveSeverityClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "border-red-300/85 bg-red-100/65 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200";
    case "warning":
      return "border-amber-300/85 bg-amber-100/65 text-amber-950 dark:border-amber-400/65 dark:bg-amber-500/14 dark:text-amber-100";
    default:
      return "border-accent/45 bg-accent/12 text-foreground";
  }
}

function DashboardMarketplaceContent({
  tenant,
  membership,
}: {
  tenant: TenantView;
  membership: MembershipView;
}) {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const lastTraceId = useSessionStore((state) => state.lastTraceId);
  const tenantId = useTenantStore((state) => state.tenantId);
  const storedRuntime = useTenantStore((state) => state.effectiveRuntime);
  const setEffectiveRuntime = useTenantStore((state) => state.setEffectiveRuntime);
  const runtimeCache = tenantId === tenant.id ? storedRuntime : null;

  const [inviteEmail, setInviteEmail] = useState("");
  const [feedback, setFeedback] = useState<DashboardFeedbackState>({ status: "idle" });
  const [copiedTraceId, setCopiedTraceId] = useState(false);

  const canManageInvites = hasTenantPermission(
    membership.roleKey,
    TENANT_PERMISSION_KEYS.INVITATIONS_CREATE,
  );
  const canManageSettings = hasTenantPermission(
    membership.roleKey,
    TENANT_PERMISSION_KEYS.SETTINGS_UPDATE,
  );

  const runtimeQuery = useQuery({
    queryKey: queryKeys.tenantSettingsEffective(tenant.id),
    queryFn: async () => {
      const response = await getTenantSettingsEffective(tenant.id);
      setLastTraceId(response.traceId);
      setEffectiveRuntime(response.data.settings.runtime ?? null);
      return response.data.settings;
    },
    staleTime: 120_000,
  });

  const runtime = runtimeQuery.data?.runtime ?? runtimeCache;

  const inventoryState = resolveModuleState(tenant, "inventory", runtime);
  const crmState = resolveModuleState(tenant, "crm", runtime);
  const hrState = resolveModuleState(tenant, "hr", runtime);

  const billingPlansQuery = useQuery({
    queryKey: queryKeys.billingPlans(),
    queryFn: async () => {
      const response = await getBillingPlans();
      setLastTraceId(response.traceId);
      return response.data.items;
    },
  });

  const inventoryLowStockQuery = useQuery({
    queryKey: queryKeys.inventoryLowStockAlerts(tenant.id),
    enabled: inventoryState === "active",
    queryFn: async () => {
      const response = await listInventoryLowStockAlerts(tenant.id, { page: 1, limit: 5 });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const crmCountersQuery = useQuery({
    queryKey: queryKeys.crmCounters(tenant.id),
    enabled: crmState === "active",
    queryFn: async () => {
      const response = await getCrmCounters(tenant.id);
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const hrActiveEmployeesQuery = useQuery({
    queryKey: ["tenant", tenant.id, "hr", "employees", "status", "active"],
    enabled: hrState === "active",
    queryFn: async () => {
      const response = await listHrEmployees(tenant.id, { page: 1, limit: 1, status: "active" });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const auditRecentQuery = useQuery({
    queryKey: queryKeys.tenantAuditLogs(tenant.id, "recent"),
    queryFn: async () => {
      const response = await listTenantAuditLogs(tenant.id, { page: 1, limit: 6 });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const auditCriticalQuery = useQuery({
    queryKey: queryKeys.tenantAuditLogs(tenant.id, "critical"),
    queryFn: async () => {
      const response = await listTenantAuditLogs(tenant.id, {
        page: 1,
        limit: 1,
        severity: "critical",
      });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const normalizedEmail = inviteEmail.trim();

      if (normalizedEmail.length === 0) {
        throw new Error("Debes ingresar un email valido para enviar la invitacion.");
      }

      return createTenantInvitation(tenant.id, {
        email: normalizedEmail,
        roleKey: "tenant:member",
      });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setFeedback({
        status: "success",
        message: `Invitacion enviada a ${response.data.invitation.email}.`,
      });
      setInviteEmail("");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFeedback({
          status: "error",
          code: error.code,
          message: resolveTenantErrorMessage(error.code, error.message),
        });
        return;
      }

      setFeedback({
        status: "warning",
        code: "GEN_VALIDATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : resolveTenantErrorMessage("GEN_VALIDATION_ERROR"),
      });
    },
  });

  const tenantPlanId = runtime?.planId ?? tenant.planId;
  const currentPlan = billingPlansQuery.data?.find((plan) => plan.key === tenantPlanId) ?? null;
  const subscriptionStatus = tenantPlanId ? "Activa" : "Sin suscripcion";

  const lowStockAlerts = inventoryLowStockQuery.data?.pagination.total ?? 0;
  const openOpportunities = crmCountersQuery.data?.data.counters.opportunitiesOpen ?? 0;
  const activeEmployees = hrActiveEmployeesQuery.data?.pagination.total ?? 0;
  const criticalEvents = auditCriticalQuery.data?.pagination.total ?? 0;
  const latestDomainCode =
    feedback.status === "warning" || feedback.status === "error" ? feedback.code : null;

  const auditModuleState = auditRecentQuery.error
    ? isBlockedByAccessControl(auditRecentQuery.error)
      ? "restricted"
      : "active"
    : "active";

  const canOpenInventoryAlerts = inventoryState === "active";
  const canOpenAudit = auditModuleState === "active";

  const auditEvents = auditRecentQuery.data?.data.items ?? [];
  const auditError = auditRecentQuery.error ? resolveUnknownError(auditRecentQuery.error) : null;
  const runtimeError = runtimeQuery.error ? resolveUnknownError(runtimeQuery.error) : null;

  const supportEmail =
    runtimeQuery.data?.branding?.supportEmail ?? runtimeQuery.data?.contact?.primaryEmail;
  const supportUrl =
    runtimeQuery.data?.branding?.supportUrl ?? runtimeQuery.data?.contact?.websiteUrl;

  const dependencyCards = useMemo(
    () => [
      {
        label: "Tenant activo",
        value: tenant.name,
        hint: `slug: ${tenant.slug}`,
      },
      {
        label: "Plan vigente",
        value: currentPlan?.name ?? tenantPlanId ?? "Sin plan",
        hint: `Suscripcion: ${subscriptionStatus}`,
      },
      {
        label: "Modulos activos",
        value:
          tenant.activeModuleKeys.length > 0 ? tenant.activeModuleKeys.join(", ") : "sin modulos",
        hint:
          canManageInvites && canManageSettings
            ? "Puede invitar y gestionar plan"
            : "Acciones restringidas por permisos",
      },
    ],
    [
      currentPlan?.name,
      canManageInvites,
      canManageSettings,

      subscriptionStatus,
      tenant.name,
      tenant.slug,
      tenant.activeModuleKeys,
      tenantPlanId,
    ],
  );

  const handleInvite = () => {
    if (!canManageInvites) {
      setFeedback({
        status: "warning",
        code: "RBAC_PERMISSION_DENIED",
        message: resolveTenantErrorMessage("RBAC_PERMISSION_DENIED"),
      });
      return;
    }

    setFeedback({ status: "idle" });
    inviteMutation.mutate();
  };

  const handleCopyTraceId = async () => {
    if (!lastTraceId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(lastTraceId);
      setCopiedTraceId(true);
      setTimeout(() => setCopiedTraceId(false), 1300);
    } catch {
      setFeedback({
        status: "warning",
        code: "GEN_INTERNAL_ERROR",
        message: "No se pudo copiar el traceId automaticamente. Copialo manualmente.",
      });
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1320px] space-y-7 px-4 pb-12 pt-7 sm:px-6 xl:px-2">
      <article className="surface-card reveal-up relative overflow-hidden p-7 sm:p-8 [--reveal-delay:40ms]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary/16 via-accent/10 to-transparent" />
        <div className="pointer-events-none absolute -left-20 -top-16 size-64 rounded-full bg-primary/12 blur-3xl" />

        <div className="relative space-y-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="space-y-3">
              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                Tenant Control Center
              </Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Dashboard tenant
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed dashboard-text-muted sm:text-base">
                  Vista concentrada y simetrica para controlar estado modular, alertas criticas y
                  operaciones del tenant activo sin sobrecarga visual.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link href="/app/tenants/create">
                <Button size="lg" variant="primary">
                  <Building2 className="size-4" />
                  Crear tenant
                </Button>
              </Link>
              <Link href="/app/tenants/select">
                <Button size="lg" variant="secondary">
                  <ArrowRightLeft className="size-4" />
                  Cambiar tenant
                </Button>
              </Link>
              <Link href="/app/settings/tenant">
                <Button size="lg" variant="tertiary">
                  <Wrench className="size-4" />
                  Configuracion
                </Button>
              </Link>
              <Link href="/app/settings/billing">
                <Button size="lg" variant="outline">
                  <ReceiptText className="size-4" />
                  Plan y billing
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {dependencyCards.map((dependency) => (
              <article
                key={dependency.label}
                className="rounded-2xl border border-border/76 bg-white/56 px-4 py-3 shadow-[0_14px_28px_-24px_oklch(0.24_0.02_55/0.22)] dark:bg-card/52"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-foreground/62">
                  {dependency.label}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{dependency.value}</p>
                <p className="text-xs dashboard-text-muted">{dependency.hint}</p>
              </article>
            ))}
          </div>
        </div>
      </article>

      <DashboardSection
        eyebrow="Resumen Principal"
        title="Metricas clave del tenant"
        description="Tarjetas concentradas y simetricas para lectura rapida en cualquier viewport."
        className="reveal-up [--reveal-delay:90ms]"
      >
        <DashboardGridContainer columns={4} className="2xl:gap-6">
          <DashboardMetricCard
            title="Usuarios activos"
            value={hrState === "active" ? String(activeEmployees) : "N/A"}
            hint={
              hrState === "active" ? "Empleados activos en HR" : "Habilita HR para ver actividad"
            }
            icon={Users2}
            tone="accent"
            isLoading={hrState === "active" && hrActiveEmployeesQuery.isLoading}
          />

          <DashboardMetricCard
            title="Plan vigente"
            value={currentPlan?.name ?? tenantPlanId ?? "Sin plan"}
            hint={
              currentPlan
                ? `${currentPlan.allowedModuleKeys.length} modulos permitidos`
                : "Sin aprovisionamiento"
            }
            icon={Sparkles}
            tone="default"
            isLoading={billingPlansQuery.isLoading}
          />

          <DashboardMetricCard
            title="Alertas de stock"
            value={inventoryState === "active" ? String(lowStockAlerts) : "N/A"}
            hint={
              inventoryState === "active" ? "Productos en riesgo de quiebre" : "Inventory no activo"
            }
            icon={BellRing}
            tone={lowStockAlerts > 0 ? "warning" : "success"}
            isLoading={inventoryLowStockQuery.isLoading}
          />

          <DashboardMetricCard
            title="Oportunidades abiertas"
            value={crmState === "active" ? String(openOpportunities) : "N/A"}
            hint={crmState === "active" ? "Pipeline comercial en curso" : "CRM no activo"}
            icon={BriefcaseBusiness}
            tone={openOpportunities > 0 ? "accent" : "default"}
            isLoading={crmCountersQuery.isLoading}
          />
        </DashboardGridContainer>
      </DashboardSection>

      <div className="grid items-start gap-6 xl:auto-rows-fr xl:grid-cols-2">
        <DashboardSection
          eyebrow="Actividades Recientes"
          title="Eventos operativos"
          description="Bloque simetrico con scroll independiente para no romper el ritmo visual."
          className="reveal-up min-h-[450px] [--reveal-delay:140ms]"
          contentClassName="max-h-[350px] space-y-2.5 overflow-y-auto pr-1"
        >
          {auditRecentQuery.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((slot) => (
                <div
                  key={slot}
                  className="h-14 animate-pulse rounded-xl border border-border/70 bg-muted/45"
                />
              ))}
            </div>
          ) : null}

          {!auditRecentQuery.isLoading && auditError ? (
            <DashboardFeedbackBanner
              tone={auditError.code === "RBAC_PERMISSION_DENIED" ? "warning" : "error"}
              title={
                auditError.code === "RBAC_PERMISSION_DENIED"
                  ? "Sin acceso a auditoria"
                  : "Error al cargar eventos"
              }
              description={auditError.message}
              code={auditError.code}
            />
          ) : null}

          {!auditRecentQuery.isLoading && !auditError && auditEvents.length === 0 ? (
            <div className="rounded-2xl border border-border/76 bg-white/56 px-4 py-3 text-sm dashboard-text-muted dark:bg-card/52">
              No hay eventos recientes para este tenant.
            </div>
          ) : null}

          {!auditRecentQuery.isLoading && !auditError && auditEvents.length > 0 ? (
            <ul className="space-y-2">
              {auditEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-2xl border border-border/76 bg-white/56 px-3 py-2.5 dark:bg-card/52"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatAuditActionLabel(event.action)}
                      </p>
                      <p className="text-xs dashboard-text-muted">
                        {formatAuditResourceLabel(event.resource.type, event.resource.label)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                        resolveSeverityClass(event.severity),
                      )}
                    >
                      {event.severity}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs dashboard-text-muted">
                    <span>{formatAuditTimestamp(event.createdAt)}</span>
                    <span className="font-mono" title={event.traceId}>trace: {formatTraceIdShort(event.traceId)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </DashboardSection>

        <DashboardSection
          eyebrow="Senales Criticas"
          title="Stock y oportunidades"
          description="Segundo bloque simetrico para monitoreo rapido de riesgo comercial y operativo."
          className="reveal-up min-h-[450px] [--reveal-delay:190ms]"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-border/76 bg-white/56 p-4 shadow-[0_14px_28px_-24px_oklch(0.24_0.02_55/0.2)] dark:bg-card/52">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Alertas de stock
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {inventoryState === "active" ? lowStockAlerts : "N/A"}
              </p>
              <p className="text-xs dashboard-text-muted">
                {inventoryState === "active"
                  ? "Productos con bajo stock en inventario"
                  : "Inventory no esta activo para este tenant"}
              </p>
            </article>

            <article className="rounded-2xl border border-border/76 bg-white/56 p-4 shadow-[0_14px_28px_-24px_oklch(0.24_0.02_55/0.2)] dark:bg-card/52">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Oportunidades abiertas
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {crmState === "active" ? openOpportunities : "N/A"}
              </p>
              <p className="text-xs dashboard-text-muted">
                {crmState === "active"
                  ? "Pipeline comercial abierto en CRM"
                  : "CRM no esta activo para este tenant"}
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/app/inventory?tab=alerts" className="block">
              <Button
                type="button"
                variant="toolbar"
                className="w-full"
                disabled={!canOpenInventoryAlerts}
              >
                <BellRing className="size-4" />
                Ver alertas de stock
              </Button>
            </Link>
            <Link href="/app/crm/opportunities" className="block">
              <Button
                type="button"
                variant="toolbar"
                className="w-full"
                disabled={crmState !== "active"}
              >
                <BriefcaseBusiness className="size-4" />
                Ver oportunidades
              </Button>
            </Link>
          </div>

          {runtimeError ? (
            <div className="mt-4">
              <DashboardFeedbackBanner
                tone="error"
                title="Dependencia critica de runtime"
                description={runtimeError.message}
                code={runtimeError.code}
              />
            </div>
          ) : null}
        </DashboardSection>
      </div>

      <DashboardSection
        eyebrow="Modulos"
        title="Accesos modulares del tenant"
        description="Tarjetas simetricas por modulo con estado, metrica y rutas de accion."
        className="reveal-up [--reveal-delay:240ms]"
      >
        <DashboardGridContainer columns={2}>
          <DashboardModuleCard
            title="Inventory"
            description="Control de stock y alertas de quiebre para operacion diaria."
            icon={Boxes}
            state={inventoryState}
            metrics={[
              {
                label: "Bajo stock",
                value: inventoryState === "active" ? String(lowStockAlerts) : "N/A",
              },
              { label: "Estado", value: inventoryState === "active" ? "Monitoreado" : "Limitado" },
            ]}
            primaryHref="/app/inventory"
            primaryLabel="Abrir modulo"
            secondaryHref="/app/settings/tenant"
            secondaryLabel="Configurar"
            note={
              inventoryState === "disabled"
                ? "No incluido en el plan actual."
                : inventoryState === "enabled"
                  ? "Habilitado en runtime, pendiente de activacion efectiva."
                  : "Alertas de stock integradas al resumen principal."
            }
            accentClassName="from-primary/35 via-primary/15 to-transparent"
          />

          <DashboardModuleCard
            title="CRM"
            description="Pipeline comercial con foco en oportunidades abiertas."
            icon={BriefcaseBusiness}
            state={crmState}
            metrics={[
              {
                label: "Oportunidades",
                value: crmState === "active" ? String(openOpportunities) : "N/A",
              },
              {
                label: "Estado",
                value: crmState === "active" ? "Operativo" : "Limitado",
              },
            ]}
            primaryHref="/app/crm"
            primaryLabel="Abrir modulo"
            secondaryHref="/app/settings/tenant"
            secondaryLabel="Configurar"
            note={
              crmState === "disabled"
                ? "Modulo no incluido en el plan vigente."
                : crmState === "enabled"
                  ? "Disponible para activacion desde tenant settings."
                  : "Metrica de pipeline sincronizada al dashboard."
            }
            accentClassName="from-accent/40 via-accent/18 to-transparent"
          />

          <DashboardModuleCard
            title="HR"
            description="Seguimiento de empleados activos e indicadores de talento."
            icon={Users2}
            state={hrState}
            metrics={[
              { label: "Activos", value: hrState === "active" ? String(activeEmployees) : "N/A" },
              { label: "Estado", value: hrState === "active" ? "Operativo" : "Limitado" },
            ]}
            primaryHref="/app/hr"
            primaryLabel="Abrir modulo"
            secondaryHref="/app/settings/tenant"
            secondaryLabel="Configurar"
            note={
              hrState === "disabled"
                ? "No incluido en plan o runtime actual."
                : hrState === "enabled"
                  ? "Habilitado, requiere activacion completa."
                  : "Usuarios activos del tenant disponibles en resumen."
            }
            accentClassName="from-emerald-500/30 via-emerald-400/15 to-transparent"
          />

          <DashboardModuleCard
            title="Audit"
            description="Trazabilidad de eventos recientes y criticidad operacional."
            icon={Activity}
            state={auditModuleState}
            metrics={[
              { label: "Recientes", value: String(auditEvents.length) },
              { label: "Criticos", value: String(criticalEvents) },
            ]}
            primaryHref="/app/audit"
            primaryLabel="Abrir auditoria"
            secondaryHref="/app/settings/tenant/effective"
            secondaryLabel="Ver runtime"
            note={
              auditError
                ? `${auditError.message} (${auditError.code})`
                : "Ultimos eventos y severidad visibles desde el dashboard."
            }
            accentClassName="from-slate-500/35 via-slate-400/15 to-transparent"
          />
        </DashboardGridContainer>
      </DashboardSection>

      <DashboardSection
        eyebrow="Acciones Rapidas"
        title="Operaciones inmediatas"
        description="Invitacion, billing y soporte en una fila compacta de uso frecuente."
        className="reveal-up [--reveal-delay:290ms]"
      >
        <DashboardGridContainer columns={3}>
          <DashboardQuickActionCard
            title="Invitar usuario"
            description="Invitacion tenant-scoped con validaciones de negocio y feedback por codigo de error."
            icon={UserPlus}
          >
            <div className="space-y-3">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="usuario@empresa.com"
                aria-label="Email para invitacion tenant"
                className="h-10 rounded-md"
              />
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={handleInvite}
                disabled={inviteMutation.isPending || inviteEmail.trim().length === 0}
              >
                {inviteMutation.isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Enviando invitacion...
                  </>
                ) : (
                  <>
                    Invitar miembro
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </DashboardQuickActionCard>

          <DashboardQuickActionCard
            title="Plan y suscripcion"
            description="Control de provisioning con acceso directo a upgrade o downgrade."
            icon={ReceiptText}
          >
            <div className="space-y-2">
              <article className="rounded-2xl border border-border/76 bg-white/56 px-3 py-2.5 dark:bg-card/52">
                <p className="text-xs dashboard-text-muted">Plan vigente</p>
                <p className="text-sm font-semibold text-foreground">
                  {currentPlan?.name ?? "Sin plan"}
                </p>
              </article>
              <Link href="/app/settings/billing" className="block">
                <Button type="button" size="lg" variant="tertiary" className="w-full">
                  <ReceiptText className="size-4" />
                  Abrir billing
                </Button>
              </Link>
            </div>
          </DashboardQuickActionCard>

          <DashboardQuickActionCard
            title="Soporte y trazabilidad"
            description="Comparte traceId con soporte y abre auditoria cuando exista un incidente."
            icon={ScanSearch}
          >
            <div className="space-y-2">
              <article className="rounded-2xl border border-border/76 bg-white/56 px-3 py-2.5 dark:bg-card/52">
                <p className="text-xs dashboard-text-muted">Ultimo traceId</p>
                <p className="break-all font-mono text-xs text-foreground">
                  {lastTraceId ?? "sin traza"}
                </p>
              </article>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleCopyTraceId()}
                  disabled={!lastTraceId}
                >
                  <ClipboardCopy className="size-4" />
                  {copiedTraceId ? "Copiado" : "Copiar"}
                </Button>
                <Link href="/app/audit" className="block">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={!canOpenAudit}
                  >
                    <Activity className="size-4" />
                    Eventos de auditoria
                  </Button>
                </Link>
              </div>
              {supportUrl ? (
                <a href={supportUrl} target="_blank" rel="noreferrer">
                  <Button type="button" size="lg" variant="tertiary" className="w-full">
                    <ScanSearch className="size-4" />
                    Ir a soporte
                  </Button>
                </a>
              ) : (
                <p className="text-xs dashboard-text-muted">
                  {supportEmail
                    ? `Email soporte: ${supportEmail}`
                    : "Configura un canal de soporte en tenant settings."}
                </p>
              )}
            </div>
          </DashboardQuickActionCard>
        </DashboardGridContainer>

        {feedback.status !== "idle" ? (
          <div className="mt-4">
            <DashboardFeedbackBanner
              tone={
                feedback.status === "success"
                  ? "success"
                  : feedback.status === "warning"
                    ? "warning"
                    : "error"
              }
              title={
                feedback.status === "success"
                  ? "Accion completada"
                  : feedback.status === "warning"
                    ? "Validacion de negocio"
                    : "Error de dominio"
              }
              description={feedback.message}
              code={feedback.status === "success" ? undefined : feedback.code}
            />
          </div>
        ) : null}
      </DashboardSection>

      <TenantDashboardInteractionGuide
        lastDomainCode={latestDomainCode}
        lastTraceId={lastTraceId}
      />
    </section>
  );
}
export function TenantDashboardMarketplace() {
  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <TenantContextGate loadingCopy="Preparando centro de control tenant...">
        {({ tenant, membership }) => (
          <DashboardMarketplaceContent tenant={tenant} membership={membership} />
        )}
      </TenantContextGate>
    </main>
  );
}














