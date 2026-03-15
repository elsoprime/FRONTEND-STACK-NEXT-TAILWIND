"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";
import { InventoryOverviewPanel } from "@/components/modules/inventory/inventory-overview-panel";
import { cn } from "@/lib/utils";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Categorias", href: "/app/inventory/categories" },
  { label: "Items", href: "/app/inventory/items" },
  { label: "Stock", href: "/app/inventory/stock" },
  { label: "Alertas", href: "/app/inventory/alerts" },
];

export default function InventoryIndexPage() {
  return (
    <TenantPageShell
      eyebrow="Modulo Inventory"
      title="Inventario"
      description="Gestiona categorias, items y movimientos de stock del tenant activo."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="Inventory" config={MODULE_GUARDS.inventory}>
            <div className="space-y-6">
              <InventoryOverviewPanel tenantId={tenant.id} />
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/app/inventory/categories"
                  className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
                >
                  Gestionar categorias
                </Link>
                <Link
                  href="/app/inventory/items"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-lg")}
                >
                  Gestionar items
                </Link>
                <Link
                  href="/app/inventory/stock"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-lg")}
                >
                  Movimientos de stock
                </Link>
                <Link
                  href="/app/inventory/alerts"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-lg")}
                >
                  Alertas low stock
                </Link>
              </div>
            </div>
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
