"use client";

import { useRef, useState } from "react";
import { ArrowRightLeft, Copy, RotateCcw, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
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
  createInventoryStockMovement,
  listInventoryItems,
  listInventoryStockMovements,
} from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { downloadCsv } from "@/lib/export-csv";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";

export default function InventoryStockPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [formState, setFormState] = useState({
    itemId: "",
    direction: "out",
    quantity: "",
    reason: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => setFormState({ itemId: "", direction: "out", quantity: "", reason: "" });

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Movimientos"
      description="Gestiona movimientos del inventario del tenant activo."
      breadcrumbItems={[
        { label: "Panel principal", href: "/app/inventory?tab=submodules" },
        { label: "Movimientos" },
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
            <StockContent
              tenantId={tenant.id}
              setLastTraceId={setLastTraceId}
              queryClient={queryClient}
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

type StockContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  formState: { itemId: string; direction: string; quantity: string; reason: string };
  setFormState: (value: StockContentProps["formState"]) => void;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function StockContent({
  tenantId,
  setLastTraceId,
  queryClient,
  formState,
  setFormState,
  resetForm,
  errorMessage,
  setErrorMessage,
}: StockContentProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [movementItemFilter, setMovementItemFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const limit = 20;
  const normalizedMovementItemFilter = movementItemFilter.trim();
  const normalizedSearch = search.trim().toLowerCase();

  const itemsQuery = useQuery({
    queryKey: [...queryKeys.inventoryItems(tenantId), "for-stock-form"],
    queryFn: async () => listInventoryItems(tenantId, { page: 1, limit: 100 }),
  });

  const movementsQuery = useQuery({
    queryKey: [
      ...queryKeys.inventoryStockMovements(tenantId),
      "list",
      page,
      limit,
      normalizedMovementItemFilter,
    ],
    queryFn: async () =>
      listInventoryStockMovements(tenantId, {
        page,
        limit,
        itemId: normalizedMovementItemFilter.length > 0 ? normalizedMovementItemFilter : undefined,
      }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formState.itemId) {
        throw new Error("Selecciona un item.");
      }
      if (!formState.quantity) {
        throw new Error("Ingresa una cantidad.");
      }
      if (!formState.reason.trim()) {
        throw new Error("Ingresa un motivo.");
      }

      return createInventoryStockMovement(tenantId, {
        itemId: formState.itemId,
        direction: formState.direction === "in" ? "in" : "out",
        quantity: Number(formState.quantity),
        reason: formState.reason.trim(),
      });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStockMovements(tenantId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItems(tenantId) });
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

  if (itemsQuery.isLoading || movementsQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando movimientos..."
        hint="Sincronizando stock del tenant."
      />
    );
  }

  if (itemsQuery.error || movementsQuery.error) {
    const err = itemsQuery.error ?? movementsQuery.error;
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
  const movements = movementsQuery.data?.data.items ?? [];
  const pagination = movementsQuery.data?.pagination;
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const visibleMovements = movements.filter((movement) => {
    if (!normalizedSearch) {
      return true;
    }

    const item = itemsById.get(movement.itemId);
    return [movement.reason, movement.direction, item?.name, item?.sku]
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
          {errorMessage ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <InventoryRecordsShell
            title="Movimientos recientes"
            description="Registra entradas y salidas, filtra por item y reutiliza operaciones frecuentes desde la misma tabla."
            badgeLabel="Kardex operativo"
            countLabel="Total visible"
            countValue={String(pagination?.total ?? movements.length)}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por motivo o item"
            filters={(
              <>
                <select
                  className={cn(inventorySelectClassName, "lg:max-w-[240px]")}
                  value={movementItemFilter}
                  onChange={(event) => {
                    setMovementItemFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todos los items</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setMovementItemFilter("");
                    setPage(1);
                  }}
                  disabled={!search && !normalizedMovementItemFilter}
                ><RotateCcw className="size-4" />Limpiar filtros</Button>
              </>
            )}
            createLabel="Nuevo movimiento"
            onCreate={() => {
              resetForm();
              setErrorMessage(null);
              setIsModalOpen(true);
            }}
            exportAction={() =>
              downloadCsv(
                "inventory-stock-movements.csv",
                [
                  { label: "Item", value: (movement) => itemsById.get(movement.itemId)?.name ?? "" },
                  { label: "Direccion", value: (movement) => movement.direction },
                  { label: "Cantidad", value: (movement) => movement.quantity },
                  { label: "Motivo", value: (movement) => movement.reason },
                  { label: "Fecha", value: (movement) => movement.createdAt },
                ],
                visibleMovements,
              )
            }
            importAction={() => fileInputRef.current?.click()}
            table={(
              <InventoryDataTable
                hasRows={visibleMovements.length > 0}
                empty={
                  search || normalizedMovementItemFilter
                    ? "Sin movimientos para los filtros aplicados."
                    : "Sin movimientos registrados."
                }
                columns={(
                  <>
                    <InventoryCell header>Movimiento</InventoryCell>
                    <InventoryCell header>Item</InventoryCell>
                    <InventoryCell header>Motivo</InventoryCell>
                    <InventoryCell header>Fecha</InventoryCell>
                    <InventoryCell header className="text-right">Acciones</InventoryCell>
                  </>
                )}
              >
                {visibleMovements.map((movement) => (
                  <InventoryRow key={movement.id}>
                    <InventoryCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{movement.direction === "in" ? "Entrada" : "Salida"}</p>
                        <p className="text-xs text-muted-foreground">Cantidad: {movement.quantity}</p>
                      </div>
                    </InventoryCell>
                    <InventoryCell>
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">{itemsById.get(movement.itemId)?.name ?? "Item no disponible"}</p>
                        <p className="text-xs text-muted-foreground">{itemsById.get(movement.itemId)?.sku ?? "Sin SKU"}</p>
                      </div>
                    </InventoryCell>
                    <InventoryCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={movement.direction === "in" ? "outline" : "secondary"} className="rounded-md">
                          {movement.direction === "in" ? "Entrada" : "Salida"}
                        </Badge>
                        <span className="text-sm text-foreground/85">{movement.reason}</span>
                      </div>
                    </InventoryCell>
                    <InventoryCell>{formatSpanishLongDate(movement.createdAt)}</InventoryCell>
                    <InventoryCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormState({
                            itemId: movement.itemId,
                            direction: movement.direction,
                            quantity: String(movement.quantity),
                            reason: movement.reason,
                          });
                          setErrorMessage(null);
                          setIsModalOpen(true);
                        }}
                      ><Copy className="size-4" />Duplicar</Button>
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
            title="Ayuda stock"
            items={[
              "Usa motivos claros para cada movimiento.",
              "Valida item y cantidad antes de confirmar salida.",
              "Ante conflicto, revisa auditoria con traceId.",
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
        title="Nuevo movimiento"
        description="Registra entradas o salidas con motivo trazable y reutiliza movimientos frecuentes."
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
            <Button type="button" variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}><ArrowRightLeft className="size-4" />Registrar movimiento</Button>
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
            <label className="field-label">Direccion</label>
            <select
              className={inventorySelectClassName}
              value={formState.direction}
              onChange={(event) => setFormState({ ...formState, direction: event.target.value })}
            >
              <option value="out">Salida</option>
              <option value="in">Entrada</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="field-label">Cantidad</label>
            <Input
              type="number"
              value={formState.quantity}
              onChange={(event) => setFormState({ ...formState, quantity: event.target.value })}
              placeholder="1"
              className="h-10 rounded-md bg-background/80"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Motivo</label>
            <Input
              value={formState.reason}
              onChange={(event) => setFormState({ ...formState, reason: event.target.value })}
              placeholder="Venta, ajuste, compra"
              className="h-10 rounded-md bg-background/80"
            />
          </div>
        </div>
      </InventoryFormModal>
    </div>
  );
}










