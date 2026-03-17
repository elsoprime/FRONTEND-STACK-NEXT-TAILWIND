"use client";

import Link from "next/link";
import { BookOpenText, LifeBuoy, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";
import { InventoryOverviewPanel } from "@/components/modules/inventory/inventory-overview-panel";
import { cn } from "@/lib/utils";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Items", href: "/app/inventory/items" },
  { label: "Categorias", href: "/app/inventory/categories" },
  { label: "Stock", href: "/app/inventory/stock" },
  { label: "Alertas", href: "/app/inventory/alerts" },
];

export default function InventoryIndexPage() {
  return (
    <TenantPageShell
      eyebrow="Modulo Inventory"
      title="Panel principal de Inventario"
      description="Monitorea estado operativo, metricas esenciales y acciones rapidas del modulo Inventory."
      actions={ACTIONS}
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
              <InventoryOverviewPanel tenantId={tenant.id} />

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="space-y-4">
                  <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                        Acciones rapidas
                      </h2>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href="/app/inventory/items"
                        className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
                      >
                        Gestionar items
                      </Link>
                      <Link
                        href="/app/inventory/categories"
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                          "rounded-lg",
                        )}
                      >
                        Gestionar categorias
                      </Link>
                      <Link
                        href="/app/inventory/stock"
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                          "rounded-lg",
                        )}
                      >
                        Registrar movimiento
                      </Link>
                      <Link
                        href="/app/inventory/alerts"
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                          "rounded-lg",
                        )}
                      >
                        Ver alertas
                      </Link>
                    </div>
                  </article>

                  <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
                    <div className="flex items-center gap-2">
                      <BookOpenText className="size-4 text-primary" />
                      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                        Panel de ayuda
                      </h2>
                    </div>
                    <ol className="mt-3 space-y-2 text-sm dashboard-text-muted">
                      <li>1. Crea categorias base para ordenar el catalogo.</li>
                      <li>2. Registra items con SKU unico y stock minimo.</li>
                      <li>3. Carga movimientos de entrada/salida con motivo.</li>
                      <li>4. Monitorea alertas de bajo stock y corrige deficit.</li>
                    </ol>
                  </article>
                </section>

                <aside className="space-y-4 xl:sticky xl:top-24">
                  <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
                    <div className="flex items-center gap-2">
                      <LifeBuoy className="size-4 text-primary" />
                      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                        Soporte operativo
                      </h3>
                    </div>
                    <p className="mt-2 text-sm dashboard-text-muted">
                      Si detectas conflicto de stock o datos inconsistentes, valida primero los
                      ultimos movimientos y su `traceId` en auditoria.
                    </p>
                    <Link href="/app/audit" className="mt-3 inline-flex">
                      <span
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                          "rounded-lg",
                        )}
                      >
                        Abrir auditoria
                      </span>
                    </Link>
                  </article>
                </aside>
              </div>
            </div>
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
