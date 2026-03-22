"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { ApiRequestError } from "@/lib/api/client";
import {
  createCategory,
  listCategories,
  updateCategory,
} from "@/lib/api/expenses.client";
import { type ExpenseCategory } from "@/lib/api/expenses.types";
import { queryKeys } from "@/lib/query/query-keys";
import { useTenantStore } from "@/store/tenant-store";

type CategoryDraft = {
  key: string;
  name: string;
  requiresAttachment: boolean;
  monthlyLimit: string;
};

const initialDraft: CategoryDraft = {
  key: "",
  name: "",
  requiresAttachment: false,
  monthlyLimit: "",
};

export function ExpenseCategoriesManager({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<CategoryDraft>(initialDraft);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const canUpdateSettings = hasTenantPermission(
    activeMembership?.roleKey ?? "tenant:member",
    TENANT_PERMISSION_KEYS.EXPENSES_SETTINGS_UPDATE,
  );

  const categoriesQuery = useQuery({
    queryKey: [...queryKeys.expenseCategories(tenantId), search],
    queryFn: async () =>
      listCategories(tenantId, {
        page: 1,
        limit: 50,
        includeInactive: true,
        search: search.trim().length > 0 ? search.trim() : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!draft.key.trim() || !draft.name.trim()) {
        throw new Error("Debes completar key y nombre.");
      }

      return createCategory(tenantId, {
        key: draft.key.trim(),
        name: draft.name.trim(),
        requiresAttachment: draft.requiresAttachment,
        monthlyLimit: draft.monthlyLimit.trim().length > 0 ? Number(draft.monthlyLimit) : null,
      });
    },
    onSuccess: async () => {
      setDraft(initialDraft);
      setFeedback("Categoria creada.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories(tenantId) });
    },
    onError: (error: unknown) => {
      setFeedback(
        error instanceof ApiRequestError || error instanceof Error
          ? error.message
          : "No fue posible crear la categoria.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { categoryId: string; patch: { name?: string; isActive?: boolean } }) =>
      updateCategory(tenantId, input.categoryId, input.patch),
    onSuccess: async () => {
      setEditingCategoryId(null);
      setEditName("");
      setFeedback("Categoria actualizada.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories(tenantId) });
    },
    onError: (error: unknown) => {
      setFeedback(
        error instanceof ApiRequestError || error instanceof Error
          ? error.message
          : "No fue posible actualizar la categoria.",
      );
    },
  });

  const items = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data?.items]);

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-card/95 p-5">
      <header className="space-y-2">
        <h4 className="text-lg font-semibold tracking-tight text-foreground">Categorias</h4>
        <p className="text-sm text-muted-foreground">
          Mantiene el catalogo operativo de gastos para solicitudes.
        </p>
        {!canUpdateSettings ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Modo solo lectura: tu rol no tiene permiso de actualizacion.
          </p>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Buscar categoria por key o nombre"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="grid gap-2 rounded-xl border border-border/70 bg-background/60 p-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          placeholder="key"
          value={draft.key}
          onChange={(event) => setDraft((state) => ({ ...state, key: event.target.value }))}
          disabled={!canUpdateSettings}
        />
        <Input
          placeholder="nombre"
          value={draft.name}
          onChange={(event) => setDraft((state) => ({ ...state, name: event.target.value }))}
          disabled={!canUpdateSettings}
        />
        <Input
          type="number"
          min="0"
          placeholder="limite mensual"
          value={draft.monthlyLimit}
          onChange={(event) => setDraft((state) => ({ ...state, monthlyLimit: event.target.value }))}
          disabled={!canUpdateSettings}
        />
        <label className="inline-flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={draft.requiresAttachment}
            onChange={(event) =>
              setDraft((state) => ({ ...state, requiresAttachment: event.target.checked }))
            }
            disabled={!canUpdateSettings}
          />
          Requiere adjunto
        </label>
        <Button
          type="button"
          variant="secondary"
          onClick={() => createMutation.mutate()}
          disabled={!canUpdateSettings || createMutation.isPending}
        >
          <Plus className="size-4" />
          {createMutation.isPending ? "Creando..." : "Crear"}
        </Button>
      </div>

      {feedback ? (
        <p className="text-sm text-muted-foreground" role="status">
          {feedback}
        </p>
      ) : null}

      {categoriesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando categorias...</p>
      ) : categoriesQuery.isError ? (
        <p className="text-sm text-destructive">No fue posible cargar categorias.</p>
      ) : (
        <div className="space-y-2">
          {items.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              canUpdate={canUpdateSettings}
              editing={editingCategoryId === category.id}
              editName={editName}
              setEditName={setEditName}
              onStartEdit={(current) => {
                setEditingCategoryId(current.id);
                setEditName(current.name);
              }}
              onCancelEdit={() => {
                setEditingCategoryId(null);
                setEditName("");
              }}
              onSaveEdit={() =>
                updateMutation.mutate({
                  categoryId: category.id,
                  patch: { name: editName.trim() },
                })
              }
              onToggleActive={() =>
                updateMutation.mutate({
                  categoryId: category.id,
                  patch: { isActive: !category.isActive },
                })
              }
              saving={updateMutation.isPending && editingCategoryId === category.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryRow({
  category,
  canUpdate,
  editing,
  editName,
  setEditName,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleActive,
  saving,
}: {
  category: ExpenseCategory;
  canUpdate: boolean;
  editing: boolean;
  editName: string;
  setEditName: (value: string) => void;
  onStartEdit: (category: ExpenseCategory) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onToggleActive: () => void;
  saving: boolean;
}) {
  return (
    <article className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{category.key}</p>
        {editing ? (
          <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
        ) : (
          <p className="text-sm text-muted-foreground">{category.name}</p>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{category.requiresAttachment ? "Adjunto obligatorio" : "Adjunto opcional"}</span>
        <span>{category.isActive ? "Activo" : "Inactivo"}</span>
        {canUpdate ? (
          editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onSaveEdit}
                disabled={saving || editName.trim().length === 0}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onCancelEdit}>
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => onStartEdit(category)}>
                <Pencil className="size-3.5" />
                Editar
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onToggleActive} disabled={saving}>
                <Power className="size-3.5" />
                {category.isActive ? "Desactivar" : "Reactivar"}
              </Button>
            </>
          )
        ) : null}
      </div>
    </article>
  );
}
