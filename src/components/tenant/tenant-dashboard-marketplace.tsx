"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  BriefcaseBusiness,
  LoaderCircle,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCrmCounters } from "@/features/crm/crm.service";
import { listHrEmployees } from "@/features/hr/hr.service";
import {
  listInventoryCategories,
  listInventoryItems,
  listInventoryLowStockAlerts,
} from "@/features/inventory/inventory.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import {
  resolveTenantModuleState,
  type TenantModuleState,
} from "@/features/tenant/tenant-runtime-guards";
import { getTenantSettingsEffective } from "@/features/tenant/tenant-settings.service";
import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";
import { type MembershipView, type TenantView } from "@/features/tenant/tenant.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type ModuleKey = "inventory" | "crm" | "hr";

type ModuleCatalogItem = {
  key: ModuleKey;
  title: string;
  description: string;
  href: string;
  illustrationSrc: string;
  icon: React.ElementType;
  accentClassName: string;
  stateHintEnabled: string;
  stateHintDisabled: string;
  stats: [string, string, string];
};

const MODULE_CATALOG: ReadonlyArray<ModuleCatalogItem> = [
  {
    key: "inventory",
    title: "Inventory",
    description: "Control de stock, categorias y alertas operativas para el tenant activo.",
    href: "/app/modules/inventory",
    illustrationSrc: "/inventory-module.svg",
    icon: Boxes,
    accentClassName: "from-primary/35 via-primary/15 to-transparent",
    stateHintEnabled: "Disponible para activar desde Tenant Settings.",
    stateHintDisabled: "Este modulo no esta incluido en el plan actual.",
    stats: ["Categorias", "Items", "Bajo stock"],
  },
  {
    key: "crm",
    title: "CRM",
    description: "Pipeline comercial, contactos y oportunidades en un flujo unificado.",
    href: "/app/modules/crm",
    illustrationSrc: "/crm-module.svg",
    icon: BriefcaseBusiness,
    accentClassName: "from-accent/40 via-accent/18 to-transparent",
    stateHintEnabled: "Disponible para activar desde Tenant Settings.",
    stateHintDisabled: "Este modulo no esta incluido en el plan actual.",
    stats: ["Contactos", "Organizaciones", "Oportunidades"],
  },
  {
    key: "hr",
    title: "HR",
    description: "Gestion de empleados y estructura de talento del tenant actual.",
    href: "/app/modules/hr",
    illustrationSrc: "/hr-module.svg",
    icon: Users,
    accentClassName: "from-emerald-500/30 via-emerald-400/15 to-transparent",
    stateHintEnabled: "Disponible para activar desde Tenant Settings.",
    stateHintDisabled: "Este modulo no esta incluido en el plan actual.",
    stats: ["Total", "Activos", "Inactivos"],
  },
];

const MODULE_STATE_COPY: Record<TenantModuleState, string> = {
  active: "Activo",
  enabled: "Habilitado",
  disabled: "No disponible",
};

const MODULE_STATE_BADGE_CLASSNAME: Record<TenantModuleState, string> = {
  active:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  enabled:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  disabled: "border-border bg-card/80 text-muted-foreground",
};

function resolveModuleState(
  tenant: TenantView,
  moduleKey: ModuleKey,
  runtimeState: TenantRuntime | null | undefined,
): TenantModuleState {
  if (runtimeState) {
    return resolveTenantModuleState(runtimeState, moduleKey);
  }

  return tenant.activeModuleKeys.includes(moduleKey) ? "active" : "disabled";
}

function resolveUnknownError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return resolveTenantErrorMessage(error.code, error.message);
  }

  return resolveTenantErrorMessage("GEN_INTERNAL_ERROR");
}

function ModuleMetrics({
  state,
  labels,
  values,
  isLoading,
  error,
  enabledHint,
  disabledHint,
}: {
  state: TenantModuleState;
  labels: [string, string, string];
  values: [number, number, number];
  isLoading: boolean;
  error: unknown;
  enabledHint: string;
  disabledHint: string;
}) {
  if (state !== "active") {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-border/80 bg-background/70 px-3 py-3 text-sm text-muted-foreground">
        {state === "enabled" ? enabledHint : disabledHint}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="rounded-lg border border-border/80 bg-background/70 p-2.5">
            <div className="h-3 w-14 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-5 w-10 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
        {resolveUnknownError(error)}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {labels.map((label, index) => (
        <div
          key={label}
          className="rounded-lg border border-border/80 bg-background/75 p-2.5 transition-colors group-hover:border-primary/30"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">{values[index]}</p>
        </div>
      ))}
    </div>
  );
}

function DashboardMarketplaceContent({
  tenant,
  membership,
}: {
  tenant: TenantView;
  membership: MembershipView;
}) {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const tenantId = useTenantStore((state) => state.tenantId);
  const effectiveRuntime = useTenantStore((state) => state.effectiveRuntime);
  const setEffectiveRuntime = useTenantStore((state) => state.setEffectiveRuntime);

  const storedRuntime = tenantId === tenant.id ? effectiveRuntime : null;

  const runtimeQuery = useQuery({
    queryKey: queryKeys.tenantSettingsEffective(tenant.id),
    queryFn: async () => {
      const response = await getTenantSettingsEffective(tenant.id);
      setLastTraceId(response.traceId);
      const runtime = response.data.settings.runtime ?? null;
      setEffectiveRuntime(runtime);
      return runtime;
    },
    initialData: storedRuntime ?? undefined,
    staleTime: 120_000,
  });

  const runtime = runtimeQuery.data ?? storedRuntime;

  const moduleState = useMemo(
    () => ({
      inventory: resolveModuleState(tenant, "inventory", runtime),
      crm: resolveModuleState(tenant, "crm", runtime),
      hr: resolveModuleState(tenant, "hr", runtime),
    }),
    [runtime, tenant],
  );

  const inventoryCategoriesQuery = useQuery({
    queryKey: queryKeys.inventoryCategories(tenant.id),
    enabled: moduleState.inventory === "active",
    queryFn: async () => {
      const response = await listInventoryCategories(tenant.id, { page: 1, limit: 20 });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const inventoryItemsQuery = useQuery({
    queryKey: queryKeys.inventoryItems(tenant.id),
    enabled: moduleState.inventory === "active",
    queryFn: async () => {
      const response = await listInventoryItems(tenant.id, { page: 1, limit: 20 });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const inventoryLowStockQuery = useQuery({
    queryKey: queryKeys.inventoryLowStockAlerts(tenant.id),
    enabled: moduleState.inventory === "active",
    queryFn: async () => {
      const response = await listInventoryLowStockAlerts(tenant.id, { page: 1, limit: 5 });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const crmCountersQuery = useQuery({
    queryKey: queryKeys.crmCounters(tenant.id),
    enabled: moduleState.crm === "active",
    queryFn: async () => {
      const response = await getCrmCounters(tenant.id);
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const hrEmployeesQuery = useQuery({
    queryKey: queryKeys.hrEmployees(tenant.id),
    enabled: moduleState.hr === "active",
    queryFn: async () => {
      const response = await listHrEmployees(tenant.id, { page: 1, limit: 20 });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const hrActiveEmployeesQuery = useQuery({
    queryKey: ["tenant", tenant.id, "hr", "employees", "status", "active"],
    enabled: moduleState.hr === "active",
    queryFn: async () => {
      const response = await listHrEmployees(tenant.id, { page: 1, limit: 1, status: "active" });
      setLastTraceId(response.traceId);
      return response;
    },
  });

  const inventoryError =
    inventoryCategoriesQuery.error ?? inventoryItemsQuery.error ?? inventoryLowStockQuery.error;
  const hrError = hrEmployeesQuery.error ?? hrActiveEmployeesQuery.error;

  const inventoryValues: [number, number, number] = [
    inventoryCategoriesQuery.data?.pagination.total ?? 0,
    inventoryItemsQuery.data?.pagination.total ?? 0,
    inventoryLowStockQuery.data?.pagination.total ?? 0,
  ];

  const crmCounters = crmCountersQuery.data?.data.counters;
  const crmValues: [number, number, number] = [
    crmCounters?.contactsActive ?? 0,
    crmCounters?.organizationsActive ?? 0,
    crmCounters?.opportunitiesOpen ?? 0,
  ];

  const hrTotal = hrEmployeesQuery.data?.pagination.total ?? 0;
  const hrActive = hrActiveEmployeesQuery.data?.pagination.total ?? 0;
  const hrValues: [number, number, number] = [hrTotal, hrActive, Math.max(hrTotal - hrActive, 0)];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <article className="surface-card relative overflow-hidden p-6 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/18 via-accent/15 to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-primary/12 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="border-primary/25 bg-primary/10 text-primary dark:border-primary/35"
            >
              Tenant Dashboard
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Marketplace de modulos
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Gestiona <span className="font-semibold text-foreground">{tenant.name}</span> desde un
              tablero vivo con estado de runtime, acceso por modulo y senal operativa en tiempo
              real.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/75 px-3 py-1 text-xs font-semibold text-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Plan: {runtime?.planId ?? tenant.planId ?? "sin plan"}
              </span>
              <span className="inline-flex rounded-full border border-border/80 bg-background/75 px-3 py-1 text-xs font-semibold text-foreground">
                Rol: {membership.roleKey}
              </span>
              <span className="inline-flex rounded-full border border-border/80 bg-background/75 px-3 py-1 text-xs font-semibold text-foreground">
                Modulos activos: {tenant.activeModuleKeys.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/app/settings/tenant">
              <Button size="sm" className="rounded-lg">
                <Settings2 className="size-4" />
                Tenant settings
              </Button>
            </Link>
            <Link href="/app/settings/billing">
              <Button size="sm" variant="outline" className="rounded-lg">
                Gestionar plan
              </Button>
            </Link>
            <Link href="/app/tenants/select">
              <Button size="sm" variant="ghost" className="rounded-lg">
                Cambiar tenant
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {runtimeQuery.isLoading && !storedRuntime ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <LoaderCircle className="size-4 animate-spin" />
          Sincronizando runtime efectivo del tenant...
        </div>
      ) : null}

      {runtimeQuery.error ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {resolveUnknownError(runtimeQuery.error)}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {MODULE_CATALOG.map((module) => {
          const state = moduleState[module.key];
          const metrics =
            module.key === "inventory"
              ? {
                  values: inventoryValues,
                  isLoading:
                    inventoryCategoriesQuery.isLoading ||
                    inventoryItemsQuery.isLoading ||
                    inventoryLowStockQuery.isLoading,
                  error: inventoryError,
                }
              : module.key === "crm"
                ? {
                    values: crmValues,
                    isLoading: crmCountersQuery.isLoading,
                    error: crmCountersQuery.error,
                  }
                : {
                    values: hrValues,
                    isLoading: hrEmployeesQuery.isLoading || hrActiveEmployeesQuery.isLoading,
                    error: hrError,
                  };

          const Icon = module.icon;
          const actionHref =
            state === "active"
              ? module.href
              : state === "enabled"
                ? "/app/settings/tenant"
                : "/app/settings/billing";
          const actionCopy =
            state === "active"
              ? "Abrir modulo"
              : state === "enabled"
                ? "Activar modulo"
                : "Ver plan";

          return (
            <article
              key={module.key}
              className="surface-card surface-card-hover group relative isolate overflow-hidden p-5"
            >
              {state === "disabled" ? (
                <div className="pointer-events-none absolute inset-0 z-0">
                  <div className="absolute inset-y-0 right-0 w-3/4">
                    <Image
                      src={module.illustrationSrc}
                      alt=""
                      fill
                      aria-hidden
                      sizes="(max-width: 1024px) 70vw, 30vw"
                      className="object-cover object-right opacity-18 saturate-80"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-card/96 via-card/92 via-60% to-card/84" />
                  <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-primary/12 via-primary/6 to-transparent" />
                </div>
              ) : null}

              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                  module.accentClassName,
                )}
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                      MODULE_STATE_BADGE_CLASSNAME[state],
                    )}
                  >
                    {MODULE_STATE_COPY[state]}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                  {module.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {module.description}
                </p>

                <ModuleMetrics
                  state={state}
                  labels={module.stats}
                  values={metrics.values}
                  isLoading={metrics.isLoading}
                  error={metrics.error}
                  enabledHint={module.stateHintEnabled}
                  disabledHint={module.stateHintDisabled}
                />

                <div className="mt-5 flex items-center gap-2">
                  <Link href={actionHref}>
                    <Button size="sm" className="rounded-lg">
                      {actionCopy}
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <Link href="/app/settings/tenant">
                    <Button size="sm" variant="outline" className="rounded-lg">
                      Configurar
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function TenantDashboardMarketplace() {
  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <TenantContextGate loadingCopy="Preparando tu dashboard principal...">
        {({ tenant, membership }) => (
          <DashboardMarketplaceContent tenant={tenant} membership={membership} />
        )}
      </TenantContextGate>
    </main>
  );
}
