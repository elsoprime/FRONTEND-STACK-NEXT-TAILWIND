"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { bootstrapTenantShell } from "@/features/tenant/tenant-context.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { type MembershipView, type TenantView } from "@/features/tenant/tenant.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { clearPreviousTenantScopedQueries } from "@/lib/query/tenant-cache";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type TenantContextGateProps = {
  children: (context: { tenant: TenantView; membership: MembershipView }) => React.ReactNode;
  loadingCopy?: string;
};

export function TenantContextGate({
  children,
  loadingCopy = "Resolviendo contexto tenant para esta vista...",
}: TenantContextGateProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const previousTenantId = useTenantStore((state) => state.tenantId);
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const setActiveTenantContext = useTenantStore((state) => state.setActiveTenantContext);
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const activeContext = useMemo(
    () =>
      activeTenant && activeMembership
        ? { tenant: activeTenant, membership: activeMembership }
        : null,
    [activeMembership, activeTenant],
  );
  const [gateErrorCode, setGateErrorCode] = useState<string | null>(null);

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
          setGateErrorCode(error instanceof ApiRequestError ? error.code : "GEN_INTERNAL_ERROR");
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

  if (!activeContext && !gateErrorCode) {
    return (
      <div className="mt-8 inline-flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        <LoaderCircle className="size-4 animate-spin" />
        {loadingCopy}
      </div>
    );
  }

  if (gateErrorCode) {
    return (
      <article className="mt-8 rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-4" />
          <p className="text-sm font-semibold">{resolveTenantErrorMessage(gateErrorCode)}</p>
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

  return <>{children(activeContext)}</>;
}
