"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, PencilLine, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
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
} from "@/components/ui/inventory-records-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import {
  createInventoryCategory,
  deleteInventoryCategory,
  listInventoryCategories,
  updateInventoryCategory,
} from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { downloadCsv } from "@/lib/export-csv";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";

export default function InventoryCategoriesPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [formState, setFormState] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFormState({ name: "", description: "" });
    setEditingId(null);
  };

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Categorias"
      description="Gestiona categorias del inventario del tenant activo."
      breadcrumbItems={[
        { label: "Panel principal", href: "/app/inventory?tab=submodules" },
        { label: "Categorias" },
      ]}
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

type ContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  formState: { name: string; description: string };
  setFormState: (value: { name: string; description: string }) => void;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  resetForm: () => void;
  formErrorMessage: string | null;
  setFormErrorMessage: (value: string | null) => void;
  actionErrorMessage: string | null;
  setActionErrorMessage: (value: string | null) => void;
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
  formErrorMessage,
  setFormErrorMessage,
  actionErrorMessage,
  setActionErrorMessage,
}: ContentProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      if (!formState.name.trim()) throw new Error("Nombre es obligatorio.");
      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
      };
      return editingId
        ? updateInventoryCategory(tenantId, editingId, payload)
        : createInventoryCategory(tenantId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCategories(tenantId) });
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
    mutationFn: async (categoryId: string) => deleteInventoryCategory(tenantId, categoryId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCategories(tenantId) });
      setDeleteCandidate(null);
      setActionErrorMessage(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setActionErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
      }
    },
  });

  if (categoriesQuery.isLoading)
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando categorias..."
        hint="Sincronizando configuracion de inventario."
      />
    );
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

  return (
    <div className="space-y-6">
      <InventoryModuleNav />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {noticeMessage ? (
            <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-foreground/90">
              {noticeMessage}
            </div>
          ) : null}
          {actionErrorMessage ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
              {actionErrorMessage}
            </div>
          ) : null}
          <InventoryRecordsShell
            title="Categorias registradas"
            description="Organiza el catalogo operativo del inventario con descripciones cortas y trazables."
            badgeLabel="Taxonomia"
            countLabel="Total visible"
            countValue={String(pagination?.total ?? categories.length)}
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Buscar categoria"
            filters={
              <Button
                type="button"
                size="sm"
                variant="tertiary"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                disabled={normalizedSearch.length === 0}
              >
                <RotateCcw className="size-4" />
                Limpiar filtro
              </Button>
            }
            createLabel="Nueva categoria"
            onCreate={() => {
              resetForm();
              setFormErrorMessage(null);
              setIsModalOpen(true);
            }}
            exportAction={() =>
              downloadCsv(
                "inventory-categories.csv",
                [
                  { label: "Nombre", value: (category) => category.name },
                  { label: "Descripcion", value: (category) => category.description ?? "" },
                ],
                categories,
              )
            }
            importAction={() => fileInputRef.current?.click()}
            table={
              <InventoryDataTable
                hasRows={categories.length > 0}
                empty={
                  normalizedSearch.length > 0
                    ? "Sin resultados para la busqueda aplicada."
                    : "Sin categorias registradas."
                }
                columns={
                  <>
                    <InventoryCell header>Categoria</InventoryCell>
                    <InventoryCell header>Descripcion</InventoryCell>
                    <InventoryCell header>Estado</InventoryCell>
                    <InventoryCell header className="text-right">
                      Acciones
                    </InventoryCell>
                  </>
                }
              >
                {categories.map((category) => (
                  <InventoryRow key={category.id}>
                    <InventoryCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {category.id.slice(0, 8)}
                        </p>
                      </div>
                    </InventoryCell>
                    <InventoryCell>{category.description ?? "Sin descripcion"}</InventoryCell>
                    <InventoryCell>
                      <Badge variant="outline" className="rounded-md">
                        Disponible
                      </Badge>
                    </InventoryCell>
                    <InventoryCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/app/inventory/categories/${category.id}`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          <Eye className="size-6" />
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(category.id);
                            setFormState({
                              name: category.name,
                              description: category.description ?? "",
                            });
                            setFormErrorMessage(null);
                            setIsModalOpen(true);
                          }}
                        >
                          <PencilLine className="size-4" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setActionErrorMessage(null);
                            setDeleteCandidate({ id: category.id, name: category.name });
                          }}
                        >
                          <Trash2 className="size-4" />
                          Eliminar
                        </Button>
                      </div>
                    </InventoryCell>
                  </InventoryRow>
                ))}
              </InventoryDataTable>
            }
            pagination={
              pagination ? (
                <InventoryPaginationControls
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  onPageChange={setPage}
                />
              ) : null
            }
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setNoticeMessage(
                `Archivo preparado para importacion: ${file.name}. La carga asistida se conectara al flujo backend cuando exista contrato.`,
              );
              event.target.value = "";
            }}
          />
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
      <InventoryFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            resetForm();
            setFormErrorMessage(null);
          }
        }}
        title={editingId ? "Editar categoria" : "Nueva categoria"}
        description="Gestiona taxonomia operativa del inventario desde un modal compacto y consistente."
        alert={
          formErrorMessage ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
              {formErrorMessage}
            </div>
          ) : null
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
                setFormErrorMessage(null);
              }}
              disabled={mutation.isPending}
            >
              <X className="size-4" />
              Cancelar
            </Button>
            <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {editingId ? (
                <>
                  <Save className="size-4" />
                  Actualizar categoria
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Crear categoria
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Nombre</label>
            <Input
              value={formState.name}
              onChange={(event) => setFormState({ ...formState, name: event.target.value })}
              placeholder="Categoria A"
              className="h-10 rounded-md bg-background/80"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Descripcion</label>
            <Input
              value={formState.description}
              onChange={(event) => setFormState({ ...formState, description: event.target.value })}
              placeholder="Descripcion corta"
              className="h-10 rounded-md bg-background/80"
            />
          </div>
        </div>
      </InventoryFormModal>
      <DecisionDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null);
        }}
        title="Eliminar categoria"
        description="Esta accion eliminara la categoria seleccionada del tenant activo."
        tone="danger"
        confirmLabel="Eliminar categoria"
        busyLabel="Eliminando..."
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteCandidate) return;
          await deleteMutation.mutateAsync(deleteCandidate.id);
        }}
      >
        {deleteCandidate
          ? `Confirma la eliminacion de ${deleteCandidate.name}. Esta operacion no se puede deshacer.`
          : null}
      </DecisionDialog>
    </div>
  );
}
