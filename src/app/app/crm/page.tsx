"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";
import { CrmOverviewPanel } from "@/components/modules/crm/crm-overview-panel";
import { cn } from "@/lib/utils";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Contactos", href: "/app/crm/contacts" },
  { label: "Organizaciones", href: "/app/crm/organizations" },
  { label: "Oportunidades", href: "/app/crm/opportunities" },
  { label: "Actividades", href: "/app/crm/activities" },
];

export default function CrmIndexPage() {
  return (
    <TenantPageShell
      eyebrow="Modulo CRM"
      title="CRM"
      description="Gestiona contactos, organizaciones y oportunidades del pipeline."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="CRM" config={MODULE_GUARDS.crm}>
            <div className="space-y-6">
              <CrmOverviewPanel tenantId={tenant.id} />
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/app/crm/contacts"
                  className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
                >
                  Gestionar contactos
                </Link>
                <Link
                  href="/app/crm/organizations"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-lg")}
                >
                  Gestionar organizaciones
                </Link>
                <Link
                  href="/app/crm/opportunities"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-lg")}
                >
                  Pipeline de oportunidades
                </Link>
                <Link
                  href="/app/crm/activities"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-lg")}
                >
                  Actividades
                </Link>
              </div>
            </div>
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
