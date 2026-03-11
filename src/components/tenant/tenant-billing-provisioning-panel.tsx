"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleSlash,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveBillingErrorMessage } from "@/features/billing/error-code-map";
import {
  assignTenantSubscription,
  cancelTenantSubscription,
  createCheckoutSession,
  getBillingPlans,
} from "@/features/billing/billing.service";
import {
  type BillingCheckoutSession,
  type TenantSubscriptionData,
} from "@/features/billing/billing.schemas";
import { getTenantSettingsEffective } from "@/features/tenant/tenant-settings.service";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { invalidateTenantRuntimeQueries } from "@/lib/query/tenant-cache";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type TenantBillingProvisioningPanelProps = {
  tenantId: string;
  tenantName: string;
};

type ViewState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function formatModules(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "sin modulos";
}

function resolvePlanActionLabel(
  currentPlanId: string | null,
  selectedPlanId: string | null,
): string {
  if (!selectedPlanId) {
    return "Selecciona un plan";
  }

  if (currentPlanId === selectedPlanId) {
    return "Reasignar plan actual";
  }

  return "Asignar plan al tenant";
}

export function TenantBillingProvisioningPanel({
  tenantId,
  tenantName,
}: TenantBillingProvisioningPanelProps) {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const effectiveRuntime = useTenantStore((state) => state.effectiveRuntime);
  const setActiveTenantContext = useTenantStore((state) => state.setActiveTenantContext);
  const setEffectiveRuntime = useTenantStore((state) => state.setEffectiveRuntime);

  const [selectedPlanIdOverride, setSelectedPlanIdOverride] = useState<string | null>(null);
  const [latestCheckoutSession, setLatestCheckoutSession] = useState<BillingCheckoutSession | null>(
    null,
  );
  const [viewState, setViewState] = useState<ViewState>({ status: "idle" });

  const plansQuery = useQuery({
    queryKey: queryKeys.billingPlans(),
    queryFn: async () => {
      const response = await getBillingPlans();
      setLastTraceId(response.traceId);
      return response.data.items;
    },
  });

  const currentPlanId = useMemo(
    () => effectiveRuntime?.planId ?? activeTenant?.planId ?? null,
    [activeTenant?.planId, effectiveRuntime?.planId],
  );

  const defaultSelectedPlanId = useMemo(() => {
    if (!plansQuery.data || plansQuery.data.length === 0) {
      return null;
    }

    const matchedCurrentPlan = currentPlanId
      ? plansQuery.data.find((plan) => plan.key === currentPlanId)
      : null;

    return matchedCurrentPlan?.key ?? plansQuery.data[0]?.key ?? null;
  }, [currentPlanId, plansQuery.data]);

  const selectedPlanId = selectedPlanIdOverride ?? defaultSelectedPlanId;

  async function refreshTenantRuntime(): Promise<void> {
    await invalidateTenantRuntimeQueries(queryClient, tenantId);

    const effectiveResponse = await getTenantSettingsEffective(tenantId);
    setLastTraceId(effectiveResponse.traceId);
    queryClient.setQueryData(
      queryKeys.tenantSettingsEffective(tenantId),
      effectiveResponse.data.settings,
    );
    setEffectiveRuntime(effectiveResponse.data.settings.runtime ?? null);
  }

  function syncActiveTenantState(nextTenant: TenantSubscriptionData["tenant"]): void {
    if (!activeMembership) {
      return;
    }

    if (activeTenant?.id !== nextTenant.id) {
      return;
    }

    setActiveTenantContext({
      tenant: nextTenant,
      membership: activeMembership,
      effectiveRuntime,
    });
  }

  function resolveUnknownErrorMessage(error: unknown): string {
    if (error instanceof ApiRequestError) {
      setLastTraceId(error.traceId ?? null);
      return resolveBillingErrorMessage(error.code, error.message);
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return resolveBillingErrorMessage("GEN_INTERNAL_ERROR");
  }

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) {
        throw new Error("Debes seleccionar un plan antes de asignarlo.");
      }

      return assignTenantSubscription(tenantId, { planId: selectedPlanId });
    },
    onSuccess: async (response) => {
      setLastTraceId(response.traceId);
      syncActiveTenantState(response.data.tenant);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tenantMine() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tenantSubscription(tenantId) }),
      ]);
      await refreshTenantRuntime();
      setViewState({
        status: "success",
        message: `Plan ${response.data.subscription.planId ?? "sin plan"} aplicado correctamente.`,
      });
    },
    onError: (error: unknown) => {
      setViewState({
        status: "error",
        message: resolveUnknownErrorMessage(error),
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => cancelTenantSubscription(tenantId),
    onSuccess: async (response) => {
      setLastTraceId(response.traceId);
      syncActiveTenantState(response.data.tenant);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tenantMine() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tenantSubscription(tenantId) }),
      ]);
      await refreshTenantRuntime();
      setViewState({
        status: "success",
        message: "Suscripcion cancelada. El runtime efectivo se actualizo para este tenant.",
      });
    },
    onError: (error: unknown) => {
      setViewState({
        status: "error",
        message: resolveUnknownErrorMessage(error),
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) {
        throw new Error("Debes seleccionar un plan antes de iniciar checkout.");
      }

      return createCheckoutSession(tenantId, {
        planId: selectedPlanId,
        provider: "simulated",
      });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setLatestCheckoutSession(response.data.checkoutSession);
      setViewState({
        status: "success",
        message:
          "Checkout simulado creado. Procesa el webhook para completar pending -> paid -> activated.",
      });
    },
    onError: (error: unknown) => {
      setViewState({
        status: "error",
        message: resolveUnknownErrorMessage(error),
      });
    },
  });

  const selectedPlan = plansQuery.data?.find((plan) => plan.key === selectedPlanId) ?? null;
  const isWorking =
    assignMutation.isPending || cancelMutation.isPending || checkoutMutation.isPending;

  return (
    <div className="space-y-6">
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            Aprovisionamiento
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Billing y plan del tenant</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Selecciona un plan para <span className="font-semibold">{tenantName}</span>, aplica
            suscripcion directa o inicia checkout en modo simulado.
          </p>
        </div>
      </article>

      {plansQuery.isLoading ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <LoaderCircle className="size-4 animate-spin" />
            Cargando catalogo de planes...
          </div>
        </div>
      ) : null}

      {plansQuery.error ? (
        <article className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4" />
            <p className="text-sm font-semibold">{resolveUnknownErrorMessage(plansQuery.error)}</p>
          </div>
        </article>
      ) : null}

      {plansQuery.data && plansQuery.data.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {plansQuery.data.map((plan) => {
            const isCurrent = currentPlanId === plan.key;
            const isSelected = selectedPlanId === plan.key;

            return (
              <button
                key={plan.key}
                type="button"
                className={`rounded-xl border p-5 text-left transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/70 dark:border-blue-500/50 dark:bg-blue-500/10"
                    : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900"
                }`}
                onClick={() => setSelectedPlanIdOverride(plan.key)}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {plan.name}
                  </h3>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <ShieldCheck className="size-3" />
                      Activo
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {plan.description}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Modulos permitidos
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {formatModules(plan.allowedModuleKeys)}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedPlan ? (
        <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              type="button"
              size="lg"
              className="h-11 rounded-md"
              disabled={isWorking || !selectedPlanId}
              onClick={() => {
                setViewState({ status: "idle" });
                assignMutation.mutate();
              }}
            >
              {assignMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Aplicando...
                </span>
              ) : (
                resolvePlanActionLabel(currentPlanId, selectedPlanId)
              )}
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-11 rounded-md"
              disabled={isWorking || !selectedPlanId}
              onClick={() => {
                setViewState({ status: "idle" });
                checkoutMutation.mutate();
              }}
            >
              {checkoutMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Creando checkout...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="size-4" />
                  Crear checkout simulado
                </span>
              )}
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-11 rounded-md"
              disabled={isWorking || currentPlanId === null}
              onClick={() => {
                setViewState({ status: "idle" });
                cancelMutation.mutate();
              }}
            >
              {cancelMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Cancelando...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CircleSlash className="size-4" />
                  Cancelar suscripcion
                </span>
              )}
            </Button>
          </div>
        </article>
      ) : null}

      {latestCheckoutSession ? (
        <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="size-4" />
            Ultima sesion de checkout
          </div>
          <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <p>
              Provider session:{" "}
              <span className="font-mono">{latestCheckoutSession.providerSessionId}</span>
            </p>
            <p>
              Estado: <span className="font-semibold">{latestCheckoutSession.status}</span>
            </p>
            <p>
              Expira en: <span className="font-semibold">{latestCheckoutSession.expiresAt}</span>
            </p>
          </div>
          <a
            href={latestCheckoutSession.checkoutUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
          >
            Abrir checkout URL
            <ExternalLink className="size-4" />
          </a>
        </article>
      ) : null}

      {viewState.status === "success" ? (
        <article className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4" />
            <p className="text-sm font-semibold">{viewState.message}</p>
          </div>
        </article>
      ) : null}

      {viewState.status === "error" ? (
        <article className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4" />
            <p className="text-sm font-semibold">{viewState.message}</p>
          </div>
        </article>
      ) : null}
    </div>
  );
}
