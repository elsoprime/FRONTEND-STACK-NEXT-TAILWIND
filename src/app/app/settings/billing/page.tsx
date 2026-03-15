"use client";

import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantBillingProvisioningPanel } from "@/components/tenant/tenant-billing-provisioning-panel";
import { TenantEffectiveSettingsPanel } from "@/components/tenant/tenant-effective-settings-panel";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Volver a tenant settings", href: "/app/settings/tenant" },
  { label: "Abrir runtime efectivo", href: "/app/settings/tenant/effective" },
  { label: "Volver al dashboard", href: "/app" },
];

export default function TenantBillingSettingsPage() {
  return (
    <TenantPageShell
      eyebrow="Billing"
      title="Aprovisionamiento y suscripcion"
      description="Gestiona el plan del tenant y valida runtime efectivo sin salir del shell."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ tenant }) => (
          <div className="space-y-8">
            <TenantBillingProvisioningPanel tenantId={tenant.id} tenantName={tenant.name} />
            <TenantEffectiveSettingsPanel
              tenantId={tenant.id}
              heading="Runtime efectivo despues de provisioning"
              description="Valida plan, modulos y feature flags luego de cambios de suscripcion."
            />
          </div>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
