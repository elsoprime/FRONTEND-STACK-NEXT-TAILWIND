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
import { DecisionDialog } from "@/components/ui/decision-dialog";
import { resolveBillingErrorMessage } from "@/features/billing/error-code-map";
import {
  CANONICAL_PLAN_KEYS,
  resolvePlanAllowedModuleKeys,
  resolvePlanDescription,
  resolvePlanDisplayName,
  resolvePlanRank,
} from "@/features/billing/plan-catalog";
import {
  assignTenantSubscription,
  cancelTenantSubscription,
  createCheckoutSession,
  getBillingPlans,
} from "@/features/billing/billing.service";
import {
  type BillingCheckoutSession,
  type BillingPlan,
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

function readSubscriptionStatus(tenant: unknown): string | null {
  if (!tenant || typeof tenant !== "object") {
    return null;
  }

  const value = (tenant as { subscriptionStatus?: unknown }).subscriptionStatus;
  return typeof value === "string" ? value : null;
}

function buildMissingCatalogPlan(planKey: string): BillingPlan {
  return {
    key: planKey,
    name: resolvePlanDisplayName(planKey),
    description: resolvePlanDescription(planKey),
    rank: resolvePlanRank(planKey),
    allowedModuleKeys: [...resolvePlanAllowedModuleKeys(planKey)],
    featureFlagKeys: [],
    memberLimit: null,
  };
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({ status: "idle" });
  const isDevSimulationMode =
    process.env.NEXT_PUBLIC_BILLING_SIMULATION_MODE === "true" ||
    process.env.NODE_ENV !== "production";

  const plansQuery = useQuery({
    queryKey: queryKeys.billingPlans(),
    queryFn: async () => {
      const response = await getBillingPlans();
      setLastTraceId(response.traceId);
      return response.data.items;
    },
  });

  const visiblePlans = useMemo(() => {
    const byKey = new Map<string, BillingPlan>();
    for (const plan of plansQuery.data ?? []) {
      byKey.set(plan.key, plan);
    }

    for (const planKey of CANONICAL_PLAN_KEYS) {
      if (!byKey.has(planKey)) {
        byKey.set(planKey, buildMissingCatalogPlan(planKey));
      }
    }

    return Array.from(byKey.values()).sort((left, right) => {
      const leftRank = left.rank ?? resolvePlanRank(left.key);
      const rightRank = right.rank ?? resolvePlanRank(right.key);
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return left.key.localeCompare(right.key);
    });
  }, [plansQuery.data]);

  const currentPlanId = useMemo(
    () => effectiveRuntime?.planId ?? activeTenant?.planId ?? null,
    [activeTenant?.planId, effectiveRuntime?.planId],
  );

  const defaultSelectedPlanId = useMemo(() => {
    if (visiblePlans.length === 0) {
      return null;
    }

    const matchedCurrentPlan = currentPlanId
      ? visiblePlans.find((plan) => plan.key === currentPlanId)
      : null;

    return matchedCurrentPlan?.key ?? visiblePlans[0]?.key ?? null;
  }, [currentPlanId, visiblePlans]);

  const selectedPlanId = selectedPlanIdOverride ?? defaultSelectedPlanId;
  const selectedPlan = visiblePlans.find((plan) => plan.key === selectedPlanId) ?? null;
  const selectedPlanLabel = resolvePlanDisplayName(selectedPlanId, selectedPlan?.name);
  const hasCheckoutSession = Boolean(latestCheckoutSession?.id);
  const isSelectedPlanActivated = Boolean(selectedPlanId && currentPlanId === selectedPlanId);
  const activationDetectedAfterCheckout = hasCheckoutSession && isSelectedPlanActivated;
  const subscriptionStatus = readSubscriptionStatus(activeTenant);
  const cancellationBlockedByStatus =
    subscriptionStatus === "pending" ||
    subscriptionStatus === "inactive" ||
    subscriptionStatus === "canceled" ||
    subscriptionStatus === "suspended";
  const isSelectedPlanAlreadyActive = Boolean(selectedPlanId && currentPlanId === selectedPlanId);

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

  async function simulatePaidCheckout(): Promise<void> {
    if (!selectedPlanId) {
      throw new Error("Debes seleccionar un plan antes de simular el pago.");
    }

    if (!latestCheckoutSession?.id) {
      throw new Error("Debes crear una sesion de checkout antes de simular el pago.");
    }

    const response = await fetch("/api/dev/billing/simulate-paid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantId,
        checkoutSessionId: latestCheckoutSession.id,
        planId: selectedPlanId,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      success?: boolean;
      data?: { traceId?: string | null; upstreamBody?: { traceId?: string } };
      error?: { message?: string };
    } | null;

    if (!response.ok || payload?.success !== true) {
      throw new Error(payload?.error?.message ?? "No fue posible simular la confirmacion de pago.");
    }

    const traceId = payload.data?.traceId ?? payload.data?.upstreamBody?.traceId ?? null;
    setLastTraceId(traceId ?? null);
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

      const currentMembership = membershipsResponse.data.items.find(
        (item) => item.tenant.id === tenantId,
      );
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
          message: `Pago confirmado y plan ${selectedPlanLabel} activo en runtime.`,
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
        message: `Plan ${resolvePlanDisplayName(response.data.subscription.planId, response.data.subscription.planId ?? undefined)} aplicado correctamente.`,
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
      setCancelDialogOpen(false);
      setViewState({
        status: "success",
        message: "Suscripcion cancelada. El runtime efectivo se actualizo para este tenant.",
      });
    },
    onError: (error: unknown) => {
      setCancelDialogOpen(false);
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

  const isWorking =
    assignMutation.isPending ||
    cancelMutation.isPending ||
    checkoutMutation.isPending ||
    verifyActivationMutation.isPending;
  const canAssignSelectedPlan =
    Boolean(selectedPlanId) &&
    Boolean(latestCheckoutSession?.id) &&
    latestCheckoutSession?.planId === selectedPlanId &&
    !isSelectedPlanAlreadyActive;
  const canStartCheckout = !isWorking && Boolean(selectedPlanId) && !isSelectedPlanAlreadyActive;
  const canVerifyActivation =
    !isWorking && Boolean(latestCheckoutSession?.id) && !isSelectedPlanAlreadyActive;
  const canCancelSubscription =
    !isWorking && currentPlanId !== null && !cancellationBlockedByStatus;

  const stepSummaries = [
    {
      label: "1. Seleccionar plan",
      description: selectedPlanId
        ? `Plan elegido: ${selectedPlanLabel}`
        : "Selecciona un plan disponible",
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Billing y plan del tenant
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Selecciona un plan para{" "}
            <span className="font-semibold text-foreground">{tenantName}</span>, aplica suscripcion
            directa o inicia checkout en modo simulado.
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

      {visiblePlans.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visiblePlans.map((plan) => {
            const isCurrent = currentPlanId === plan.key;
            const isSelected = selectedPlanId === plan.key;
            const isAvailableByApi = (plansQuery.data ?? []).some(
              (apiPlan) => apiPlan.key === plan.key,
            );

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
                  <h3 className="text-base font-bold text-foreground">
                    {resolvePlanDisplayName(plan.key, plan.name)}
                  </h3>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/14 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-100">
                      <ShieldCheck className="size-3.5" />
                      Activo
                    </span>
                  ) : !isAvailableByApi ? (
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      No disponible
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
                <p className="field-label mt-4">Modulos permitidos</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatModules(plan.allowedModuleKeys)}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedPlan ? (
        <article className="surface-card border-border/85 bg-card/88 p-5">
          <div className="mb-5 space-y-3">
            <p className="field-label">Flujo guiado de activacion</p>
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
                setConfirmDialogOpen(true);
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
              disabled={!canStartCheckout}
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
              disabled={!canVerifyActivation}
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
              disabled={!canCancelSubscription}
              onClick={() => {
                setViewState({ status: "idle" });
                setCancelDialogOpen(true);
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
            {!canCancelSubscription ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No disponible mientras la suscripcion este pendiente o desactivada.
              </p>
            ) : null}
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
              Provider session:{" "}
              <span className="font-mono text-foreground">
                {latestCheckoutSession.providerSessionId}
              </span>
            </p>
            <p>
              Estado:{" "}
              <span className="font-semibold text-foreground">{latestCheckoutSession.status}</span>
            </p>
            <p>
              Expira en:{" "}
              <span className="font-semibold text-foreground">
                {latestCheckoutSession.expiresAt}
              </span>
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

      <DecisionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Confirmar cancelacion de suscripcion"
        description="Esta accion desactiva el plan actual y limpia los modulos activos del tenant."
        confirmLabel="Si, cancelar suscripcion"
        busyLabel="Cancelando suscripcion..."
        tone="danger"
        loading={cancelMutation.isPending}
        onConfirm={async () => {
          if (!canCancelSubscription) {
            return;
          }

          setViewState({ status: "idle" });
          await cancelMutation.mutateAsync();
        }}
        onCancel={() => setViewState({ status: "idle" })}
        onConfirmError={(error) => {
          setViewState({
            status: "error",
            message: resolveUnknownErrorMessage(error),
          });
        }}
      >
        <div className="space-y-1 text-xs sm:text-sm">
          <p>
            Tenant: <span className="font-mono">{tenantId}</span>
          </p>
          <p>
            Plan actual:{" "}
            <span className="font-semibold">
              {resolvePlanDisplayName(currentPlanId, currentPlanId ?? undefined)}
            </span>
          </p>
        </div>
      </DecisionDialog>

      <DecisionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={isDevSimulationMode ? "Confirmar pago simulado" : "Confirmar activacion de pago"}
        description={
          isDevSimulationMode
            ? "Esta accion simula la confirmacion de pago para continuar el flujo de activacion."
            : "Esta accion intenta confirmar la activacion del plan con el checkout generado."
        }
        confirmLabel="Confirmar y activar"
        busyLabel="Aplicando activacion..."
        loading={assignMutation.isPending || verifyActivationMutation.isPending}
        disabled={!canAssignSelectedPlan || isWorking}
        onConfirm={async () => {
          setViewState({ status: "idle" });

          if (isDevSimulationMode) {
            await simulatePaidCheckout();
            await verifyActivationMutation.mutateAsync();
            return;
          }

          await assignMutation.mutateAsync();
        }}
        onCancel={() => setViewState({ status: "idle" })}
        onConfirmError={(error) => {
          setViewState({
            status: "error",
            message: resolveUnknownErrorMessage(error),
          });
        }}
      >
        <div className="space-y-1 text-xs sm:text-sm">
          <p>
            Tenant: <span className="font-mono">{tenantId}</span>
          </p>
          <p>
            Plan: <span className="font-semibold">{selectedPlanLabel ?? "no seleccionado"}</span>
          </p>
          <p>
            Checkout session:{" "}
            <span className="font-mono">{latestCheckoutSession?.id ?? "pendiente"}</span>
          </p>
        </div>
      </DecisionDialog>
    </div>
  );
}
