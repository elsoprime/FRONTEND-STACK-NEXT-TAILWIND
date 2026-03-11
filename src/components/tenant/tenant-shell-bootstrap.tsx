"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, ShieldAlert, ShieldCheck, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TenantRuntimeSummary } from "@/components/tenant/tenant-runtime-summary";
import { Button } from "@/components/ui/button";
import { bootstrapTenantShell } from "@/features/tenant/tenant-context.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { getTenantSettingsEffective } from "@/features/tenant/tenant-settings.service";
import { ApiRequestError } from "@/lib/api/client";
import { clearPreviousTenantScopedQueries } from "@/lib/query/tenant-cache";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

export function TenantShellBootstrap() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const previousTenantId = useTenantStore((state) => state.tenantId);
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const effectiveRuntime = useTenantStore((state) => state.effectiveRuntime);
  const setActiveTenantContext = useTenantStore((state) => state.setActiveTenantContext);
  const setEffectiveRuntime = useTenantStore((state) => state.setEffectiveRuntime);
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const activeContext = useMemo(
    () =>
      activeTenant && activeMembership
        ? { tenant: activeTenant, membership: activeMembership }
        : null,
    [activeMembership, activeTenant],
  );
  const [bootstrapErrorCode, setBootstrapErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (activeContext) {
      return;
    }

    let isActive = true;

    void bootstrapTenantShell()
      .then((result) => {
        setLastTraceId(result.traceId);

        if (!isActive) {
          return;
        }

        if (result.status === "no_tenants") {
          router.replace("/app/tenants/create");
          return;
        }

        if (result.status === "selection_required") {
          router.replace("/app/tenants/select");
          return;
        }

        if (result.switched) {
          clearPreviousTenantScopedQueries(queryClient, previousTenantId);
        }

        setActiveTenantContext({
          tenant: result.tenant,
          membership: result.membership,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof ApiRequestError) {
          setLastTraceId(error.traceId ?? null);
        }

        if (isActive) {
          setBootstrapErrorCode(
            error instanceof ApiRequestError ? error.code : "GEN_INTERNAL_ERROR",
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    activeContext,
    previousTenantId,
    queryClient,
    router,
    setActiveTenantContext,
    setLastTraceId,
  ]);

  const runtimeQuery = useQuery({
    queryKey: activeContext
      ? queryKeys.tenantSettingsEffective(activeContext.tenant.id)
      : ["tenant", "runtime", "inactive"],
    enabled: Boolean(activeContext && !effectiveRuntime),
    queryFn: async () => {
      const response = await getTenantSettingsEffective(activeContext!.tenant.id);
      setLastTraceId(response.traceId);
      setEffectiveRuntime(response.data.settings.runtime ?? null);
      return response.data.settings;
    },
  });

  if (!activeContext && !bootstrapErrorCode) {
    return (
      <div className="mt-8 inline-flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        <LoaderCircle className="size-4 animate-spin" />
        Resolviendo contexto tenant...
      </div>
    );
  }

  if (bootstrapErrorCode) {
    return (
      <article className="mt-8 rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-4" />
          <p className="text-sm font-semibold">{resolveTenantErrorMessage(bootstrapErrorCode)}</p>
        </div>
        <div className="mt-4 flex gap-3">
          <Button type="button" onClick={() => router.refresh()}>
            Reintentar
          </Button>
          <Button type="button" variant="outline" onClick={() => router.replace("/logout")}>
            Cerrar sesion
          </Button>
        </div>
      </article>
    );
  }

  if (!activeContext) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 size-5 text-blue-700 dark:text-blue-400" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{activeContext.tenant.name}</h2>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <ShieldCheck className="mr-1 inline size-3" />
                Contexto activo
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              slug: <span className="font-mono">{activeContext.tenant.slug}</span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rol actual: <span className="font-semibold">{activeContext.membership.roleKey}</span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Plan asignado:{" "}
              <span className="font-semibold">
                {activeContext.tenant.planId ?? "sin plan asignado"}
              </span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Modulos activos:{" "}
              <span className="font-semibold">
                {activeContext.tenant.activeModuleKeys.length > 0
                  ? activeContext.tenant.activeModuleKeys.join(", ")
                  : "sin modulos activos"}
              </span>
            </p>
          </div>
        </div>
      </article>

      <TenantRuntimeSummary
        runtime={effectiveRuntime ?? runtimeQuery.data?.runtime ?? null}
        isLoading={runtimeQuery.isLoading}
        errorMessage={
          runtimeQuery.error instanceof ApiRequestError
            ? resolveTenantErrorMessage(runtimeQuery.error.code)
            : runtimeQuery.error
              ? resolveTenantErrorMessage("GEN_INTERNAL_ERROR")
              : null
        }
        description="Runtime cargado desde `tenant/settings/effective` para el tenant activo del shell."
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/tenants/select"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
        >
          Cambiar tenant activo
        </Link>
        <Link
          href="/app/tenants/create"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
        >
          Crear otro tenant
        </Link>
        <Link
          href="/app/settings/tenant"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
        >
          Tenant settings
        </Link>
        <Link
          href="/app/settings/billing"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
        >
          Billing y planes
        </Link>
        <Link
          href="/app/settings/tenant/effective"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
        >
          Runtime efectivo
        </Link>
        <Link
          href="/logout"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
        >
          Cerrar sesion
        </Link>
      </div>
    </div>
  );
}
