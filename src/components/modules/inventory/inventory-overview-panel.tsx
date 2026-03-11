"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, LoaderCircle, Package } from "lucide-react";
import { listInventoryCategories, listInventoryItems, listInventoryLowStockAlerts } from "@/features/inventory/inventory.service";
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
      <div className="mt-6 inline-flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando resumen de inventario...
      </div>
    );
  }

  const firstError = categoriesQuery.error ?? itemsQuery.error ?? lowStockQuery.error;
  if (firstError) {
    return (
      <article className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
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
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Boxes className="size-4 text-blue-700 dark:text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Categorias</p>
          </div>
          <p className="mt-3 text-3xl font-bold">{categoriesCount}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Package className="size-4 text-blue-700 dark:text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Items</p>
          </div>
          <p className="mt-3 text-3xl font-bold">{itemsCount}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bajo stock</p>
          </div>
          <p className="mt-3 text-3xl font-bold">{lowStockCount}</p>
        </article>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Alertas prioritarias</h3>
        {lowStockItems.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Sin alertas de bajo stock.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {lowStockItems.map((alert) => (
              <li key={alert.item.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span className="font-medium">{alert.item.name}</span>
                <span className="text-slate-500 dark:text-slate-400">Deficit: {alert.deficit}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
