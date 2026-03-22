"use client";

import { useRef, useState } from "react";
import { PencilLine, Plus, RotateCcw, Save, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  createInventoryLot,
  listInventoryItems,
  listInventoryLots,
  listInventoryWarehouses,
  updateInventoryLot,
} from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { downloadCsv } from "@/lib/export-csv";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";
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
      description="Gestiona lotes del inventario del tenant activo."
      breadcrumbItems={[
        { label: "Panel principal", href: "/app/inventory?tab=submodules" },
        { label: "Lotes" },
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
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const normalizedSearch = search.trim().toLowerCase();

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
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLots(tenantId) });
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
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const warehousesById = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));
  const visibleLots = lots.filter((lot) => {
    if (!normalizedSearch) {
      return true;
    }

    const item = itemsById.get(lot.itemId);
    const warehouse = warehousesById.get(lot.warehouseId);
    return [lot.lotCode, item?.name, item?.sku, warehouse?.name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

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

          <InventoryRecordsShell
            title="Lotes registrados"
            description="Administra trazabilidad, vencimientos y disponibilidad por item y bodega sin salir de la vista de registros."
            badgeLabel="Trazabilidad"
            countLabel="Total visible"
            countValue={String(pagination?.total ?? lots.length)}
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Buscar por lote, item o bodega"
            filters={(
              <>
                <select
                  className={cn(inventorySelectClassName, "lg:max-w-[220px]")}
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
                  className={cn(inventorySelectClassName, "lg:max-w-[220px]")}
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
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setItemFilter("");
                    setWarehouseFilter("");
                    setPage(1);
                  }}
                  disabled={!search && !itemFilter && !warehouseFilter}
                ><RotateCcw className="size-4" />Limpiar filtros</Button>
              </>
            )}
            createLabel="Nuevo lote"
            onCreate={() => {
              resetForm();
              setErrorMessage(null);
              setIsModalOpen(true);
            }}
            exportAction={() =>
              downloadCsv(
                "inventory-lots.csv",
                [
                  { label: "Lote", value: (lot) => lot.lotCode },
                  { label: "Item", value: (lot) => itemsById.get(lot.itemId)?.name ?? "" },
                  { label: "Bodega", value: (lot) => warehousesById.get(lot.warehouseId)?.name ?? "" },
                  { label: "Cantidad actual", value: (lot) => lot.currentQuantity },
                  { label: "Vence", value: (lot) => (lot.expiresAt ? lot.expiresAt : "") },
                  { label: "Estado", value: (lot) => (lot.isActive ? "Activo" : "Inactivo") },
                ],
                visibleLots,
              )
            }
            importAction={() => fileInputRef.current?.click()}
            table={(
              <InventoryDataTable
                hasRows={visibleLots.length > 0}
                empty={
                  search || itemFilter || warehouseFilter
                    ? "Sin resultados para los filtros aplicados."
                    : "Sin lotes registrados."
                }
                columns={(
                  <>
                    <InventoryCell header>Lote</InventoryCell>
                    <InventoryCell header>Item / Bodega</InventoryCell>
                    <InventoryCell header>Cantidades</InventoryCell>
                    <InventoryCell header>Vencimiento</InventoryCell>
                    <InventoryCell header>Estado</InventoryCell>
                    <InventoryCell header className="text-right">Acciones</InventoryCell>
                  </>
                )}
              >
                {visibleLots.map((lot) => (
                  <InventoryRow key={lot.id}>
                    <InventoryCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{lot.lotCode}</p>
                        <p className="text-xs text-muted-foreground">ID: {lot.id.slice(0, 8)}</p>
                      </div>
                    </InventoryCell>
                    <InventoryCell>
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">{itemsById.get(lot.itemId)?.name ?? "Item no disponible"}</p>
                        <p className="text-xs text-muted-foreground">{warehousesById.get(lot.warehouseId)?.name ?? "Bodega no disponible"}</p>
                      </div>
                    </InventoryCell>
                    <InventoryCell>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-foreground">Actual: {lot.currentQuantity}</p>
                        <p className="text-xs text-muted-foreground">Inicial: {lot.initialQuantity}</p>
                      </div>
                    </InventoryCell>
                    <InventoryCell>
                      <span className="text-sm text-foreground/80">
                        {lot.expiresAt ? formatSpanishLongDate(lot.expiresAt) : "Sin vencimiento"}
                      </span>
                    </InventoryCell>
                    <InventoryCell>
                      <Badge variant={lot.isActive ? "outline" : "destructive"} className="rounded-md">
                        {lot.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </InventoryCell>
                    <InventoryCell className="text-right">
                      <Button
                        type="button"
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
                          setErrorMessage(null);
                          setIsModalOpen(true);
                        }}
                      ><PencilLine className="size-4" />Editar</Button>
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
                  limit={limit}
                  onLimitChange={(nextLimit) => {
                    setLimit(nextLimit);
                    setPage(1);
                  }}
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
            title="Ayuda lotes"
            items={[
              "Usa codigos de lote estandar por proveedor o fecha.",
              "Registra vencimientos para anticipar reposicion.",
              "Desactiva lotes obsoletos en lugar de borrarlos.",
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
        title={editingId ? "Editar lote" : "Nuevo lote"}
        description="Registra trazabilidad por item y bodega con estado operativo y fecha de vencimiento."
        alert={
          errorMessage ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null
        }
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
              {editingId ? <><Save className="size-4" />Actualizar lote</> : <><Plus className="size-4" />Crear lote</>}
            </Button>
          </>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Item</label>
            <select
              className={inventorySelectClassName}
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
              className={inventorySelectClassName}
              value={formState.warehouseId}
              onChange={(event) => setFormState({ ...formState, warehouseId: event.target.value })}
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
                  onChange={(event) => setFormState({ ...formState, lotCode: event.target.value })}
                  placeholder="LOT-2026-001"
                  className="h-10 rounded-md bg-background/80"
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Cantidad inicial</label>
                <Input
                  type="number"
                  value={formState.quantity}
                  onChange={(event) => setFormState({ ...formState, quantity: event.target.value })}
                  placeholder="100"
                  className="h-10 rounded-md bg-background/80"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2 md:col-span-2">
              <label className="field-label">Estado</label>
              <select
                className={inventorySelectClassName}
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
          <div className="space-y-2 md:col-span-2">
            <label className="field-label">Fecha vencimiento</label>
            <Input
              type="datetime-local"
              value={formState.expiresAt}
              onChange={(event) => setFormState({ ...formState, expiresAt: event.target.value })}
              className="h-10 rounded-md bg-background/80"
            />
          </div>
        </div>
      </InventoryFormModal>
    </div>
  );
}









