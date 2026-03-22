"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import {
  ChevronRight,
  CreditCard,
  Layers3,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { TenantBillingProvisioningPanel } from "@/components/tenant/tenant-billing-provisioning-panel";
import { TenantEffectiveSettingsPanel } from "@/components/tenant/tenant-effective-settings-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingSettingsWorkspaceProps = {
  tenantId: string;
  tenantName: string;
  initialTab?: BillingSettingsTabKey;
};

export type BillingSettingsTabKey = "subscription" | "runtime" | "operations";

export function resolveBillingSettingsTabKey(value: string | null): BillingSettingsTabKey {
  switch (value) {
    case "runtime":
    case "operations":
      return value;
    default:
      return "subscription";
  }
}

type BillingTabItem = {
  key: BillingSettingsTabKey;
  label: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
};

const BILLING_TABS: readonly BillingTabItem[] = [
  {
    key: "subscription",
    label: "Suscripcion",
    summary: "Plan, checkout y activacion",
    icon: CreditCard,
  },
  {
    key: "runtime",
    label: "Runtime",
    summary: "Impacto efectivo del plan",
    icon: Layers3,
  },
  {
    key: "operations",
    label: "Operativa",
    summary: "Conciliacion y roadmap",
    icon: Sparkles,
  },
] as const;

export function BillingSettingsWorkspace({
  tenantId,
  tenantName,
  initialTab = "subscription",
}: BillingSettingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<BillingSettingsTabKey>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-7">
      <BillingWorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />

      <section className="overflow-hidden sm:p-6">
        {activeTab === "subscription" ? (
          <BillingSubscriptionTab tenantId={tenantId} tenantName={tenantName} />
        ) : null}
        {activeTab === "runtime" ? <BillingRuntimeTab tenantId={tenantId} /> : null}
        {activeTab === "operations" ? <BillingOperationsTab /> : null}
      </section>
    </div>
  );
}

function BillingWorkspaceTabs({
  activeTab,
  onChange,
}: {
  activeTab: BillingSettingsTabKey;
  onChange: (key: BillingSettingsTabKey) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border-border/90 bg-card/96 p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="label-kicker text-primary/90">Workspace Billing</p>
          <h2 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
            Suscripcion, runtime y control operativo
          </h2>
          <p className="max-w-3xl text-sm dashboard-text-muted">
            Separa la activacion comercial del plan, la validacion del runtime y la operacion del
            modulo sin tocar la logica critica de aprovisionamiento.
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Tabs del modulo billing" className="mt-6 overflow-x-auto">
        <div className="flex min-w-max gap-1.5 border-b border-border/85 px-1">
          {BILLING_TABS.map((tab) => {
            const active = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`billing-panel-${tab.key}`}
                onClick={() => startTransition(() => onChange(tab.key))}
                className={cn(
                  "group relative flex min-w-37.5 flex-col gap-1 px-4 py-3 text-left transition-colors",
                  active
                    ? "rounded-t-xl border-b border-primary bg-white/10 text-primary shadow-lg"
                    : "text-foreground/58 hover:text-foreground",
                )}
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <tab.icon className={cn("size-4", active ? "text-primary" : "text-foreground/45")} />
                  {tab.label}
                </span>
                <span className={cn("text-xs text-foreground/60", active ? "font-bold" : "font-extralight")}>
                  {tab.summary}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BillingSubscriptionTab({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  return (
    <div id="billing-panel-subscription" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Suscripcion</p>
        <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
          Activacion comercial del tenant
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Selecciona plan, inicia checkout y confirma activacion desde una superficie centrada en
          el flujo comercial del tenant.
        </p>
      </header>

      <TenantBillingProvisioningPanel
        tenantId={tenantId}
        tenantName={tenantName}
        sideContent={
          <>
            <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
                Recomendacion operativa
              </h4>
              <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
                <p>Completa checkout y verifica activacion antes de cambiar de tab para evitar perder el contexto temporal del flujo.</p>
                <p>Usa el runtime despues de cada cambio de plan para confirmar modulos y feature flags efectivos.</p>
              </div>
              <Link href="/app/settings/billing?tab=runtime" className="mt-5 inline-flex">
                <Button variant="secondary">
                  <Layers3 className="size-4" />
                  Abrir runtime
                </Button>
              </Link>
            </article>

            <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
                Alcance del modulo
              </h4>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
                  Checkout
                </Badge>
                <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
                  Activacion
                </Badge>
                <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
                  Cancelacion
                </Badge>
              </div>
            </article>
          </>
        }
      />
    </div>
  );
}

function BillingRuntimeTab({ tenantId }: { tenantId: string }) {
  return (
    <div id="billing-panel-runtime" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Runtime</p>
        <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
          Impacto efectivo del plan activo
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Valida como el plan asignado modifica modulos, feature flags y disponibilidad final del
          tenant sin mezclar esta lectura con el flujo comercial.
        </p>
      </header>

      <TenantEffectiveSettingsPanel tenantId={tenantId} showHeader={false} showDetails showSummaryGrid />
    </div>
  );
}

function BillingOperationsTab() {
  return (
    <div id="billing-panel-operations" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Operativa</p>
        <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
          Conciliacion y evolucion del modulo
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Superficie reservada para seguimiento operacional del billing, conciliacion de sesiones y
          capacidades futuras del modulo.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BillingOperationCard
          title="Conciliacion de checkout"
          description="Revision de sesiones pendientes, pagos simulados y validacion de activacion posterior."
          icon={ReceiptText}
        />
        <BillingOperationCard
          title="Auditoria de suscripcion"
          description="Registro de actor, plan anterior, plan nuevo y timestamp para cambios comerciales sensibles."
          icon={ShieldCheck}
        />
        <BillingOperationCard
          title="Roadmap de billing"
          description="Reintentos, conciliacion manual, proveedores reales y eventos webhook para fases siguientes."
          icon={Sparkles}
        />
      </div>

      <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold tracking-tight text-foreground">
              Ruta recomendada del flujo
            </h4>
            <p className="mt-1 text-sm dashboard-text-muted">
              Activa o cancela desde Suscripcion, valida el impacto en Runtime y usa esta superficie
              para gobierno operativo del modulo.
            </p>
          </div>
          <Link href="/app/settings/billing?tab=subscription">
            <Button variant="secondary">
              <ChevronRight className="size-4" />
              Volver a suscripcion
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}

function BillingOperationCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
      <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
        Evolutivo
      </Badge>
      <div className="mt-4 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <h4 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed dashboard-text-muted">{description}</p>
    </article>
  );
}
