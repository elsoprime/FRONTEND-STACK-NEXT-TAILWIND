"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, LoaderCircle, Package } from "lucide-react";
import {
  listInventoryCategories,
  listInventoryItems,
  listInventoryLowStockAlerts,
} from "@/features/inventory/inventory.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";

type InventoryOverviewPanelProps = {
  tenantId: string;
};

function resolveErrorCopy(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return resolveTenantErrorMessage(error.code, error.message);
  }

  return resolveTenantErrorMessage("GEN_INTERNAL_ERROR");
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
      <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando resumen de inventario...
      </div>
    );
  }

  const firstError = categoriesQuery.error ?? itemsQuery.error ?? lowStockQuery.error;
  if (firstError) {
    return (
      <article className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
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
        <article className="surface-card surface-card-hover rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Boxes className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Categorias
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold">{categoriesCount}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Package className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Items
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold">{itemsCount}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-4 text-amber-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Bajo stock
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold">{lowStockCount}</p>
        </article>
      </div>

      <article className="surface-card rounded-xl p-5">
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
                className="flex items-center justify-between rounded-lg border border-border/80 bg-background/70 px-3 py-2.5 transition-colors hover:border-primary/30"
              >
                <span className="font-medium">{alert.item.name}</span>
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
