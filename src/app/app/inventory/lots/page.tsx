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
  createInventoryLot,
  listInventoryItems,
  listInventoryLots,
  listInventoryWarehouses,
  updateInventoryLot,
} from "@/features/inventory/inventory.service";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function InventoryLotsPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    itemId: "",
    warehouseId: "",
    lotCode: "",
    quantity: "",
    expiresAt: "",
    isActive: true,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFormState({
      itemId: "",
      warehouseId: "",
      lotCode: "",
      quantity: "",
      expiresAt: "",
      isActive: true,
    });
  };

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Lotes"
      description="Administra lotes por item y bodega, con seguimiento de vencimientos."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Inventory"
            config={MODULE_GUARDS.inventory}
          >
            <InventoryLotsContent
              tenantId={tenant.id}
              setLastTraceId={setLastTraceId}
              queryClient={queryClient}
              editingId={editingId}
              setEditingId={setEditingId}
              formState={formState}
              setFormState={setFormState}
              resetForm={resetForm}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type LotsContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  formState: {
    itemId: string;
    warehouseId: string;
    lotCode: string;
    quantity: string;
    expiresAt: string;
    isActive: boolean;
  };
  setFormState: (value: LotsContentProps["formState"]) => void;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function InventoryLotsContent({
  tenantId,
  setLastTraceId,
  queryClient,
  editingId,
  setEditingId,
  formState,
  setFormState,
  resetForm,
  errorMessage,
  setErrorMessage,
}: LotsContentProps) {
  const [page, setPage] = useState(1);
  const [itemFilter, setItemFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const limit = 20;

  const itemsQuery = useQuery({
    queryKey: [...queryKeys.inventoryItems(tenantId), "for-lots-form"],
    queryFn: async () => listInventoryItems(tenantId, { page: 1, limit: 100 }),
  });

  const warehousesQuery = useQuery({
    queryKey: [...queryKeys.inventoryWarehouses(tenantId), "for-lots-form"],
    queryFn: async () => listInventoryWarehouses(tenantId, { page: 1, limit: 100 }),
  });

  const lotsQuery = useQuery({
    queryKey: [
      ...queryKeys.inventoryLots(tenantId),
      "list",
      page,
      limit,
      itemFilter,
      warehouseFilter,
    ],
    queryFn: async () =>
      listInventoryLots(tenantId, {
        page,
        limit,
        itemId: itemFilter || undefined,
        warehouseId: warehouseFilter || undefined,
      }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formState.itemId || !formState.warehouseId) {
        throw new Error("Selecciona item y bodega.");
      }

      if (!editingId) {
        if (!formState.lotCode.trim()) {
          throw new Error("Codigo de lote es obligatorio.");
        }
        if (!formState.quantity.trim()) {
          throw new Error("Cantidad es obligatoria.");
        }

        return createInventoryLot(tenantId, {
          itemId: formState.itemId,
          warehouseId: formState.warehouseId,
          lotCode: formState.lotCode.trim(),
          quantity: Number(formState.quantity),
          expiresAt: formState.expiresAt ? new Date(formState.expiresAt).toISOString() : undefined,
        });
      }

      return updateInventoryLot(tenantId, editingId, {
        expiresAt: formState.expiresAt ? new Date(formState.expiresAt).toISOString() : null,
        isActive: formState.isActive,
      });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLots(tenantId) });
      setErrorMessage(null);
      resetForm();
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

  if (itemsQuery.isLoading || warehousesQuery.isLoading || lotsQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando lotes..."
        hint="Sincronizando lotes, items y bodegas del tenant."
      />
    );
  }

  if (itemsQuery.error || warehousesQuery.error || lotsQuery.error) {
    const err = itemsQuery.error ?? warehousesQuery.error ?? lotsQuery.error;
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

  const items = itemsQuery.data?.data.items ?? [];
  const warehouses = warehousesQuery.data?.data.items ?? [];
  const lots = lotsQuery.data?.data.items ?? [];
  const pagination = lotsQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{editingId ? "Editar lote" : "Nuevo lote"}</p>
                <p className="text-xs text-muted-foreground">
                  Registra lotes por item y bodega para trazabilidad.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={resetForm}
                disabled={!editingId && !formState.lotCode}
              >
                Limpiar
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="field-label">Item</label>
                <select
                  className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                  value={formState.itemId}
                  onChange={(event) => setFormState({ ...formState, itemId: event.target.value })}
                  disabled={Boolean(editingId)}
                >
                  <option value="">Selecciona un item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="field-label">Bodega</label>
                <select
                  className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                  value={formState.warehouseId}
                  onChange={(event) =>
                    setFormState({ ...formState, warehouseId: event.target.value })
                  }
                  disabled={Boolean(editingId)}
                >
                  <option value="">Selecciona una bodega</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              {!editingId ? (
                <>
                  <div className="space-y-2">
                    <label className="field-label">Codigo lote</label>
                    <Input
                      value={formState.lotCode}
                      onChange={(event) =>
                        setFormState({ ...formState, lotCode: event.target.value })
                      }
                      placeholder="LOT-2026-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">Cantidad inicial</label>
                    <Input
                      type="number"
                      value={formState.quantity}
                      onChange={(event) =>
                        setFormState({ ...formState, quantity: event.target.value })
                      }
                      placeholder="100"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="field-label">Estado</label>
                  <select
                    className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                    value={formState.isActive ? "active" : "inactive"}
                    onChange={(event) =>
                      setFormState({ ...formState, isActive: event.target.value === "active" })
                    }
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="field-label">Fecha vencimiento (opcional)</label>
                <Input
                  type="datetime-local"
                  value={formState.expiresAt}
                  onChange={(event) =>
                    setFormState({ ...formState, expiresAt: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {editingId ? "Actualizar lote" : "Crear lote"}
              </Button>
              {editingId ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetForm}
                  disabled={mutation.isPending}
                >
                  Cancelar edicion
                </Button>
              ) : null}
            </div>

            {errorMessage ? (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Lotes registrados</h2>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <select
                  className="h-9 rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                  value={itemFilter}
                  onChange={(event) => {
                    setItemFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todos los items</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setItemFilter("");
                    setWarehouseFilter("");
                    setPage(1);
                  }}
                  disabled={!itemFilter && !warehouseFilter}
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {lots.length === 0 ? (
              <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
                {itemFilter || warehouseFilter
                  ? "Sin resultados para los filtros aplicados."
                  : "Sin lotes registrados."}
              </div>
            ) : (
              <div className="space-y-2">
                {lots.map((lot) => (
                  <div
                    key={lot.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/70 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{lot.lotCode}</p>
                      <p className="text-xs text-muted-foreground">
                        Cantidad actual: {lot.currentQuantity} / inicial: {lot.initialQuantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vence:{" "}
                        {lot.expiresAt ? formatSpanishLongDate(lot.expiresAt) : "Sin vencimiento"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(lot.id);
                        setFormState({
                          itemId: lot.itemId,
                          warehouseId: lot.warehouseId,
                          lotCode: lot.lotCode,
                          quantity: String(lot.initialQuantity),
                          expiresAt: lot.expiresAt ? lot.expiresAt.slice(0, 16) : "",
                          isActive: lot.isActive,
                        });
                      }}
                    >
                      Editar
                    </Button>
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
            title="Ayuda lotes"
            items={[
              "Usa codigos de lote estandar por proveedor o fecha.",
              "Registra vencimientos para anticipar reposicion.",
              "Desactiva lotes obsoletos en lugar de borrarlos.",
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
