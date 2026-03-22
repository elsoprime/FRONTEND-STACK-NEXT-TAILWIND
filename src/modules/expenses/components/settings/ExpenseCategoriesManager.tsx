"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleHelp, FileUp, Pencil, Plus, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryFormModal } from "@/components/ui/inventory-form-modal";
import {
  InventoryCell,
  InventoryDataTable,
  InventoryRow,
} from "@/components/ui/inventory-records-shell";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { ApiRequestError } from "@/lib/api/client";
import {
  createCategory,
  listCategories,
  updateCategory,
} from "@/lib/api/expenses.client";
import { type ExpenseCategory } from "@/lib/api/expenses.types";
import { queryKeys } from "@/lib/query/query-keys";
import { ExpenseCategoriesBulkImportDialog } from "@/modules/expenses/components/settings/ExpenseCategoriesBulkImportDialog";
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
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

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
      setCreateCategoryOpen(false);
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
  const canSubmitCategory = draft.key.trim().length > 0 && draft.name.trim().length > 0;

  return (
    <section className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <h4 className="text-lg font-semibold tracking-tight text-foreground">Categorias</h4>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Catalogo operativo para clasificar solicitudes y controlar reglas visibles del modulo.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="outline" className="rounded-full border-border/80 bg-background/80">
            {items.length} visibles
          </Badge>
          <Badge
            variant="outline"
            className={canUpdateSettings ? "rounded-full border-primary/20 bg-primary/8 text-primary" : "rounded-full border-amber-300/35 bg-amber-400/10 text-amber-700 dark:text-amber-100"}
          >
            {canUpdateSettings ? "Editable" : "Solo lectura"}
          </Badge>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="min-w-[150px] justify-center"
              disabled={!canUpdateSettings}
              onClick={() => {
                setDraft(initialDraft);
                setCreateCategoryOpen(true);
              }}
            >
              <Plus className="size-4" />
              Nueva categoria
            </Button>
            <Button
              type="button"
              size="sm"
              variant="toolbar"
              className="min-w-[150px] justify-center"
              disabled={!canUpdateSettings}
              onClick={() => setBulkImportOpen(true)}
            >
              <FileUp className="size-3.5" />
              Importar CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <article className="rounded-[1.1rem] border border-border/80 bg-background/82 p-4">
          <div className="flex items-start gap-3">
            <CircleHelp className="mt-0.5 size-4 text-primary" />
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Guia rapida del catalogo</p>
              <p>1. Usa <span className="font-medium text-foreground">Nueva categoria</span> para altas individuales.</p>
              <p>2. Usa <span className="font-medium text-foreground">Importar CSV</span> para cargas masivas con validacion previa.</p>
              <p>3. Define reglas por categoria: adjunto obligatorio y limite mensual opcional.</p>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Buscar categoria por key o nombre"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="lg:max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            Gestiona nombres, estado y reglas sin salir del workspace.
          </p>
        </div>

        {feedback ? (
          <article className="rounded-xl border border-border/80 bg-background/82 px-4 py-3 text-sm text-muted-foreground" role="status">
            {feedback}
          </article>
        ) : null}

        {categoriesQuery.isLoading ? (
          <article className="rounded-xl border border-border/80 bg-background/82 p-4 text-sm text-muted-foreground">
            Cargando categorias...
          </article>
        ) : categoriesQuery.isError ? (
          <article className="rounded-xl border border-destructive/35 bg-destructive/10 p-4 text-sm text-destructive">
            No fue posible cargar categorias.
          </article>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-background/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <InventoryDataTable
              hasRows={items.length > 0}
              empty="Sin categorias registradas."
              columns={
                <>
                  <InventoryCell header>Key</InventoryCell>
                  <InventoryCell header>Nombre</InventoryCell>
                  <InventoryCell header>Reglas</InventoryCell>
                  <InventoryCell header>Estado</InventoryCell>
                  <InventoryCell header className="text-right">
                    Acciones
                  </InventoryCell>
                </>
              }
            >
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
            </InventoryDataTable>
          </div>
        )}
      </div>

      <InventoryFormModal
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        title="Nueva categoria"
        description="Configura una categoria para clasificar solicitudes y sus reglas base."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCreateCategoryOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => createMutation.mutate()}
              disabled={!canUpdateSettings || createMutation.isPending || !canSubmitCategory}
            >
              <Plus className="size-4" />
              {createMutation.isPending ? "Creando..." : "Crear categoria"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="space-y-2 text-sm">
            <span className="block py-2 text-muted-foreground">Key</span>
            <Input
              data-testid="expenses-category-key-input"
              placeholder="key"
              value={draft.key}
              onChange={(event) => setDraft((state) => ({ ...state, key: event.target.value }))}
              disabled={!canUpdateSettings}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block py-2 text-muted-foreground">Nombre</span>
            <Input
              data-testid="expenses-category-name-input"
              placeholder="nombre"
              value={draft.name}
              onChange={(event) => setDraft((state) => ({ ...state, name: event.target.value }))}
              disabled={!canUpdateSettings}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block py-2 text-muted-foreground">Limite mensual</span>
            <Input
              data-testid="expenses-category-monthly-limit-input"
              type="number"
              min="0"
              placeholder="limite mensual"
              value={draft.monthlyLimit}
              onChange={(event) => setDraft((state) => ({ ...state, monthlyLimit: event.target.value }))}
              disabled={!canUpdateSettings}
            />
          </label>
          <label className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-card/90 px-3 py-2 text-sm text-foreground">
            <input
              data-testid="expenses-category-requires-attachment-input"
              type="checkbox"
              checked={draft.requiresAttachment}
              onChange={(event) =>
                setDraft((state) => ({ ...state, requiresAttachment: event.target.checked }))
              }
              disabled={!canUpdateSettings}
            />
            Requiere adjunto
          </label>
        </div>
      </InventoryFormModal>

      <ExpenseCategoriesBulkImportDialog
        open={bulkImportOpen}
        tenantId={tenantId}
        onOpenChange={setBulkImportOpen}
        onCompleted={async (result) => {
          setFeedback(
            `Importacion masiva finalizada. Procesadas: ${result.processed}. Exitos: ${result.succeeded}. Fallos: ${result.failed}.`,
          );
          await queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories(tenantId) });
        }}
      />
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
    <InventoryRow>
      <InventoryCell>
        <span className="font-semibold text-foreground">{category.key}</span>
      </InventoryCell>
      <InventoryCell>
        {editing ? (
          <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
        ) : (
          <span className="text-sm text-muted-foreground">{category.name}</span>
        )}
      </InventoryCell>
      <InventoryCell>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{category.requiresAttachment ? "Adjunto obligatorio" : "Adjunto opcional"}</p>
          <p>{category.monthlyLimit !== null ? `Limite mensual: ${category.monthlyLimit}` : "Sin limite mensual"}</p>
        </div>
      </InventoryCell>
      <InventoryCell>
        <Badge
          variant="outline"
          className={category.isActive ? "rounded-full border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100" : "rounded-full border-border/80 bg-background/80 text-muted-foreground"}
        >
          {category.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </InventoryCell>
      <InventoryCell className="text-right">
        <div className="flex flex-wrap justify-end gap-2">
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
                <Button type="button" size="sm" variant="toolbar" onClick={() => onStartEdit(category)}>
                  <Pencil className="size-3.5" />
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="toolbar"
                  onClick={onToggleActive}
                  disabled={saving}
                >
                  <Power className="size-3.5" />
                  {category.isActive ? "Desactivar" : "Reactivar"}
                </Button>
              </>
            )
          ) : null}
        </div>
      </InventoryCell>
    </InventoryRow>
  );
}
