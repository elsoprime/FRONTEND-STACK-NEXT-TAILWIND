"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { listInventoryCategories } from "@/features/inventory/inventory.service";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function InventoryCategoryDetailPage() {
  const params = useParams<{ categoryId: string }>();
  const categoryId = params?.categoryId ?? "";
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Detalle de categoria"
      description="Vista puntual de la categoria seleccionada."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="Inventory" config={MODULE_GUARDS.inventory}>
            <CategoryDetailContent tenantId={tenant.id} categoryId={categoryId} setLastTraceId={setLastTraceId} />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type CategoryDetailContentProps = {
  tenantId: string;
  categoryId: string;
  setLastTraceId: (traceId: string | null) => void;
};

function CategoryDetailContent({ tenantId, categoryId, setLastTraceId }: CategoryDetailContentProps) {
  const categoryQuery = useQuery({
    queryKey: queryKeys.inventoryCategories(tenantId),
    queryFn: async () => {
      const response = await listInventoryCategories(tenantId, { page: 1, limit: 100 });
      setLastTraceId(response.traceId);
      return response.data.items;
    },
  });

  if (categoryQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando categoria..."
        hint="Sincronizando categorias del tenant."
      />
    );
  }

  if (categoryQuery.error) {
    const err = categoryQuery.error;
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

  const categories = categoryQuery.data ?? [];
  const category = categories.find((item) => item.id === categoryId);

  if (!category) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
        No encontramos la categoria.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-background/70 p-4">
        <h2 className="text-lg font-semibold">{category.name}</h2>
        <p className="text-sm text-muted-foreground">{category.description ?? "Sin descripcion"}</p>
        <p className="text-xs text-muted-foreground">Activa: {category.isActive ? "Si" : "No"}</p>
      </div>

      <Link href="/app/inventory/categories" className="text-sm text-primary underline-offset-2 hover:underline">
        Volver a categorias
      </Link>
    </div>
  );
}
