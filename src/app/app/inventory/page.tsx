"use client";

import { useSearchParams } from "next/navigation";
import {
  InventoryWorkspace,
  resolveInventoryTabKey,
} from "@/components/modules/inventory/inventory-workspace";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { InventoryHelpPanel } from "@/components/modules/inventory/inventory-help-panel";

export default function InventoryIndexPage() {
  const searchParams = useSearchParams();
  const initialTab = resolveInventoryTabKey(searchParams.get("tab"));

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
              <InventoryWorkspace tenantId={tenant.id} initialTab={initialTab} />

              <InventoryHelpPanel
                title="Recomendaciones y soporte"
                items={[
                  "Revisa alertas criticas y prioriza deficit de stock.",
                  "Entra a Items o Bodegas desde Sub Modulos segun la operacion.",
                  "Usa Reconciliacion para validar diferencias antes de ajustar stock.",
                  "Cierra con Configuracion si detectas capacidad o politica fuera de objetivo.",
                  "Si detectas conflicto de stock o datos inconsistentes, valida primero la vista activa del workspace y luego el ultimo `traceId` disponible en auditoria.",
                ]}
              />
            </div>
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
