"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Eye,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DecisionDialog } from "@/components/ui/decision-dialog";
import { Input } from "@/components/ui/input";
import { InventoryFormModal } from "@/components/ui/inventory-form-modal";
import {
  InventoryCell,
  InventoryDataTable,
  InventoryRecordsShell,
  InventoryRow,
  inventorySelectClassName,
} from "@/components/ui/inventory-records-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import {
  createInventoryItem,
  deleteInventoryItem,
  listInventoryCategories,
  listInventoryItems,
  updateInventoryItem,
} from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { downloadCsv } from "@/lib/export-csv";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";
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
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

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
      breadcrumbItems={[
        { label: "Dashboard", href: "/app" },
        { label: "Inventario", href: "/app/inventory" },
        { label: "Items" },
      ]}
      backHref="/app/inventory"
      backLabel="Volver a Panel principal"
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
              formErrorMessage={formErrorMessage}
              setFormErrorMessage={setFormErrorMessage}
              actionErrorMessage={actionErrorMessage}
              setActionErrorMessage={setActionErrorMessage}
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
  formErrorMessage: string | null;
  setFormErrorMessage: (value: string | null) => void;
  actionErrorMessage: string | null;
  setActionErrorMessage: (value: string | null) => void;
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
  formErrorMessage,
  setFormErrorMessage,
  actionErrorMessage,
  setActionErrorMessage,
}: ItemsContentProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
  const categoriesById = new Map(categories.map((category) => [category.id, category.name]));

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
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItems(tenantId) });
      setFormErrorMessage(null);
      setNoticeMessage(null);
      resetForm();
      setIsModalOpen(false);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFormErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
        return;
      }

      setFormErrorMessage(
        error instanceof Error ? error.message : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR"),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => deleteInventoryItem(tenantId, itemId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItems(tenantId) });
      setNoticeMessage(null);
      setActionErrorMessage(null);
      setDeleteCandidate(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setActionErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
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

    return <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">{message}</div>;
  }

  const submitting = mutation.isPending;

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {noticeMessage ? <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-foreground/90">{noticeMessage}</div> : null}
          {actionErrorMessage ? <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">{actionErrorMessage}</div> : null}

          <InventoryRecordsShell
            title="Items registrados"
            description="Controla catalogo, SKU y niveles minimos de stock desde una vista operativa con filtros rapidos."
            badgeLabel="Catalogo activo"
            countLabel="Total visible"
            countValue={String(pagination?.total ?? items.length)}
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Buscar por item o SKU"
            filters={(
              <>
                <select className={cn(inventorySelectClassName, "lg:max-w-[210px]")} value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }}>
                  <option value="">Todas las categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <Button type="button" size="sm" variant={lowStockOnly ? "default" : "outline"} onClick={() => { setLowStockOnly((current) => !current); setPage(1); }}>
                  <TriangleAlert className="size-4" />
                  Solo low stock
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setSearch(""); setCategoryFilter(""); setLowStockOnly(false); setPage(1); }} disabled={!normalizedSearch && !normalizedCategoryFilter && !lowStockOnly}>
                  <RotateCcw className="size-4" />
                  Limpiar filtros
                </Button>
              </>
            )}
            createLabel="Nuevo item"
            onCreate={() => {
              resetForm();
              setFormErrorMessage(null);
              setIsModalOpen(true);
            }}
            exportAction={() => {
              downloadCsv("inventory-items.csv", [
                { label: "SKU", value: (item) => item.sku },
                { label: "Nombre", value: (item) => item.name },
                { label: "Categoria", value: (item) => categoriesById.get(item.categoryId) ?? "Sin categoria" },
                { label: "Stock actual", value: (item) => item.currentStock },
                { label: "Stock minimo", value: (item) => item.minStock ?? "" },
              ], items);
            }}
            importAction={() => fileInputRef.current?.click()}
            table={(
              <InventoryDataTable
                hasRows={items.length > 0}
                empty={normalizedSearch || normalizedCategoryFilter || lowStockOnly ? "Sin resultados para los filtros aplicados." : "Sin items registrados."}
                columns={<><InventoryCell header>Item</InventoryCell><InventoryCell header>Categoria</InventoryCell><InventoryCell header className="text-right">Stock</InventoryCell><InventoryCell header>Estado</InventoryCell><InventoryCell header className="text-right">Acciones</InventoryCell></>}
              >
                {items.map((item) => {
                  const minStock = item.minStock ?? 0;
                  const isLowStock = minStock > 0 && item.currentStock <= minStock;
                  return (
                    <InventoryRow key={item.id}>
                      <InventoryCell><div className="space-y-1"><p className="font-semibold text-foreground">{item.name}</p><p className="text-xs text-muted-foreground">SKU: {item.sku}</p></div></InventoryCell>
                      <InventoryCell><div className="text-sm text-foreground/80">{categoriesById.get(item.categoryId) ?? "Sin categoria"}</div></InventoryCell>
                      <InventoryCell className="text-right"><div className="space-y-1"><p className="font-semibold text-foreground">{item.currentStock}</p><p className="text-xs text-muted-foreground">Min: {item.minStock ?? 0}</p></div></InventoryCell>
                      <InventoryCell><Badge variant={isLowStock ? "destructive" : "outline"} className="rounded-md">{isLowStock ? "Bajo stock" : "Operativo"}</Badge></InventoryCell>
                      <InventoryCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/app/inventory/items/${item.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}><Eye className="size-4" />Ver detalle</Link>
                          <Button type="button" size="sm" variant="outline" onClick={() => { setEditingId(item.id); setFormState({ categoryId: item.categoryId, sku: item.sku, name: item.name, description: item.description ?? "", initialStock: "", minStock: String(item.minStock ?? "") }); setFormErrorMessage(null); setIsModalOpen(true); }}><PencilLine className="size-4" />Editar</Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => { setActionErrorMessage(null); setDeleteCandidate({ id: item.id, name: item.name }); }}><Trash2 className="size-4" />Eliminar</Button>
                        </div>
                      </InventoryCell>
                    </InventoryRow>
                  );
                })}
              </InventoryDataTable>
            )}
            pagination={pagination ? <InventoryPaginationControls page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} /> : null}
          />

          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setNoticeMessage(`Archivo preparado para importacion: ${file.name}. La carga asistida se conectara al flujo backend cuando exista contrato.`); event.target.value = ""; }} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <InventoryHelpPanel title="Ayuda items" items={["Usa SKU unico para evitar colisiones en operaciones.", "Define stock minimo por item critico.", "Mantiene descripciones cortas y accionables."]} />
        </aside>
      </div>

      <InventoryFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            resetForm();
            setFormErrorMessage(null);
          }
        }}
        title={editingId ? "Editar item" : "Nuevo item"}
        description="Administra datos maestros del item y sus umbrales operativos sin salir de la tabla."
        alert={formErrorMessage ? <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">{formErrorMessage}</div> : null}
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); setFormErrorMessage(null); }} disabled={submitting}><X className="size-4" />Cancelar</Button>
            <Button type="button" onClick={() => mutation.mutate()} disabled={submitting}>{editingId ? <><Save className="size-4" />Actualizar item</> : <><Plus className="size-4" />Crear item</>}</Button>
          </>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><label className="field-label">Categoria</label><select className={inventorySelectClassName} value={formState.categoryId} onChange={(event) => setFormState({ ...formState, categoryId: event.target.value })}><option value="">Selecciona una categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
          <div className="space-y-2"><label className="field-label">SKU</label><Input value={formState.sku} onChange={(event) => setFormState({ ...formState, sku: event.target.value })} placeholder="SKU-001" className="h-10 rounded-md bg-background/80" /></div>
          <div className="space-y-2"><label className="field-label">Nombre</label><Input value={formState.name} onChange={(event) => setFormState({ ...formState, name: event.target.value })} placeholder="Nombre del item" className="h-10 rounded-md bg-background/80" /></div>
          <div className="space-y-2"><label className="field-label">Descripcion</label><Input value={formState.description} onChange={(event) => setFormState({ ...formState, description: event.target.value })} placeholder="Descripcion operativa" className="h-10 rounded-md bg-background/80" /></div>
          <div className="space-y-2"><label className="field-label">Stock inicial</label><Input type="number" value={formState.initialStock} onChange={(event) => setFormState({ ...formState, initialStock: event.target.value })} placeholder="0" className="h-10 rounded-md bg-background/80" disabled={Boolean(editingId)} /></div>
          <div className="space-y-2"><label className="field-label">Stock minimo</label><Input type="number" value={formState.minStock} onChange={(event) => setFormState({ ...formState, minStock: event.target.value })} placeholder="0" className="h-10 rounded-md bg-background/80" /></div>
        </div>
      </InventoryFormModal>

      <DecisionDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null);
        }}
        title="Eliminar item"
        description="Esta accion eliminara el item seleccionado del tenant activo."
        tone="danger"
        confirmLabel="Eliminar item"
        busyLabel="Eliminando..."
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteCandidate) return;
          await deleteMutation.mutateAsync(deleteCandidate.id);
        }}
      >
        {deleteCandidate ? `Confirma la eliminacion de ${deleteCandidate.name}. Esta operacion no se puede deshacer.` : null}
      </DecisionDialog>
    </div>
  );
}
