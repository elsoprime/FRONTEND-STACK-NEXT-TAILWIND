"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import {
  createInventoryItem,
  deleteInventoryItem,
  listInventoryCategories,
  listInventoryItems,
  updateInventoryItem,
} from "@/features/inventory/inventory.service";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function InventoryItemsPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    categoryId: "",
    sku: "",
    name: "",
    description: "",
    initialStock: "",
    minStock: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFormState({
      categoryId: "",
      sku: "",
      name: "",
      description: "",
      initialStock: "",
      minStock: "",
    });
  };

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Items"
      description="Gestiona items y niveles de stock del tenant activo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Inventory"
            config={MODULE_GUARDS.inventory}
          >
            <InventoryItemsContent
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

type ItemsContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  formState: {
    categoryId: string;
    sku: string;
    name: string;
    description: string;
    initialStock: string;
    minStock: string;
  };
  setFormState: (value: ItemsContentProps["formState"]) => void;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function InventoryItemsContent({
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
}: ItemsContentProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const limit = 20;

  const normalizedSearch = search.trim();
  const normalizedCategoryFilter = categoryFilter.trim();

  const categoriesQuery = useQuery({
    queryKey: [...queryKeys.inventoryCategories(tenantId), "for-form"],
    queryFn: async () => listInventoryCategories(tenantId, { page: 1, limit: 100 }),
  });

  const itemsQuery = useQuery({
    queryKey: [
      ...queryKeys.inventoryItems(tenantId),
      "list",
      page,
      limit,
      normalizedSearch,
      normalizedCategoryFilter,
      lowStockOnly,
    ],
    queryFn: async () =>
      listInventoryItems(tenantId, {
        page,
        limit,
        search: normalizedSearch.length > 0 ? normalizedSearch : undefined,
        categoryId: normalizedCategoryFilter.length > 0 ? normalizedCategoryFilter : undefined,
        lowStockOnly: lowStockOnly || undefined,
      }),
  });

  const categories = categoriesQuery.data?.data.items ?? [];
  const items = itemsQuery.data?.data.items ?? [];
  const pagination = itemsQuery.data?.pagination;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formState.categoryId) {
        throw new Error("Debes seleccionar una categoria.");
      }
      if (!formState.sku.trim() || !formState.name.trim()) {
        throw new Error("SKU y nombre son obligatorios.");
      }

      const payload = {
        categoryId: formState.categoryId,
        sku: formState.sku.trim(),
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        initialStock: formState.initialStock ? Number(formState.initialStock) : undefined,
        minStock: formState.minStock ? Number(formState.minStock) : undefined,
      };

      if (editingId) {
        return updateInventoryItem(tenantId, editingId, {
          categoryId: payload.categoryId,
          sku: payload.sku,
          name: payload.name,
          description: payload.description,
          minStock: payload.minStock,
        });
      }

      return createInventoryItem(tenantId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItems(tenantId) });
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

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => deleteInventoryItem(tenantId, itemId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItems(tenantId) });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
      }
    },
  });

  if (categoriesQuery.isLoading || itemsQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando items..."
        hint="Sincronizando categorias e items."
      />
    );
  }

  if (categoriesQuery.error || itemsQuery.error) {
    const err = categoriesQuery.error ?? itemsQuery.error;
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

  const submitting = mutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{editingId ? "Editar item" : "Nuevo item"}</p>
                <p className="text-xs text-muted-foreground">SKU unico y configuracion de stock.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={resetForm}
                disabled={!editingId && !formState.sku}
              >
                Limpiar
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="field-label">Categoria</label>
                <select
                  className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                  value={formState.categoryId}
                  onChange={(event) =>
                    setFormState({ ...formState, categoryId: event.target.value })
                  }
                >
                  <option value="">Selecciona una categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="field-label">SKU</label>
                <Input
                  value={formState.sku}
                  onChange={(event) => setFormState({ ...formState, sku: event.target.value })}
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Nombre</label>
                <Input
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  placeholder="Nombre del item"
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Descripcion (opcional)</label>
                <Input
                  value={formState.description}
                  onChange={(event) =>
                    setFormState({ ...formState, description: event.target.value })
                  }
                  placeholder="Descripcion"
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Stock inicial</label>
                <Input
                  type="number"
                  value={formState.initialStock}
                  onChange={(event) =>
                    setFormState({ ...formState, initialStock: event.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Stock minimo</label>
                <Input
                  type="number"
                  value={formState.minStock}
                  onChange={(event) => setFormState({ ...formState, minStock: event.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => mutation.mutate()} disabled={submitting}>
                {editingId ? "Actualizar item" : "Crear item"}
              </Button>
              {editingId ? (
                <Button size="sm" variant="outline" onClick={resetForm} disabled={submitting}>
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
              <h2 className="text-lg font-semibold">Items registrados</h2>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar item o SKU..."
                  className="h-9 w-full sm:w-52"
                />
                <select
                  className="h-9 rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todas las categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant={lowStockOnly ? "default" : "outline"}
                  onClick={() => {
                    setLowStockOnly((current) => !current);
                    setPage(1);
                  }}
                >
                  Solo low stock
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("");
                    setLowStockOnly(false);
                    setPage(1);
                  }}
                  disabled={!normalizedSearch && !normalizedCategoryFilter && !lowStockOnly}
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
                {normalizedSearch || normalizedCategoryFilter || lowStockOnly
                  ? "Sin resultados para los filtros aplicados."
                  : "Sin items registrados."}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/70 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.sku} - Stock: {item.currentStock}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/app/inventory/items/${item.id}`}
                        className="text-sm text-primary underline-offset-2 hover:underline"
                      >
                        Ver detalle
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(item.id);
                          setFormState({
                            categoryId: item.categoryId,
                            sku: item.sku,
                            name: item.name,
                            description: item.description ?? "",
                            initialStock: "",
                            minStock: String(item.minStock ?? ""),
                          });
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        Eliminar
                      </Button>
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
            title="Ayuda items"
            items={[
              "Usa SKU unico para evitar colisiones en operaciones.",
              "Define stock minimo por item critico.",
              "Mantiene descripciones cortas y accionables.",
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
