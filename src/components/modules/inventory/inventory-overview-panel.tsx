"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, Package } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  listInventoryCategories,
  listInventoryItems,
  listInventoryLowStockAlerts,
} from "@/features/inventory/inventory.service";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";

type InventoryOverviewPanelProps = {
  tenantId: string;
};

function resolveErrorCopy(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return resolveInventoryErrorMessage(error.code, error.message);
  }

  return resolveInventoryErrorMessage("GEN_INTERNAL_ERROR");
}

export function InventoryOverviewPanel({ tenantId }: InventoryOverviewPanelProps) {
  const categoriesQuery = useQuery({
    queryKey: queryKeys.inventoryCategories(tenantId),
    queryFn: async () => listInventoryCategories(tenantId, { page: 1, limit: 20 }),
  });

  const itemsQuery = useQuery({
    queryKey: queryKeys.inventoryItems(tenantId),
    queryFn: async () => listInventoryItems(tenantId, { page: 1, limit: 20 }),
  });

  const lowStockQuery = useQuery({
    queryKey: queryKeys.inventoryLowStockAlerts(tenantId),
    queryFn: async () => listInventoryLowStockAlerts(tenantId, { page: 1, limit: 5 }),
  });

  if (categoriesQuery.isLoading || itemsQuery.isLoading || lowStockQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-6"
        label="Cargando resumen de inventario..."
        hint="Sincronizando items, categorias y alertas de stock."
      />
    );
  }

  const firstError = categoriesQuery.error ?? itemsQuery.error ?? lowStockQuery.error;
  if (firstError) {
    return (
      <article className="mt-6 rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        <p className="text-sm font-semibold">{resolveErrorCopy(firstError)}</p>
      </article>
    );
  }

  const categoriesCount = categoriesQuery.data?.pagination.total ?? 0;
  const itemsCount = itemsQuery.data?.pagination.total ?? 0;
  const lowStockCount = lowStockQuery.data?.pagination.total ?? 0;
  const lowStockItems = lowStockQuery.data?.data.items ?? [];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card surface-card-hover rounded-xl border-border/85 bg-card/88 p-4">
          <div className="flex items-center gap-3">
            <Boxes className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Categorias
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{categoriesCount}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl border-border/85 bg-card/88 p-4">
          <div className="flex items-center gap-3">
            <Package className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Items
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{itemsCount}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl border-border/85 bg-card/88 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-4 text-amber-300" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Bajo stock
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{lowStockCount}</p>
        </article>
      </div>

      <article className="surface-card rounded-xl border-border/85 bg-card/88 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Alertas prioritarias
        </h3>
        {lowStockItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Sin alertas de bajo stock.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {lowStockItems.map((alert) => (
              <li
                key={alert.item.id}
                className="flex items-center justify-between rounded-lg border border-border/85 bg-background/68 px-3 py-2.5 transition-colors hover:border-primary/35"
              >
                <span className="font-medium text-foreground">{alert.item.name}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                  Deficit: {alert.deficit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}

