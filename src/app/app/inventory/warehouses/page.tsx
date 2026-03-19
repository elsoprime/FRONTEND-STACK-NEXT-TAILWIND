"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilLine, Plus, Save, X } from "lucide-react";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { MODULE_GUARDS, TenantModuleGate } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  createInventoryWarehouse,
  listInventoryWarehouses,
  updateInventoryWarehouse,
} from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { downloadCsv } from "@/lib/export-csv";
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
      description="Gestiona bodegas del inventario del tenant activo."
      breadcrumbItems={[
        { label: "Panel principal", href: "/app/inventory?tab=submodules" },
        { label: "Bodegas" },
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryWarehouses(tenantId) });
      setErrorMessage(null);
      setNoticeMessage(null);
      resetForm();
      setIsModalOpen(false);
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
          {noticeMessage ? (
            <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-foreground/90">
              {noticeMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <InventoryRecordsShell
            title="Bodegas registradas"
            description="Controla ubicaciones activas, descripciones operativas y su disponibilidad para movimientos."
            badgeLabel="Red logistica"
            countLabel="Total visible"
            countValue={String(pagination?.total ?? warehouses.length)}
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Buscar bodega"
            createLabel="Nueva bodega"
            onCreate={() => {
              resetForm();
              setErrorMessage(null);
              setIsModalOpen(true);
            }}
            exportAction={() =>
              downloadCsv(
                "inventory-warehouses.csv",
                [
                  { label: "Nombre", value: (warehouse) => warehouse.name },
                  { label: "Descripcion", value: (warehouse) => warehouse.description ?? "" },
                  { label: "Estado", value: (warehouse) => (warehouse.isActive ? "Activa" : "Inactiva") },
                ],
                warehouses,
              )
            }
            importAction={() => fileInputRef.current?.click()}
            table={(
              <InventoryDataTable
                hasRows={warehouses.length > 0}
                empty={
                  normalizedSearch.length > 0
                    ? "Sin resultados para la busqueda aplicada."
                    : "Sin bodegas registradas."
                }
                columns={(
                  <>
                    <InventoryCell header>Bodega</InventoryCell>
                    <InventoryCell header>Descripcion</InventoryCell>
                    <InventoryCell header>Estado</InventoryCell>
                    <InventoryCell header className="text-right">Acciones</InventoryCell>
                  </>
                )}
              >
                {warehouses.map((warehouse) => (
                  <InventoryRow key={warehouse.id}>
                    <InventoryCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{warehouse.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {warehouse.id.slice(0, 8)}</p>
                      </div>
                    </InventoryCell>
                    <InventoryCell>{warehouse.description ?? "Sin descripcion"}</InventoryCell>
                    <InventoryCell>
                      <Badge
                        variant={warehouse.isActive ? "outline" : "destructive"}
                        className="rounded-md"
                      >
                        {warehouse.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </InventoryCell>
                    <InventoryCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(warehouse.id);
                            setFormState({
                              name: warehouse.name,
                              description: warehouse.description ?? "",
                              isActive: warehouse.isActive,
                            });
                            setErrorMessage(null);
                            setIsModalOpen(true);
                          }}
                        ><PencilLine className="size-4" />Editar</Button>
                      </div>
                    </InventoryCell>
                  </InventoryRow>
                ))}
              </InventoryDataTable>
            )}
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
              if (!file) {
                return;
              }
              setNoticeMessage(`Archivo preparado para importacion: ${file.name}. La carga asistida se conectara al flujo backend cuando exista contrato.`);
              event.target.value = "";
            }}
          />
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

      <InventoryFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            resetForm();
            setErrorMessage(null);
          }
        }}
        title={editingId ? "Editar bodega" : "Nueva bodega"}
        description="Define ubicaciones operativas y su estado disponible dentro del tenant activo."
        footer={(
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
                setErrorMessage(null);
              }}
              disabled={mutation.isPending}
            ><X className="size-4" />Cancelar</Button>
            <Button type="button" variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {editingId ? <><Save className="size-4" />Actualizar bodega</> : <><Plus className="size-4" />Crear bodega</>}
            </Button>
          </>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Nombre</label>
            <Input
              value={formState.name}
              onChange={(event) => setFormState({ ...formState, name: event.target.value })}
              placeholder="Bodega Central"
              className="h-10 rounded-md bg-background/80"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Descripcion</label>
            <Input
              value={formState.description}
              onChange={(event) => setFormState({ ...formState, description: event.target.value })}
              placeholder="Uso o ubicacion"
              className="h-10 rounded-md bg-background/80"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="field-label">Estado</label>
            <select
              className={inventorySelectClassName}
              value={formState.isActive ? "active" : "inactive"}
              onChange={(event) =>
                setFormState({ ...formState, isActive: event.target.value === "active" })
              }
            >
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
            </select>
          </div>
        </div>
      </InventoryFormModal>
    </div>
  );
}








