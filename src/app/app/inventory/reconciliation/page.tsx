"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { MODULE_GUARDS, TenantModuleGate } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { resolveInventoryErrorMessage } from "@/features/inventory/error-code-map";
import { getInventoryReconciliation } from "@/features/inventory/inventory.service";
import { ApiRequestError } from "@/lib/api/client";
import { formatSpanishLongDate } from "@/lib/format-spanish-long-date";
import { queryKeys } from "@/lib/query/query-keys";

export default function InventoryReconciliationPage() {
  return (
    <TenantPageShell
      eyebrow="Inventory"
      title="Reconciliacion"
      description="Compara movimientos vs balances para detectar drift operativo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Inventory"
            config={MODULE_GUARDS.inventory}
          >
            <ReconciliationContent tenantId={tenant.id} />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

function ReconciliationContent({ tenantId }: { tenantId: string }) {
  const [sinceDays, setSinceDays] = useState(1);

  const reportQuery = useQuery({
    queryKey: [...queryKeys.inventoryReconciliation(tenantId), "report", sinceDays],
    queryFn: async () => getInventoryReconciliation(tenantId, { sinceDays }),
  });

  return (
    <div className="space-y-6">
      <InventoryModuleNav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-card/80 p-4">
            <span className="text-sm font-semibold">Ventana de analisis</span>
            {[1, 7, 30].map((days) => (
              <Button
                key={days}
                size="sm"
                variant={sinceDays === days ? "default" : "outline"}
                onClick={() => setSinceDays(days)}
              >
                {days} dia{days > 1 ? "s" : ""}
              </Button>
            ))}
          </div>

          {reportQuery.isLoading ? (
            <LoadingScreen variant="inline" label="Cargando reconciliacion..." />
          ) : reportQuery.error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
              {reportQuery.error instanceof ApiRequestError
                ? resolveInventoryErrorMessage(reportQuery.error.code, reportQuery.error.message)
                : resolveInventoryErrorMessage("GEN_INTERNAL_ERROR")}
            </div>
          ) : reportQuery.data ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Card label="Estado" value={reportQuery.data.data.report.status} />
              <Card label="Drift" value={String(reportQuery.data.data.report.drift)} />
              <Card
                label="Movimientos"
                value={String(reportQuery.data.data.report.movementCount)}
              />
              <Card
                label="Comparado"
                value={formatSpanishLongDate(reportQuery.data.data.report.comparedAt)}
              />
              <Card
                label="Balance total"
                value={String(reportQuery.data.data.report.balanceTotal)}
              />
              <Card
                label="Stock total items"
                value={String(reportQuery.data.data.report.itemStockTotal)}
              />
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <InventoryHelpPanel
            title="Ayuda reconciliacion"
            items={[
              "Si hay drift_detected, revisa movimientos recientes.",
              "Cruza traceId en auditoria para investigar origen.",
              "Usa ventanas cortas para aislar incidentes.",
            ]}
          />
        </aside>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-border/80 bg-background/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </article>
  );
}
