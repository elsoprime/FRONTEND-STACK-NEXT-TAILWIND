"use client";

import Link from "next/link";
import { useState } from "react";
import { FileSpreadsheet, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantEffectiveSettingsPanel } from "@/components/tenant/tenant-effective-settings-panel";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";
import { TenantSettingsForm } from "@/components/tenant/tenant-settings-form";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Abrir vista efectiva completa", href: "/app/settings/tenant/effective", variant: "secondary" },
  { label: "Billing y plan", href: "/app/settings/billing", variant: "tertiary" },
  { label: "Volver al dashboard", href: "/app", variant: "outline" },
];

type TenantTabKey = "form" | "summary";

export default function TenantSettingsPage() {
  const [activeTab, setActiveTab] = useState<TenantTabKey>("form");

  return (
    <TenantPageShell
      eyebrow="Tenant settings"
      title="Configuracion del tenant"
      description="Edicion operativa del singleton tenant con validacion inmediata sobre runtime efectivo."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ tenant }) => (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-4">
              <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
                <div className="inline-flex rounded-xl border border-border/80 bg-background/72 p-1">
                  <Button
                    variant={activeTab === "form" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("form")}
                  >
                    Formulario
                  </Button>
                  <Button
                    variant={activeTab === "summary" ? "tertiary" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("summary")}
                  >
                    Resumen avanzado
                  </Button>
                </div>

                <p className="mt-3 text-sm dashboard-text-muted">
                  {activeTab === "form"
                    ? "Actualiza configuracion tenant por bloques funcionales."
                    : "Checklist operativo y recomendaciones para hardening de settings."}
                </p>
              </article>

              {activeTab === "form" ? (
                <TenantSettingsForm tenantId={tenant.id} tenantName={tenant.name} />
              ) : (
                <div className="space-y-4">
                  <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="size-4 text-primary" />
                      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                        Funciones opcionales sugeridas
                      </h3>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm dashboard-text-muted">
                      <li>Validaciones por bloque antes de guardar (branding/contacto/billing).</li>
                      <li>Historial de cambios de configuracion con timestamp y actor.</li>
                      <li>Vista comparativa antes/despues para cambios criticos.</li>
                      <li>Boton restaurar version para rollback de configuracion.</li>
                    </ul>
                  </article>

                  <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="size-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        Necesitas detalle completo del runtime y campos efectivos?
                      </p>
                    </div>
                    <Link href="/app/settings/tenant/effective" className="mt-3 inline-flex">
                      <Button variant="secondary">
                        Abrir vista efectiva completa
                      </Button>
                    </Link>
                  </article>
                </div>
              )}
            </section>

            <aside className="space-y-3 xl:sticky xl:top-24">
              <TenantEffectiveSettingsPanel
                tenantId={tenant.id}
                heading="Vista efectiva"
                description="Resumen compacto del runtime final aplicado."
                showDetails={false}
                compact
              />
              <Link href="/app/settings/tenant/effective" className="inline-flex w-full">
                <Button variant="secondary" className="w-full">
                  Ver detalle completo
                </Button>
              </Link>
            </aside>
          </div>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}




