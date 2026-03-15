"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { getInventoryItem } from "@/features/inventory/inventory.service";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function InventoryItemDetailPage() {
  const params = useParams<{ itemId: string }>();
  const itemId = params?.itemId ?? "";
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Detalle de item"
      description="Vista puntual del item seleccionado."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="Inventory" config={MODULE_GUARDS.inventory}>
            <ItemDetailContent tenantId={tenant.id} itemId={itemId} setLastTraceId={setLastTraceId} />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type ItemDetailContentProps = {
  tenantId: string;
  itemId: string;
  setLastTraceId: (traceId: string | null) => void;
};

function ItemDetailContent({ tenantId, itemId, setLastTraceId }: ItemDetailContentProps) {
  const itemQuery = useQuery({
    queryKey: queryKeys.inventoryItem(tenantId, itemId),
    enabled: Boolean(itemId),
    queryFn: async () => {
      const response = await getInventoryItem(tenantId, itemId);
      setLastTraceId(response.traceId);
      return response.data.item;
    },
  });

  if (itemQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando item..."
        hint="Sincronizando detalle del inventario."
      />
    );
  }

  if (itemQuery.error) {
    const err = itemQuery.error;
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

  const item = itemQuery.data;
  if (!item) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
        No encontramos el item.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-background/70 p-4">
        <h2 className="text-lg font-semibold">{item.name}</h2>
        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
        <p className="text-sm text-muted-foreground">Stock actual: {item.currentStock}</p>
        <p className="text-xs text-muted-foreground">Categoria: {item.categoryId}</p>
        <p className="text-xs text-muted-foreground">Stock minimo: {item.minStock}</p>
      </div>

      <Link href="/app/inventory/items" className="text-sm text-primary underline-offset-2 hover:underline">
        Volver a items
      </Link>
    </div>
  );
}
