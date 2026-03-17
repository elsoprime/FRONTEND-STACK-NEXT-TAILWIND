"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { MODULE_GUARDS, TenantModuleGate } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import {
  listInventoryExpiringLotAlerts,
  listInventoryLowStockAlerts,
} from "@/features/inventory/inventory.service";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function InventoryAlertsPage() {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Alertas"
      description="Monitorea alertas de bajo stock y lotes proximos a vencer."
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
  const [withinDays, setWithinDays] = useState(30);
  const limit = 15;

  const lowStockQuery = useQuery({
    queryKey: [...queryKeys.inventoryLowStockAlerts(tenantId), "list", page, limit],
    queryFn: async () => listInventoryLowStockAlerts(tenantId, { page, limit }),
  });

  const expiringLotsQuery = useQuery({
    queryKey: [...queryKeys.inventoryExpiringLotAlerts(tenantId), "list", page, limit, withinDays],
    queryFn: async () =>
      listInventoryExpiringLotAlerts(tenantId, {
        page,
        limit,
        withinDays,
      }),
  });

  useEffect(() => {
    const traceId = lowStockQuery.data?.traceId ?? expiringLotsQuery.data?.traceId ?? null;
    if (traceId) {
      setLastTraceId(traceId);
    }
  }, [lowStockQuery.data?.traceId, expiringLotsQuery.data?.traceId, setLastTraceId]);

  if (lowStockQuery.isLoading || expiringLotsQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando alertas..."
        hint="Validando niveles de stock y vencimientos del tenant activo."
      />
    );
  }

  if (lowStockQuery.error || expiringLotsQuery.error) {
    const err = lowStockQuery.error ?? expiringLotsQuery.error;
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

  const lowStockAlerts = lowStockQuery.data?.data.items ?? [];
  const expiringLotAlerts = expiringLotsQuery.data?.data.items ?? [];

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="space-y-2 rounded-xl border border-border/80 bg-card/80 p-4">
            <h2 className="text-lg font-semibold">Bajo stock</h2>
            {lowStockAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay alertas de bajo stock.</p>
            ) : (
              <div className="space-y-2">
                {lowStockAlerts.map((alert) => (
                  <article
                    key={alert.item.id}
                    className="rounded-lg border border-border/80 bg-background/70 p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">{alert.item.name}</p>
                    <p className="text-xs text-muted-foreground">Deficit: {alert.deficit}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2 rounded-xl border border-border/80 bg-card/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Lotes proximos a vencer</h2>
              <select
                className="h-9 rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                value={withinDays}
                onChange={(event) => {
                  setWithinDays(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={7}>Proximos 7 dias</option>
                <option value={30}>Proximos 30 dias</option>
                <option value={90}>Proximos 90 dias</option>
              </select>
            </div>

            {expiringLotAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay alertas de vencimiento.</p>
            ) : (
              <div className="space-y-2">
                {expiringLotAlerts.map((alert) => (
                  <article
                    key={alert.lot.id}
                    className="rounded-lg border border-border/80 bg-background/70 p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">{alert.lot.lotCode}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence:{" "}
                      {alert.lot.expiresAt
                        ? formatSpanishLongDate(alert.lot.expiresAt)
                        : "Sin fecha"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dias restantes: {alert.daysToExpiry}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {expiringLotsQuery.data?.pagination ? (
            <InventoryPaginationControls
              page={expiringLotsQuery.data.pagination.page}
              totalPages={expiringLotsQuery.data.pagination.totalPages}
              total={expiringLotsQuery.data.pagination.total}
              onPageChange={setPage}
            />
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <InventoryHelpPanel
            title="Ayuda alertas"
            items={[
              "Prioriza items con mayor deficit primero.",
              "Revisa lotes dentro de ventana critica de vencimiento.",
              "Cruza eventos con auditoria para acciones correctivas.",
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
