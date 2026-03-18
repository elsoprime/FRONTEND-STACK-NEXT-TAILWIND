"use client";

import { BookOpenText, LifeBuoy } from "lucide-react";
import { InventoryDashboardHub } from "@/components/modules/inventory/inventory-dashboard-hub";
import { InventoryModuleNav } from "@/components/modules/inventory/inventory-module-nav";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";

export default function InventoryIndexPage() {
  return (
    <TenantPageShell
      eyebrow="Modulo Inventory"
      title="Panel principal de Inventario"
      description="Supervisa metricas clave, estado operativo y accesos rapidos de todo el modulo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Inventory"
            config={MODULE_GUARDS.inventory}
          >
            <div className="space-y-6">
              <InventoryModuleNav />
              <InventoryDashboardHub tenantId={tenant.id} />

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
                  <div className="flex items-center gap-2">
                    <BookOpenText className="size-4 text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                      Flujo recomendado
                    </h2>
                  </div>
                  <ol className="mt-3 space-y-2 text-sm dashboard-text-muted">
                    <li>1. Revisa alertas criticas y prioriza deficit de stock.</li>
                    <li>2. Entra a Items o Bodegas desde accesos rapidos segun la operacion.</li>
                    <li>3. Usa Conteo para validar diferencias antes de reconciliar.</li>
                    <li>4. Revisa auditoria si detectas drift o movimientos inconsistentes.</li>
                  </ol>
                </article>

                <aside className="space-y-4 xl:sticky xl:top-24">
                  <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
                    <div className="flex items-center gap-2">
                      <LifeBuoy className="size-4 text-primary" />
                      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                        Soporte operativo
                      </h3>
                    </div>
                    <p className="mt-2 text-sm dashboard-text-muted">
                      Si detectas conflicto de stock o datos inconsistentes, valida primero la ruta
                      afectada y el ultimo `traceId` disponible en auditoria.
                    </p>
                  </article>
                </aside>
              </div>
            </div>
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
