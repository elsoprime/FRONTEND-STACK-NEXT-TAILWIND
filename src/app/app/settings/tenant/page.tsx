"use client";

import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantEffectiveSettingsPanel } from "@/components/tenant/tenant-effective-settings-panel";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";
import { TenantSettingsForm } from "@/components/tenant/tenant-settings-form";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Abrir vista efectiva completa", href: "/app/settings/tenant/effective" },
  { label: "Billing y plan", href: "/app/settings/billing" },
  { label: "Volver al dashboard", href: "/app" },
];

export default function TenantSettingsPage() {
  return (
    <TenantPageShell
      eyebrow="Tenant settings"
      title="Configuracion del tenant"
      description="Lectura y actualizacion del singleton tenant-scoped sincronizado con el runtime efectivo."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ tenant }) => (
          <div className="space-y-8">
            <TenantSettingsForm tenantId={tenant.id} tenantName={tenant.name} />
            <TenantEffectiveSettingsPanel
              tenantId={tenant.id}
              heading="Resumen efectivo actual"
              description="Vista efectiva actual del tenant para validar resultado final aplicado al runtime."
            />
          </div>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
