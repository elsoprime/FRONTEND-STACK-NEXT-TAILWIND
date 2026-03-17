"use client";

import { Layers3 } from "lucide-react";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantEffectiveSettingsPanel } from "@/components/tenant/tenant-effective-settings-panel";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Volver a tenant settings", href: "/app/settings/tenant" },
  { label: "Abrir Billing y plan", href: "/app/settings/billing" },
  { label: "Volver al dashboard", href: "/app" },
];

export default function TenantSettingsEffectivePage() {
  return (
    <TenantPageShell
      eyebrow="Runtime efectivo"
      title="Vista efectiva del tenant"
      description="Auditoria clara del estado final aplicado en runtime, con menos ruido y mejor jerarquia visual."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ tenant }) => (
          <div className="space-y-5">
            <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
              <div className="flex items-center gap-2">
                <Layers3 className="size-4 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Esta vista consolida configuracion final aplicada y estado runtime del tenant
                  activo.
                </p>
              </div>
            </article>

            <TenantEffectiveSettingsPanel
              tenantId={tenant.id}
              heading="Configuracion efectiva aplicada"
              description="Detalle final consolidado por bloques funcionales para revision operativa."
              showDetails
            />
          </div>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
