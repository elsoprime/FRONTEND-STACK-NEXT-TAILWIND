"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, ShieldAlert, ShieldCheck, Building2, ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
          router.replace("/app");
          return;
        }

        setViewState({
          status: "ready",
          items,
        });
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
  }, [router, setLastTraceId]);

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
        setViewState({
          status: "error",
          code: error.code,
        });
      } else {
        setViewState({
          status: "error",
          code: "GEN_INTERNAL_ERROR",
        });
      }
    } finally {
      setSwitchingTenantId(null);
    }
  };

  if (viewState.status === "loading") {
    return (
      <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando tenants disponibles...
      </div>
    );
  }

  if (viewState.status === "error") {
    return (
      <article className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
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
    <div className="mt-8 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4">
        {viewState.items.map((item) => {
          const isSwitching = switchingTenantId === item.tenant.id;

          return (
            <article key={item.membership.id} className="surface-card surface-card-hover p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    <p className="text-lg font-semibold">{item.tenant.name}</p>
                    {item.isActive ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
                        Activo
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    slug: <span className="font-mono">{item.tenant.slug}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Rol actual: <span className="font-semibold">{item.membership.roleKey}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {item.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => router.replace("/app")}
                    >
                      <ShieldCheck className="mr-2 size-4" />
                      Continuar con este tenant
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="rounded-full"
                      onClick={() => void activateTenant(item.tenant.id)}
                      disabled={isSwitching}
                    >
                      {isSwitching ? (
                        <>
                          <LoaderCircle className="mr-2 size-4 animate-spin" />
                          Activando...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="mr-2 size-4" />
                          Activar tenant
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
