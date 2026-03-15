"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import {
  createInventoryStockMovement,
  listInventoryItems,
  listInventoryStockMovements,
} from "@/features/inventory/inventory.service";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
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

  const resetForm = () =>
    setFormState({ itemId: "", direction: "out", quantity: "", reason: "" });

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Movimientos de stock"
      description="Registra entradas y salidas de inventario con validaciones de negocio."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="Inventory" config={MODULE_GUARDS.inventory}>
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
  const itemsQuery = useQuery({
    queryKey: queryKeys.inventoryItems(tenantId),
    queryFn: async () => listInventoryItems(tenantId, { page: 1, limit: 100 }),
  });

  const movementsQuery = useQuery({
    queryKey: queryKeys.inventoryStockMovements(tenantId),
    queryFn: async () => listInventoryStockMovements(tenantId, { page: 1, limit: 50 }),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStockMovements(tenantId) });
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

      setErrorMessage(error instanceof Error ? error.message : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR"));
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Nuevo movimiento</p>
            <p className="text-xs text-muted-foreground">Registra entradas o salidas con motivo.</p>
          </div>
          <Button size="sm" variant="outline" onClick={resetForm} disabled={!formState.itemId && !formState.reason}>
            Limpiar
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Item</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
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
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
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
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Motivo</label>
            <Input
              value={formState.reason}
              onChange={(event) => setFormState({ ...formState, reason: event.target.value })}
              placeholder="Venta, ajuste, compra"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Registrar movimiento
          </Button>
        </div>

        {errorMessage ? (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Movimientos recientes</h2>
          <Link href="/app/inventory" className="text-sm text-primary underline-offset-2 hover:underline">
            Volver al overview
          </Link>
        </div>
        {movements.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
            Sin movimientos registrados.
          </div>
        ) : (
          <div className="space-y-2">
            {movements.map((movement) => (
              <div key={movement.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/70 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {movement.direction === "in" ? "Entrada" : "Salida"} · {movement.quantity}
                  </p>
                  <p className="text-xs text-muted-foreground">{movement.reason}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(movement.createdAt).toLocaleString("es-CL")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
