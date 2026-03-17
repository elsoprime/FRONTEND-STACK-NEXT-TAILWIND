"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Building2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { type TenantMembershipSummary } from "@/features/tenant/tenant.schemas";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import {
  getMyTenantMembershipSummaries,
  switchActiveTenant,
} from "@/features/tenant/tenant.service";
import { ApiRequestError } from "@/lib/api/client";
import { clearPreviousTenantScopedQueries } from "@/lib/query/tenant-cache";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type TenantSelectorPanelProps = {
  title?: string;
  description?: string;
};

type TenantSelectorViewState =
  | { status: "loading" }
  | { status: "ready"; items: TenantMembershipSummary[] }
  | { status: "error"; code: string };

export function TenantSelectorPanel({
  title = "Selecciona un tenant activo",
  description = "Elige el tenant con el que deseas continuar y el frontend fijara el contexto activo de la sesion.",
}: TenantSelectorPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const previousTenantId = useTenantStore((state) => state.tenantId);
  const setActiveTenantContext = useTenantStore((state) => state.setActiveTenantContext);
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [viewState, setViewState] = useState<TenantSelectorViewState>({ status: "loading" });
  const [switchingTenantId, setSwitchingTenantId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void getMyTenantMembershipSummaries()
      .then(({ items, traceId }) => {
        setLastTraceId(traceId);

        if (!isActive) {
          return;
        }

        if (items.length === 0) {
          router.replace("/app/tenants/create");
          return;
        }

        if (items.length === 1) {
          const onlyItem = items[0];

          if (onlyItem.isActive) {
            setActiveTenantContext({
              tenant: onlyItem.tenant,
              membership: onlyItem.membership,
            });
            router.replace("/app");
            return;
          }

          void switchActiveTenant({ tenantId: onlyItem.tenant.id })
            .then((response) => {
              clearPreviousTenantScopedQueries(queryClient, previousTenantId);
              setActiveTenantContext({
                tenant: response.data.tenant,
                membership: response.data.membership,
              });
              setLastTraceId(response.traceId);
              router.replace("/app");
            })
            .catch((error: unknown) => {
              if (error instanceof ApiRequestError) {
                setLastTraceId(error.traceId ?? null);
                if (isActive) {
                  setViewState({ status: "error", code: error.code });
                }
                return;
              }

              if (isActive) {
                setViewState({ status: "error", code: "GEN_INTERNAL_ERROR" });
              }
            });
          return;
        }

        setViewState({ status: "ready", items });
      })
      .catch((error: unknown) => {
        if (error instanceof ApiRequestError) {
          setLastTraceId(error.traceId ?? null);
        }

        if (isActive) {
          setViewState({
            status: "error",
            code: error instanceof ApiRequestError ? error.code : "GEN_INTERNAL_ERROR",
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [queryClient, previousTenantId, router, setActiveTenantContext, setLastTraceId]);

  const activateTenant = async (tenantId: string) => {
    setSwitchingTenantId(tenantId);

    try {
      const response = await switchActiveTenant({ tenantId });
      clearPreviousTenantScopedQueries(queryClient, previousTenantId);
      setActiveTenantContext({
        tenant: response.data.tenant,
        membership: response.data.membership,
      });
      setLastTraceId(response.traceId);
      void router.replace("/app");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setViewState({ status: "error", code: error.code });
      } else {
        setViewState({ status: "error", code: "GEN_INTERNAL_ERROR" });
      }
    } finally {
      setSwitchingTenantId(null);
    }
  };

  if (viewState.status === "loading") {
    return (
      <LoadingScreen
        variant="inline"
        className="py-4"
        label="Cargando tenants disponibles..."
        hint="Validando membresías y estado activo de sesión."
      />
    );
  }

  if (viewState.status === "error") {
    return (
      <article className="surface-card mt-6 border-destructive/30 bg-destructive/10 p-4 text-destructive dark:border-destructive/45 dark:bg-destructive/15">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-4" />
          <p className="text-sm font-semibold">{resolveTenantErrorMessage(viewState.code)}</p>
        </div>
        <div className="mt-4">
          <Button type="button" onClick={() => router.refresh()}>
            Reintentar
          </Button>
        </div>
      </article>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border/85 bg-card/88 shadow-[0_20px_44px_-28px_oklch(0.16_0.03_58/0.72)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border/80 bg-background/55">
              <tr className="text-left">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Tenant
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Slug
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Rol
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody>
              {viewState.items.map((item) => {
                const isSwitching = switchingTenantId === item.tenant.id;

                return (
                  <tr
                    key={item.membership.id}
                    className="border-b border-border/70 last:border-b-0 hover:bg-background/45"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-primary" />
                        <span className="font-semibold text-foreground">{item.tenant.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {item.tenant.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-border/80 bg-background/70 px-2 py-1 text-xs font-medium text-foreground">
                        {item.membership.roleKey}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-300/80 bg-emerald-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-950 dark:border-emerald-400/50 dark:bg-emerald-500/14 dark:text-emerald-100">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border/80 bg-background/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.isActive ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => {
                            setActiveTenantContext({
                              tenant: item.tenant,
                              membership: item.membership,
                            });
                            router.replace("/app");
                          }}
                        >
                          <ShieldCheck className="mr-2 size-4" />
                          Continuar
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => void activateTenant(item.tenant.id)}
                          disabled={isSwitching}
                        >
                          {isSwitching ? (
                            "Activando..."
                          ) : (
                            <>
                              <ArrowRightLeft className="mr-2 size-4" />
                              Activar
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {viewState.items.map((item) => {
          const isSwitching = switchingTenantId === item.tenant.id;

          return (
            <article
              key={item.membership.id}
              className="surface-card border-border/85 bg-card/88 p-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    <p className="font-semibold text-foreground">{item.tenant.name}</p>
                  </div>
                  {item.isActive ? (
                    <span className="rounded-full border border-emerald-300/80 bg-emerald-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-950 dark:border-emerald-400/50 dark:bg-emerald-500/14 dark:text-emerald-100">
                      Activo
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <p className="rounded-lg border border-border/80 bg-background/68 px-3 py-2 text-xs text-muted-foreground">
                    slug: <span className="font-mono text-foreground">{item.tenant.slug}</span>
                  </p>
                  <p className="rounded-lg border border-border/80 bg-background/68 px-3 py-2 text-xs text-muted-foreground">
                    Rol:{" "}
                    <span className="font-semibold text-foreground">{item.membership.roleKey}</span>
                  </p>
                </div>

                {item.isActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-lg"
                    onClick={() => {
                      setActiveTenantContext({
                        tenant: item.tenant,
                        membership: item.membership,
                      });
                      router.replace("/app");
                    }}
                  >
                    <ShieldCheck className="mr-2 size-4" />
                    Continuar con este tenant
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-full rounded-lg"
                    onClick={() => void activateTenant(item.tenant.id)}
                    disabled={isSwitching}
                  >
                    {isSwitching ? (
                      "Activando..."
                    ) : (
                      <>
                        <ArrowRightLeft className="mr-2 size-4" />
                        Activar tenant
                      </>
                    )}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
