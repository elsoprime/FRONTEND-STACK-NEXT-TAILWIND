"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCheck, Plus, RotateCcw, X } from "lucide-react";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { MODULE_GUARDS, TenantModuleGate } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DecisionDialog } from "@/components/ui/decision-dialog";
import { Input } from "@/components/ui/input";
import { InventoryFormModal } from "@/components/ui/inventory-form-modal";
import { InventoryCell, InventoryDataTable, InventoryRecordsShell, InventoryRow, inventorySelectClassName } from "@/components/ui/inventory-records-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { applyInventoryStocktake, cancelInventoryStocktake, createInventoryStocktake, listInventoryStocktakes, listInventoryWarehouses } from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { downloadCsv } from "@/lib/export-csv";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";

const STOCKTAKE_STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "applied", label: "Applied" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type StocktakeStatus = Exclude<(typeof STOCKTAKE_STATUS_OPTIONS)[number]["value"], "">;
type StocktakeDecision = { id: string; name: string; mode: "apply" | "cancel" } | null;

export default function InventoryStocktakesPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [formState, setFormState] = useState({ warehouseId: "", name: "" });
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  return (
    <TenantPageShell eyebrow="Inventory" title="Conteos (Stocktakes)" description="Gestiona sesiones de conteo y cierre operativo de inventario por bodega." breadcrumbItems={[{ label: "Dashboard", href: "/app" }, { label: "Inventario", href: "/app/inventory" }, { label: "Conteo" }]} backHref="/app/inventory" backLabel="Volver a Panel principal">
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="Inventory" config={MODULE_GUARDS.inventory}>
            <InventoryStocktakesContent tenantId={tenant.id} queryClient={queryClient} setLastTraceId={setLastTraceId} formState={formState} setFormState={setFormState} formErrorMessage={formErrorMessage} setFormErrorMessage={setFormErrorMessage} actionErrorMessage={actionErrorMessage} setActionErrorMessage={setActionErrorMessage} />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type StocktakesContentProps = {
  tenantId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  setLastTraceId: (traceId: string | null) => void;
  formState: { warehouseId: string; name: string };
  setFormState: (value: StocktakesContentProps["formState"]) => void;
  formErrorMessage: string | null;
  setFormErrorMessage: (value: string | null) => void;
  actionErrorMessage: string | null;
  setActionErrorMessage: (value: string | null) => void;
};

function InventoryStocktakesContent({ tenantId, queryClient, setLastTraceId, formState, setFormState, formErrorMessage, setFormErrorMessage, actionErrorMessage, setActionErrorMessage }: StocktakesContentProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StocktakeStatus | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [decision, setDecision] = useState<StocktakeDecision>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const limit = 20;
  const normalizedSearch = search.trim().toLowerCase();

  const warehousesQuery = useQuery({ queryKey: [...queryKeys.inventoryWarehouses(tenantId), "for-stocktakes"], queryFn: async () => listInventoryWarehouses(tenantId, { page: 1, limit: 100 }) });
  const stocktakesQuery = useQuery({ queryKey: [...queryKeys.inventoryStocktakes(tenantId), "list", page, limit, warehouseFilter, statusFilter], queryFn: async () => listInventoryStocktakes(tenantId, { page, limit, warehouseId: warehouseFilter || undefined, status: statusFilter || undefined }) });

  const createMutation = useMutation({ mutationFn: async () => { if (!formState.warehouseId || !formState.name.trim()) throw new Error("Selecciona bodega e ingresa nombre del conteo."); return createInventoryStocktake(tenantId, { warehouseId: formState.warehouseId, name: formState.name.trim() }); }, onSuccess: (response) => { setLastTraceId(response.traceId); void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStocktakes(tenantId) }); setFormErrorMessage(null); setNoticeMessage(null); setFormState({ warehouseId: "", name: "" }); setIsModalOpen(false); }, onError: (error: unknown) => { if (error instanceof ApiRequestError) { setLastTraceId(error.traceId ?? null); setFormErrorMessage(resolveInventoryErrorMessage(error.code, error.message)); return; } setFormErrorMessage(error instanceof Error ? error.message : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR")); } });
  const applyMutation = useMutation({ mutationFn: async (stocktakeId: string) => applyInventoryStocktake(tenantId, stocktakeId), onSuccess: (response) => { setLastTraceId(response.traceId); void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStocktakes(tenantId) }); setActionErrorMessage(null); setDecision(null); }, onError: (error: unknown) => { if (error instanceof ApiRequestError) { setLastTraceId(error.traceId ?? null); setActionErrorMessage(resolveInventoryErrorMessage(error.code, error.message)); } } });
  const cancelMutation = useMutation({ mutationFn: async (stocktakeId: string) => cancelInventoryStocktake(tenantId, stocktakeId), onSuccess: (response) => { setLastTraceId(response.traceId); void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStocktakes(tenantId) }); setActionErrorMessage(null); setDecision(null); }, onError: (error: unknown) => { if (error instanceof ApiRequestError) { setLastTraceId(error.traceId ?? null); setActionErrorMessage(resolveInventoryErrorMessage(error.code, error.message)); } } });

  if (warehousesQuery.isLoading || stocktakesQuery.isLoading) return <LoadingScreen variant="inline" className="mt-4" label="Cargando conteos..." hint="Sincronizando sesiones de stocktake del tenant." />;
  if (warehousesQuery.error || stocktakesQuery.error) { const err = warehousesQuery.error ?? stocktakesQuery.error; const message = err instanceof ApiRequestError ? resolveInventoryErrorMessage(err.code, err.message) : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR"); return <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">{message}</div>; }

  const warehouses = warehousesQuery.data?.data.items ?? [];
  const stocktakes = stocktakesQuery.data?.data.items ?? [];
  const pagination = stocktakesQuery.data?.pagination;
  const warehousesById = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.name]));
  const visibleStocktakes = stocktakes.filter((stocktake) => !normalizedSearch || [stocktake.name, warehousesById.get(stocktake.warehouseId), stocktake.status].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch)));
  const decisionLoading = applyMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-6">
      <InventoryModuleNav />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {noticeMessage ? <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-foreground/90">{noticeMessage}</div> : null}
          {actionErrorMessage ? <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">{actionErrorMessage}</div> : null}
          <InventoryRecordsShell title="Sesiones de conteo" description="Controla sesiones por bodega, su estado de ejecucion y las acciones de cierre directamente desde la tabla." badgeLabel="Auditoria fisica" countLabel="Total visible" countValue={String(pagination?.total ?? stocktakes.length)} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar stocktake" filters={<><select className={cn(inventorySelectClassName, "lg:max-w-[220px]")} value={warehouseFilter} onChange={(event) => { setWarehouseFilter(event.target.value); setPage(1); }}><option value="">Todas las bodegas</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select><select className={cn(inventorySelectClassName, "lg:max-w-[220px]")} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as StocktakeStatus | ""); setPage(1); }}>{STOCKTAKE_STATUS_OPTIONS.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}</select><Button type="button" size="sm" variant="outline" onClick={() => { setSearch(""); setWarehouseFilter(""); setStatusFilter(""); setPage(1); }} disabled={!search && !warehouseFilter && !statusFilter}><RotateCcw className="size-4" />Limpiar filtros</Button></>} createLabel="Nuevo conteo" onCreate={() => { setFormState({ warehouseId: "", name: "" }); setFormErrorMessage(null); setIsModalOpen(true); }} exportAction={() => downloadCsv("inventory-stocktakes.csv", [{ label: "Nombre", value: (stocktake) => stocktake.name }, { label: "Bodega", value: (stocktake) => warehousesById.get(stocktake.warehouseId) ?? "" }, { label: "Estado", value: (stocktake) => stocktake.status }, { label: "Lineas", value: (stocktake) => stocktake.lines.length }, { label: "Actualizado", value: (stocktake) => stocktake.updatedAt }], visibleStocktakes)} importAction={() => fileInputRef.current?.click()} table={<InventoryDataTable hasRows={visibleStocktakes.length > 0} empty={search || warehouseFilter || statusFilter ? "Sin resultados para los filtros aplicados." : "Sin stocktakes registrados."} columns={<><InventoryCell header>Conteo</InventoryCell><InventoryCell header>Bodega</InventoryCell><InventoryCell header>Estado</InventoryCell><InventoryCell header>Actualizacion</InventoryCell><InventoryCell header className="text-right">Acciones</InventoryCell></>}>{visibleStocktakes.map((stocktake) => { const canMutate = stocktake.status !== "applied" && stocktake.status !== "cancelled"; return <InventoryRow key={stocktake.id}><InventoryCell><div className="space-y-1"><p className="font-semibold text-foreground">{stocktake.name}</p><p className="text-xs text-muted-foreground">Lineas: {stocktake.lines.length}</p></div></InventoryCell><InventoryCell>{warehousesById.get(stocktake.warehouseId) ?? "Bodega no disponible"}</InventoryCell><InventoryCell><Badge variant={stocktake.status === "applied" ? "outline" : "secondary"} className="rounded-md capitalize">{stocktake.status}</Badge></InventoryCell><InventoryCell>{formatSpanishLongDate(stocktake.updatedAt)}</InventoryCell><InventoryCell className="text-right"><div className="flex justify-end gap-2">{canMutate ? <Button type="button" size="sm" variant="outline" onClick={() => { setActionErrorMessage(null); setDecision({ id: stocktake.id, name: stocktake.name, mode: "apply" }); }}><CheckCheck className="size-4" />Aplicar</Button> : null}{canMutate ? <Button type="button" size="sm" variant="destructive" onClick={() => { setActionErrorMessage(null); setDecision({ id: stocktake.id, name: stocktake.name, mode: "cancel" }); }}><Ban className="size-4" />Cancelar</Button> : null}</div></InventoryCell></InventoryRow>; })}</InventoryDataTable>} pagination={pagination ? <InventoryPaginationControls page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} /> : null} />
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setNoticeMessage(`Archivo preparado para importacion: ${file.name}. La carga asistida se conectara al flujo backend cuando exista contrato.`); event.target.value = ""; }} />
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24"><InventoryHelpPanel title="Ayuda stocktakes" items={["Crea el stocktake por bodega para aislar diferencias.", "Valida lineas antes de aplicar para evitar ajustes no deseados.", "Si hay conflicto, usa traceId para auditoria operativa."]} /></aside>
      </div>
      <InventoryFormModal open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) { setFormState({ warehouseId: "", name: "" }); setFormErrorMessage(null); } }} title="Nuevo stocktake" description="Inicia una sesion de conteo para una bodega especifica sin abandonar la tabla de seguimiento." alert={formErrorMessage ? <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">{formErrorMessage}</div> : null} footer={<><Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setFormState({ warehouseId: "", name: "" }); setFormErrorMessage(null); }} disabled={createMutation.isPending}><X className="size-4" />Cancelar</Button><Button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}><Plus className="size-4" />Crear stocktake</Button></>}><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><label className="field-label">Bodega</label><select className={inventorySelectClassName} value={formState.warehouseId} onChange={(event) => setFormState({ ...formState, warehouseId: event.target.value })}><option value="">Selecciona una bodega</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div><div className="space-y-2"><label className="field-label">Nombre</label><Input value={formState.name} onChange={(event) => setFormState({ ...formState, name: event.target.value })} placeholder="Conteo mensual bodega central" className="h-10 rounded-md bg-background/80" /></div></div></InventoryFormModal>
      <DecisionDialog open={Boolean(decision)} onOpenChange={(open) => { if (!open) setDecision(null); }} title={decision?.mode === "cancel" ? "Cancelar stocktake" : "Aplicar stocktake"} description={decision?.mode === "cancel" ? "Esta accion cerrara la sesion de conteo sin aplicar ajustes." : "Esta accion aplicara los ajustes del conteo seleccionado."} tone={decision?.mode === "cancel" ? "danger" : "default"} confirmLabel={decision?.mode === "cancel" ? "Cancelar stocktake" : "Aplicar stocktake"} busyLabel="Procesando..." loading={decisionLoading} onConfirm={async () => { if (!decision) return; if (decision.mode === "cancel") { await cancelMutation.mutateAsync(decision.id); return; } await applyMutation.mutateAsync(decision.id); }}>{decision ? `Confirma la accion sobre ${decision.name}.` : null}</DecisionDialog>
    </div>
  );
}
