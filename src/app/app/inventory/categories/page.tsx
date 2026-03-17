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
  createInventoryCategory,
  deleteInventoryCategory,
  listInventoryCategories,
  updateInventoryCategory,
} from "@/features/inventory/inventory.service";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function InventoryCategoriesPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [formState, setFormState] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFormState({ name: "", description: "" });
    setEditingId(null);
  };

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Categorias"
      description="Gestiona categorias del inventario del tenant activo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Inventory"
            config={MODULE_GUARDS.inventory}
          >
            <InventoryCategoriesContent
              tenantId={tenant.id}
              setLastTraceId={setLastTraceId}
              queryClient={queryClient}
              formState={formState}
              setFormState={setFormState}
              editingId={editingId}
              setEditingId={setEditingId}
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

type ContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  formState: { name: string; description: string };
  setFormState: (value: { name: string; description: string }) => void;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function InventoryCategoriesContent({
  tenantId,
  setLastTraceId,
  queryClient,
  formState,
  setFormState,
  editingId,
  setEditingId,
  resetForm,
  errorMessage,
  setErrorMessage,
}: ContentProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;
  const normalizedSearch = search.trim();

  const categoriesQuery = useQuery({
    queryKey: [...queryKeys.inventoryCategories(tenantId), "list", page, limit, normalizedSearch],
    queryFn: async () =>
      listInventoryCategories(tenantId, {
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
        return updateInventoryCategory(tenantId, editingId, payload);
      }

      return createInventoryCategory(tenantId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCategories(tenantId) });
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
    mutationFn: async (categoryId: string) => deleteInventoryCategory(tenantId, categoryId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCategories(tenantId) });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
      }
    },
  });

  if (categoriesQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando categorias..."
        hint="Sincronizando configuracion de inventario."
      />
    );
  }

  if (categoriesQuery.error) {
    const message =
      categoriesQuery.error instanceof ApiRequestError
        ? resolveInventoryErrorMessage(categoriesQuery.error.code, categoriesQuery.error.message)
        : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR");

    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        {message}
      </div>
    );
  }

  const categories = categoriesQuery.data?.data.items ?? [];
  const pagination = categoriesQuery.data?.pagination;
  const submitting = mutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {editingId ? "Editar categoria" : "Nueva categoria"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Completa los datos y guarda cambios.
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
                  placeholder="Ej: Categoria A"
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Descripcion (opcional)</label>
                <Input
                  value={formState.description}
                  onChange={(event) =>
                    setFormState({ ...formState, description: event.target.value })
                  }
                  placeholder="Descripcion corta"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => mutation.mutate()} disabled={submitting}>
                {editingId ? "Actualizar categoria" : "Crear categoria"}
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
              <h2 className="text-lg font-semibold">Categorias registradas</h2>
              <div className="flex w-full gap-2 sm:w-auto">
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar categoria..."
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

            {categories.length === 0 ? (
              <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
                {normalizedSearch.length > 0
                  ? "Sin resultados para la busqueda aplicada."
                  : "Sin categorias registradas."}
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/70 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.description ?? "Sin descripcion"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/app/inventory/categories/${category.id}`}
                        className="text-sm text-primary underline-offset-2 hover:underline"
                      >
                        Ver detalle
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(category.id);
                          setFormState({
                            name: category.name,
                            description: category.description ?? "",
                          });
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(category.id)}
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
            title="Ayuda categorias"
            items={[
              "Define categorias claras por familia de productos.",
              "Evita duplicados para simplificar reportes.",
              "Edita descripcion para mejorar busqueda interna.",
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
