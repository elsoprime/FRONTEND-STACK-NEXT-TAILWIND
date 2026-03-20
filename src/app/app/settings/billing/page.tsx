"use client";

import { useSearchParams } from "next/navigation";
import {
  BillingSettingsWorkspace,
  resolveBillingSettingsTabKey,
} from "@/components/modules/billing/billing-settings-workspace";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Volver a tenant settings", href: "/app/settings/tenant", variant: "secondary" },
  { label: "Abrir runtime", href: "/app/settings/billing?tab=runtime", variant: "tertiary" },
  { label: "Volver al dashboard", href: "/app", variant: "outline" },
];

export default function TenantBillingSettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = resolveBillingSettingsTabKey(searchParams.get("tab"));

  return (
    <TenantPageShell
      eyebrow="Billing"
      title="Aprovisionamiento y suscripcion"
      description="Workspace unificado para activar planes, validar runtime y preparar la operacion de billing del tenant activo."
      actions={ACTIONS}
      breadcrumbItems={[{ label: "Dashboard", href: "/app" }, { label: "Billing" }]}
    >
      <TenantContextGate>
        {({ tenant }) => (
          <BillingSettingsWorkspace
            tenantId={tenant.id}
            tenantName={tenant.name}
            initialTab={initialTab}
          />
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
