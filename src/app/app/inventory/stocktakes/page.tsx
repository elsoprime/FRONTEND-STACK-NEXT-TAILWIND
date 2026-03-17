"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { MODULE_GUARDS, TenantModuleGate } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import {
  applyInventoryStocktake,
  cancelInventoryStocktake,
  createInventoryStocktake,
  listInventoryStocktakes,
  listInventoryWarehouses,
} from "@/features/inventory/inventory.service";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

const STOCKTAKE_STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "applied", label: "Applied" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type StocktakeStatus = Exclude<(typeof STOCKTAKE_STATUS_OPTIONS)[number]["value"], "">;

export default function InventoryStocktakesPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [formState, setFormState] = useState({ warehouseId: "", name: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Conteos (Stocktakes)"
      description="Gestiona sesiones de conteo y cierre operativo de inventario por bodega."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Inventory"
            config={MODULE_GUARDS.inventory}
          >
            <InventoryStocktakesContent
              tenantId={tenant.id}
              queryClient={queryClient}
              setLastTraceId={setLastTraceId}
              formState={formState}
              setFormState={setFormState}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type StocktakesContentProps = {
  tenantId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  setLastTraceId: (traceId: string | null) => void;
  formState: {
    warehouseId: string;
    name: string;
  };
  setFormState: (value: StocktakesContentProps["formState"]) => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function InventoryStocktakesContent({
  tenantId,
  queryClient,
  setLastTraceId,
  formState,
  setFormState,
  errorMessage,
  setErrorMessage,
}: StocktakesContentProps) {
  const [page, setPage] = useState(1);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StocktakeStatus | "">("");
  const limit = 20;

  const warehousesQuery = useQuery({
    queryKey: [...queryKeys.inventoryWarehouses(tenantId), "for-stocktakes"],
    queryFn: async () => listInventoryWarehouses(tenantId, { page: 1, limit: 100 }),
  });

  const stocktakesQuery = useQuery({
    queryKey: [
      ...queryKeys.inventoryStocktakes(tenantId),
      "list",
      page,
      limit,
      warehouseFilter,
      statusFilter,
    ],
    queryFn: async () =>
      listInventoryStocktakes(tenantId, {
        page,
        limit,
        warehouseId: warehouseFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!formState.warehouseId || !formState.name.trim()) {
        throw new Error("Selecciona bodega e ingresa nombre del conteo.");
      }

      return createInventoryStocktake(tenantId, {
        warehouseId: formState.warehouseId,
        name: formState.name.trim(),
      });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStocktakes(tenantId) });
      setErrorMessage(null);
      setFormState({ warehouseId: "", name: "" });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
        return;
      }
      setErrorMessage(
        error instanceof Error ? error.message : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR"),
      );
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (stocktakeId: string) => applyInventoryStocktake(tenantId, stocktakeId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStocktakes(tenantId) });
      setErrorMessage(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (stocktakeId: string) => cancelInventoryStocktake(tenantId, stocktakeId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStocktakes(tenantId) });
      setErrorMessage(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
      }
    },
  });

  if (warehousesQuery.isLoading || stocktakesQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando conteos..."
        hint="Sincronizando sesiones de stocktake del tenant."
      />
    );
  }

  if (warehousesQuery.error || stocktakesQuery.error) {
    const err = warehousesQuery.error ?? stocktakesQuery.error;
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

  const warehouses = warehousesQuery.data?.data.items ?? [];
  const stocktakes = stocktakesQuery.data?.data.items ?? [];
  const pagination = stocktakesQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Nuevo stocktake</p>
                <p className="text-xs text-muted-foreground">
                  Inicia una sesion de conteo para una bodega especifica.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFormState({ warehouseId: "", name: "" })}
                disabled={!formState.warehouseId && !formState.name}
              >
                Limpiar
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="field-label">Bodega</label>
                <select
                  className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                  value={formState.warehouseId}
                  onChange={(event) =>
                    setFormState({ ...formState, warehouseId: event.target.value })
                  }
                >
                  <option value="">Selecciona una bodega</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="field-label">Nombre</label>
                <Input
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  placeholder="Conteo mensual bodega central"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                Crear stocktake
              </Button>
            </div>

            {errorMessage ? (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Sesiones de conteo</h2>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <select
                  className="h-9 rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                  value={warehouseFilter}
                  onChange={(event) => {
                    setWarehouseFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todas las bodegas</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as StocktakeStatus | "");
                    setPage(1);
                  }}
                >
                  {STOCKTAKE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setWarehouseFilter("");
                    setStatusFilter("");
                    setPage(1);
                  }}
                  disabled={!warehouseFilter && !statusFilter}
                >
                  Limpiar
                </Button>
              </div>
            </div>

            {stocktakes.length === 0 ? (
              <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
                {warehouseFilter || statusFilter
                  ? "Sin resultados para los filtros aplicados."
                  : "Sin stocktakes registrados."}
              </div>
            ) : (
              <div className="space-y-2">
                {stocktakes.map((stocktake) => (
                  <div
                    key={stocktake.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/70 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{stocktake.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Estado: {stocktake.status} - Lineas: {stocktake.lines.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Actualizado: {formatSpanishLongDate(stocktake.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stocktake.status !== "applied" && stocktake.status !== "cancelled" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyMutation.mutate(stocktake.id)}
                          disabled={applyMutation.isPending || cancelMutation.isPending}
                        >
                          Aplicar
                        </Button>
                      ) : null}
                      {stocktake.status !== "applied" && stocktake.status !== "cancelled" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelMutation.mutate(stocktake.id)}
                          disabled={applyMutation.isPending || cancelMutation.isPending}
                        >
                          Cancelar
                        </Button>
                      ) : null}
                    </div>
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
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <InventoryHelpPanel
            title="Ayuda stocktakes"
            items={[
              "Crea el stocktake por bodega para aislar diferencias.",
              "Valida lineas antes de aplicar para evitar ajustes no deseados.",
              "Si hay conflicto, usa traceId para auditoria operativa.",
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
