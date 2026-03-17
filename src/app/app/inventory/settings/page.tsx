"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { MODULE_GUARDS, TenantModuleGate } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import {
  getInventorySettings,
  updateInventorySettings,
} from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function InventorySettingsPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Settings"
      description="Configura politica de asignacion de lotes y capacidades del modulo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Inventory"
            config={MODULE_GUARDS.inventory}
          >
            <SettingsContent
              tenantId={tenant.id}
              queryClient={queryClient}
              setLastTraceId={setLastTraceId}
            />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

function SettingsContent({
  tenantId,
  queryClient,
  setLastTraceId,
}: {
  tenantId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  setLastTraceId: (traceId: string | null) => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: [...queryKeys.inventorySettings(tenantId), "current"],
    queryFn: async () => getInventorySettings(tenantId),
  });

  const mutation = useMutation({
    mutationFn: async (payload: Parameters<typeof updateInventorySettings>[1]) =>
      updateInventorySettings(tenantId, payload),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.inventorySettings(tenantId) });
      setErrorMessage(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveInventoryErrorMessage(error.code, error.message));
      }
    },
  });

  if (settingsQuery.isLoading) {
    return <LoadingScreen variant="inline" label="Cargando settings..." />;
  }

  if (settingsQuery.error || !settingsQuery.data) {
    const err = settingsQuery.error;
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        {err instanceof ApiRequestError
          ? resolveInventoryErrorMessage(err.code, err.message)
          : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR")}
      </div>
    );
  }

  const settings = settingsQuery.data.data.settings;

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-xl border border-border/80 bg-card/80 p-4">
          <h2 className="text-sm font-semibold">Configuracion activa</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <SettingCard label="Politica lotes" value={settings.lotAllocationPolicy} />
            <SettingCard label="Fase rollout" value={settings.rolloutPhase} />
            <SettingCard
              label="Capabilidad bodegas"
              value={String(settings.capabilities.warehouses)}
            />
            <SettingCard label="Capabilidad lotes" value={String(settings.capabilities.lots)} />
            <SettingCard
              label="Capabilidad stocktakes"
              value={String(settings.capabilities.stocktakes)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                mutation.mutate({
                  lotAllocationPolicy: settings.lotAllocationPolicy === "FIFO" ? "FEFO" : "FIFO",
                })
              }
              disabled={mutation.isPending}
            >
              Alternar FIFO/FEFO
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                mutation.mutate({ capabilities: { lots: !settings.capabilities.lots } })
              }
              disabled={mutation.isPending}
            >
              Alternar capabilidad lotes
            </Button>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <InventoryHelpPanel
            title="Ayuda settings"
            items={[
              "FIFO prioriza entrada mas antigua.",
              "FEFO prioriza lote con vencimiento cercano.",
              "Activa capacidades gradualmente por tenant.",
            ]}
          />
        </aside>
      </div>
    </div>
  );
}

function SettingCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-border/80 bg-background/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </article>
  );
}
