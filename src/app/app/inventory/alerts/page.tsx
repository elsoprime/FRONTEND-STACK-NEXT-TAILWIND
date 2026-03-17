"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { listInventoryLowStockAlerts } from "@/features/inventory/inventory.service";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function InventoryAlertsPage() {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Alertas de bajo stock"
      description="Items con stock bajo el minimo configurado."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Inventory"
            config={MODULE_GUARDS.inventory}
          >
            <InventoryAlertsContent tenantId={tenant.id} setLastTraceId={setLastTraceId} />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type InventoryAlertsContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
};

function InventoryAlertsContent({ tenantId, setLastTraceId }: InventoryAlertsContentProps) {
  const [page, setPage] = useState(1);
  const limit = 15;

  const alertsQuery = useQuery({
    queryKey: [...queryKeys.inventoryLowStockAlerts(tenantId), "list", page, limit],
    queryFn: async () => listInventoryLowStockAlerts(tenantId, { page, limit }),
  });

  const traceId = alertsQuery.data?.traceId ?? null;

  useEffect(() => {
    if (traceId) {
      setLastTraceId(traceId);
    }
  }, [traceId, setLastTraceId]);

  if (alertsQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando alertas..."
        hint="Validando niveles de stock del tenant activo."
      />
    );
  }

  if (alertsQuery.error) {
    const err = alertsQuery.error;
    const message =
      err instanceof ApiRequestError
        ? resolveInventoryErrorMessage(err.code, err.message)
        : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR");

    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        {message}
      </div>
    );
  }

  const alerts = alertsQuery.data?.data.items ?? [];
  const pagination = alertsQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Alertas activas</h2>
            <Link
              href="/app/inventory"
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Volver al overview
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
              No hay alertas de bajo stock.
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.item.id}
                  className="rounded-lg border border-border/80 bg-background/70 p-3"
                >
                  <p className="text-sm font-semibold text-foreground">{alert.item.name}</p>
                  <p className="text-xs text-muted-foreground">Deficit: {alert.deficit}</p>
                </div>
              ))}
            </div>
          )}

          {pagination ? (
            <InventoryPaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <InventoryHelpPanel
            title="Ayuda alertas"
            items={[
              "Prioriza items con mayor deficit primero.",
              "Valida movimientos recientes antes de ajustar manualmente.",
              "Usa auditoria para rastrear origen de quiebres.",
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
