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
  createInventoryWarehouse,
  listInventoryWarehouses,
  updateInventoryWarehouse,
} from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function InventoryWarehousesPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ name: "", description: "", isActive: true });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFormState({ name: "", description: "", isActive: true });
  };

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Bodegas"
      description="Gestiona bodegas activas para operaciones de inventario por tenant."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Inventory"
            config={MODULE_GUARDS.inventory}
          >
            <InventoryWarehousesContent
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

type WarehousesContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  formState: {
    name: string;
    description: string;
    isActive: boolean;
  };
  setFormState: (value: WarehousesContentProps["formState"]) => void;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function InventoryWarehousesContent({
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
}: WarehousesContentProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;
  const normalizedSearch = search.trim();

  const warehousesQuery = useQuery({
    queryKey: [...queryKeys.inventoryWarehouses(tenantId), "list", page, limit, normalizedSearch],
    queryFn: async () =>
      listInventoryWarehouses(tenantId, {
        page,
        limit,
        search: normalizedSearch.length > 0 ? normalizedSearch : undefined,
      }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formState.name.trim()) {
        throw new Error("Nombre es obligatorio.");
      }

      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
      };

      if (editingId) {
        return updateInventoryWarehouse(tenantId, editingId, {
          ...payload,
          isActive: formState.isActive,
        });
      }

      return createInventoryWarehouse(tenantId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryWarehouses(tenantId) });
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

  if (warehousesQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando bodegas..."
        hint="Sincronizando configuracion de bodegas del tenant."
      />
    );
  }

  if (warehousesQuery.error) {
    const message =
      warehousesQuery.error instanceof ApiRequestError
        ? resolveInventoryErrorMessage(warehousesQuery.error.code, warehousesQuery.error.message)
        : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR");

    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        {message}
      </div>
    );
  }

  const warehouses = warehousesQuery.data?.data.items ?? [];
  const pagination = warehousesQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {editingId ? "Editar bodega" : "Nueva bodega"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Define el nombre operativo y estado de disponibilidad.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={resetForm}
                disabled={!editingId && !formState.name && !formState.description}
              >
                Limpiar
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="field-label">Nombre</label>
                <Input
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  placeholder="Ej: Bodega Central"
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Descripcion (opcional)</label>
                <Input
                  value={formState.description}
                  onChange={(event) =>
                    setFormState({ ...formState, description: event.target.value })
                  }
                  placeholder="Uso o ubicacion"
                />
              </div>
              {editingId ? (
                <div className="space-y-2">
                  <label className="field-label">Estado</label>
                  <select
                    className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                    value={formState.isActive ? "active" : "inactive"}
                    onChange={(event) =>
                      setFormState({ ...formState, isActive: event.target.value === "active" })
                    }
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {editingId ? "Actualizar bodega" : "Crear bodega"}
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
              <h2 className="text-lg font-semibold">Bodegas registradas</h2>
              <div className="flex w-full gap-2 sm:w-auto">
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar bodega..."
                  className="h-9 w-full sm:w-60"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  disabled={normalizedSearch.length === 0}
                >
                  Limpiar
                </Button>
              </div>
            </div>

            {warehouses.length === 0 ? (
              <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
                {normalizedSearch.length > 0
                  ? "Sin resultados para la busqueda aplicada."
                  : "Sin bodegas registradas."}
              </div>
            ) : (
              <div className="space-y-2">
                {warehouses.map((warehouse) => (
                  <div
                    key={warehouse.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/70 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{warehouse.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {warehouse.description ?? "Sin descripcion"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Estado: {warehouse.isActive ? "Activa" : "Inactiva"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(warehouse.id);
                        setFormState({
                          name: warehouse.name,
                          description: warehouse.description ?? "",
                          isActive: warehouse.isActive,
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
            title="Ayuda bodegas"
            items={[
              "Crea bodegas por ubicacion o flujo operativo.",
              "Usa nombres claros para evitar errores en movimientos.",
              "Desactiva bodegas antiguas en lugar de reutilizarlas.",
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
