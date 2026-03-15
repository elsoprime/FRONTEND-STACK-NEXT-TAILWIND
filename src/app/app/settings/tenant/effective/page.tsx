"use client";

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
      description="Resolucion final del tenant activo sobre branding, localizacion, contacto, billing y runtime."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ tenant }) => <TenantEffectiveSettingsPanel tenantId={tenant.id} />}
      </TenantContextGate>
    </TenantPageShell>
  );
}
