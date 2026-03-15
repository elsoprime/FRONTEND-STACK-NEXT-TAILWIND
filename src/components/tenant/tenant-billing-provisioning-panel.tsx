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
import { getMyTenantMemberships } from "@/features/tenant/tenant.service";
import { getTenantSettingsEffective } from "@/features/tenant/tenant-settings.service";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { invalidateTenantRuntimeQueries } from "@/lib/query/tenant-cache";
import { cn } from "@/lib/utils";
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
  const hasCheckoutSession = Boolean(latestCheckoutSession?.id);
  const isSelectedPlanActivated = Boolean(selectedPlanId && currentPlanId === selectedPlanId);
  const activationDetectedAfterCheckout = hasCheckoutSession && isSelectedPlanActivated;

  async function refreshTenantRuntime(): Promise<string | null> {
    await invalidateTenantRuntimeQueries(queryClient, tenantId);

    const effectiveResponse = await getTenantSettingsEffective(tenantId);
    setLastTraceId(effectiveResponse.traceId);
    queryClient.setQueryData(
      queryKeys.tenantSettingsEffective(tenantId),
      effectiveResponse.data.settings,
    );
    const nextRuntime = effectiveResponse.data.settings.runtime ?? null;
    setEffectiveRuntime(nextRuntime);
    return nextRuntime?.planId ?? null;
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

  const verifyActivationMutation = useMutation({
    mutationFn: async () => {
      const membershipsResponse = await getMyTenantMemberships();
      setLastTraceId(membershipsResponse.traceId);

      const currentMembership = membershipsResponse.data.items.find((item) => item.tenant.id === tenantId);
      if (currentMembership) {
        setActiveTenantContext({
          tenant: currentMembership.tenant,
          membership: currentMembership.membership,
          effectiveRuntime,
        });
      }

      const runtimePlanId = await refreshTenantRuntime();
      return runtimePlanId;
    },
    onSuccess: (runtimePlanId) => {
      if (selectedPlanId && runtimePlanId === selectedPlanId) {
        setViewState({
          status: "success",
          message: `Pago confirmado y plan ${selectedPlanId} activo en runtime.`,
        });
        return;
      }

      setViewState({
        status: "error",
        message:
          "Aun no se confirma la activacion del plan. Completa el pago en checkout y vuelve a verificar.",
      });
    },
    onError: (error: unknown) => {
      setViewState({
        status: "error",
        message: resolveUnknownErrorMessage(error),
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) {
        throw new Error("Debes seleccionar un plan antes de asignarlo.");
      }

      if (!latestCheckoutSession?.id) {
        throw new Error("Debes crear una sesion de checkout antes de asignar el plan.");
      }

      if (latestCheckoutSession.planId !== selectedPlanId) {
        throw new Error("La sesion de checkout no coincide con el plan seleccionado.");
      }

      return assignTenantSubscription(tenantId, {
        planId: selectedPlanId,
        checkoutSessionId: latestCheckoutSession.id,
      });
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
      setLatestCheckoutSession(null);
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
          "Checkout creado. Completa el pago en la URL, luego confirma la activacion del plan.",
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
    assignMutation.isPending ||
    cancelMutation.isPending ||
    checkoutMutation.isPending ||
    verifyActivationMutation.isPending;
  const canAssignSelectedPlan =
    Boolean(selectedPlanId) &&
    Boolean(latestCheckoutSession?.id) &&
    latestCheckoutSession?.planId === selectedPlanId;
  const stepSummaries = [
    {
      label: "1. Seleccionar plan",
      description: selectedPlanId ? `Plan elegido: ${selectedPlanId}` : "Selecciona un plan disponible",
      done: Boolean(selectedPlanId),
    },
    {
      label: "2. Iniciar checkout",
      description: hasCheckoutSession
        ? `Sesion ${latestCheckoutSession?.providerSessionId} en estado ${latestCheckoutSession?.status}`
        : "Crea sesion de checkout para comenzar el pago",
      done: hasCheckoutSession,
    },
    {
      label: "3. Confirmar activacion",
      description: isSelectedPlanActivated
        ? "Plan activo en tenant y runtime efectivo actualizado"
        : "Tras pagar, usa confirmar/validar para cerrar la activacion",
      done: isSelectedPlanActivated,
    },
  ] as const;

  return (
    <div className="reveal-up space-y-6 [--reveal-delay:60ms]">
      <article className="surface-card border-border/85 bg-card/88 p-5">
        <div className="space-y-2">
          <p className="label-kicker text-primary/90">Aprovisionamiento</p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Billing y plan del tenant</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Selecciona un plan para <span className="font-semibold text-foreground">{tenantName}</span>, aplica
            suscripcion directa o inicia checkout en modo simulado.
          </p>
        </div>
      </article>

      {plansQuery.isLoading ? (
        <div className="rounded-xl border border-primary/35 bg-primary/14 p-5 text-primary">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <LoaderCircle className="size-4 animate-spin" />
            Cargando catalogo de planes...
          </div>
        </div>
      ) : null}

      {plansQuery.error ? (
        <article className="rounded-xl border border-destructive/45 bg-destructive/14 p-4 text-red-200">
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
                className={cn(
                  "rounded-2xl border p-5 text-left transition-all duration-200",
                  isSelected
                    ? "border-primary/50 bg-primary/16 shadow-[0_12px_30px_-15px_oklch(0.58_0.16_42/0.4)]"
                    : "border-border/85 bg-card/88 hover:border-primary/35 hover:bg-card/95",
                )}
                onClick={() => {
                  setSelectedPlanIdOverride(plan.key);
                  if (latestCheckoutSession?.planId !== plan.key) {
                    setLatestCheckoutSession(null);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/14 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-100">
                      <ShieldCheck className="size-3.5" />
                      Activo
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                <p className="field-label mt-4">
                  Modulos permitidos
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{formatModules(plan.allowedModuleKeys)}</p>
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedPlan ? (
        <article className="surface-card border-border/85 bg-card/88 p-5">
          <div className="mb-5 space-y-3">
            <p className="field-label">
              Flujo guiado de activacion
            </p>
            <div className="space-y-2">
              {stepSummaries.map((step) => (
                <div
                  key={step.label}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm transition-colors",
                    step.done
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                      : "border-border/70 bg-muted/20 text-muted-foreground",
                  )}
                >
                  <p className="font-semibold">{step.label}</p>
                  <p className="mt-0.5 opacity-85">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              type="button"
              className="h-11 rounded-xl"
              disabled={isWorking || !canAssignSelectedPlan}
              onClick={() => {
                setViewState({ status: "idle" });
                assignMutation.mutate();
              }}
            >
              {assignMutation.isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                "Confirmar pago y activar plan"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              disabled={isWorking || !selectedPlanId}
              onClick={() => {
                setViewState({ status: "idle" });
                checkoutMutation.mutate();
              }}
            >
              {checkoutMutation.isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Creando checkout...
                </>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="size-4" />
                  Iniciar checkout
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              disabled={isWorking}
              onClick={() => {
                setViewState({ status: "idle" });
                verifyActivationMutation.mutate();
              }}
            >
              {verifyActivationMutation.isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Verificar activacion
                </span>
              )}
            </Button>
          </div>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isWorking || currentPlanId === null}
              onClick={() => {
                setViewState({ status: "idle" });
                cancelMutation.mutate();
              }}
            >
              {cancelMutation.isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Cancelando...
                </>
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
        <article className="surface-card border-border/85 bg-card/88 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" />
            Ultima sesion de checkout
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>
              Provider session: <span className="font-mono text-foreground">{latestCheckoutSession.providerSessionId}</span>
            </p>
            <p>
              Estado: <span className="font-semibold text-foreground">{latestCheckoutSession.status}</span>
            </p>
            <p>
              Expira en: <span className="font-semibold text-foreground">{latestCheckoutSession.expiresAt}</span>
            </p>
          </div>
          <a
            href={latestCheckoutSession.checkoutUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-border/80 bg-background/50 px-4 text-sm font-semibold transition-all hover:border-primary/35 hover:text-primary"
          >
            Abrir checkout URL
            <ExternalLink className="size-4" />
          </a>
        </article>
      ) : null}

      {activationDetectedAfterCheckout ? (
        <article className="rounded-xl border border-emerald-400/55 bg-emerald-500/14 p-4 text-emerald-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4" />
            <p className="text-sm font-semibold">
              Activacion detectada: el plan seleccionado ya esta activo en el runtime del tenant.
            </p>
          </div>
        </article>
      ) : null}

      {viewState.status === "success" ? (
        <article className="rounded-xl border border-emerald-400/55 bg-emerald-500/14 p-4 text-emerald-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4" />
            <p className="text-sm font-semibold">{viewState.message}</p>
          </div>
        </article>
      ) : null}

      {viewState.status === "error" ? (
        <article className="rounded-xl border border-destructive/45 bg-destructive/14 p-4 text-red-200">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4" />
            <p className="text-sm font-semibold">{viewState.message}</p>
          </div>
        </article>
      ) : null}
    </div>
  );
}





