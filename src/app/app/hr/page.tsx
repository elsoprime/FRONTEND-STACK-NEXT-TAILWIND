"use client";

import Link from "next/link";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";
import { HrOverviewPanel } from "@/components/modules/hr/hr-overview-panel";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Gestionar empleados", href: "/app/hr/employees" },
  { label: "Volver al dashboard", href: "/app" },
];

export default function HrModulePage() {
  return (
    <TenantPageShell
      eyebrow="Modulo HR"
      title="Recursos Humanos"
      description="Vista de consumo del API de HR acoplada al tenant activo."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="HR" config={MODULE_GUARDS.hr}>
            <div className="space-y-6">
              <HrOverviewPanel tenantId={tenant.id} />
              <div className="rounded-xl border border-border/80 bg-background/70 p-4 text-sm text-muted-foreground">
                Revisa la informacion detallada de empleados, compensaciones y estado contractual en el modulo HR.
                <div className="mt-2">
                  <Link href="/app/hr/employees" className="text-primary underline-offset-2 hover:underline">
                    Ir a empleados
                  </Link>
                </div>
              </div>
            </div>
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
