"use client";

import { useSearchParams } from "next/navigation";
import {
  TenantSettingsWorkspace,
  resolveTenantSettingsTabKey,
} from "@/components/modules/tenant/tenant-settings-workspace";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Billing y plan", href: "/app/settings/billing", variant: "tertiary" },
  { label: "Volver al dashboard", href: "/app", variant: "outline" },
];

export default function TenantSettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = resolveTenantSettingsTabKey(searchParams.get("tab"));

  return (
    <TenantPageShell
      eyebrow="Tenant settings"
      title="Configuracion del tenant"
      description="Workspace unificado para edicion del singleton, validacion del runtime efectivo y soporte operativo del tenant activo."
      actions={ACTIONS}
      breadcrumbItems={[{ label: "Dashboard", href: "/app" }, { label: "Tenant settings" }]}
    >
      <TenantContextGate>
        {({ tenant }) => (
          <TenantSettingsWorkspace
            tenantId={tenant.id}
            tenantName={tenant.name}
            initialTab={initialTab}
          />
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
