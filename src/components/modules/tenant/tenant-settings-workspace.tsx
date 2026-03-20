"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import {
  ChevronRight,
  FileSpreadsheet,
  Layers3,
  Settings2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TenantEffectiveSettingsPanel } from "@/components/tenant/tenant-effective-settings-panel";
import { TenantSettingsForm } from "@/components/tenant/tenant-settings-form";
import { cn } from "@/lib/utils";

type TenantSettingsWorkspaceProps = {
  tenantId: string;
  tenantName: string;
  initialTab?: TenantSettingsTabKey;
};

export type TenantSettingsTabKey = "config" | "effective" | "operations";

export function resolveTenantSettingsTabKey(value: string | null): TenantSettingsTabKey {
  switch (value) {
    case "effective":
    case "operations":
      return value;
    default:
      return "config";
  }
}

type TenantSettingsTabItem = {
  key: TenantSettingsTabKey;
  label: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TENANT_SETTINGS_TABS: readonly TenantSettingsTabItem[] = [
  {
    key: "config",
    label: "Configuracion",
    summary: "Edicion del singleton tenant",
    icon: Settings2,
  },
  {
    key: "effective",
    label: "Vista efectiva",
    summary: "Resolucion final y runtime",
    icon: Layers3,
  },
  {
    key: "operations",
    label: "Operativa",
    summary: "Checklist y evolucion del modulo",
    icon: SlidersHorizontal,
  },
] as const;

export function TenantSettingsWorkspace({
  tenantId,
  tenantName,
  initialTab = "config",
}: TenantSettingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TenantSettingsTabKey>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <TenantSettingsWorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />

      <section className="overflow-hidden sm:p-5">
        {activeTab === "config" ? (
          <TenantSettingsConfigTab tenantId={tenantId} tenantName={tenantName} />
        ) : null}
        {activeTab === "effective" ? <TenantSettingsEffectiveTab tenantId={tenantId} /> : null}
        {activeTab === "operations" ? <TenantSettingsOperationsTab /> : null}
      </section>
    </div>
  );
}

function TenantSettingsWorkspaceTabs({
  activeTab,
  onChange,
}: {
  activeTab: TenantSettingsTabKey;
  onChange: (key: TenantSettingsTabKey) => void;
}) {
  return (
    <section className="overflow-hidden rounded-md border-border/90 bg-card/96 p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="label-kicker text-primary/90">Workspace Tenant Settings</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Configuracion, runtime y operativa del tenant
          </h2>
          <p className="max-w-3xl text-sm dashboard-text-muted">
            Unifica la edicion del singleton, la validacion del runtime efectivo y el soporte
            operativo en una sola superficie consistente con los workspaces del sistema.
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Tabs del modulo tenant settings" className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-border/85 px-1">
          {TENANT_SETTINGS_TABS.map((tab) => {
            const active = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`tenant-settings-panel-${tab.key}`}
                onClick={() => startTransition(() => onChange(tab.key))}
                className={cn(
                  "group relative flex min-w-37.5 flex-col gap-1 px-4 py-3 text-left transition-colors",
                  active
                    ? "rounded-t-md border-b border-primary bg-white/10 text-primary shadow-lg"
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

function TenantSettingsConfigTab({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  return (
    <div id="tenant-settings-panel-config" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Configuracion</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Edicion operativa del tenant
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Ajusta branding, localizacion, contacto y facturacion mientras validas el impacto sobre
          el runtime efectivo del tenant.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)]">
        <TenantSettingsForm tenantId={tenantId} tenantName={tenantName} />

        <aside className="space-y-4 xl:sticky xl:top-24">
          <TenantEffectiveSettingsPanel
            tenantId={tenantId}
            heading="Runtime vigente"
            description="Validacion rapida del estado final antes y despues de guardar."
            showDetails={false}
            compact
          />
          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Sugerencia
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Distribuye cambios por bloque para validar marca, localizacion, contacto y billing con menos friccion.</p>
              <p>Usa la vista efectiva para revisar el runtime y el resumen consolidado despues de cada guardado.</p>
            </div>
            <Link href="/app/settings/tenant?tab=effective" className="mt-5 inline-flex">
              <Button variant="secondary">
                <Layers3 className="size-4" />
                Abrir vista efectiva
              </Button>
            </Link>
          </article>
        </aside>
      </div>
    </div>
  );
}

function TenantSettingsEffectiveTab({ tenantId }: { tenantId: string }) {
  return (
    <div id="tenant-settings-panel-effective" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Vista efectiva</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Resolucion final aplicada al tenant
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Consolida configuracion final, defaults heredados y runtime vigente en una superficie de
          auditoria clara y consistente.
        </p>
      </header>

      <TenantEffectiveSettingsPanel tenantId={tenantId} showHeader={false} showDetails showSummaryGrid />
    </div>
  );
}

function TenantSettingsOperationsTab() {
  return (
    <div id="tenant-settings-panel-operations" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Operativa</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Checklist y evolucion del modulo
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Superficie para capacidades auxiliares, recomendaciones operativas y funciones futuras
          asociadas a tenant settings.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <OperationCard
          title="Validaciones por bloque"
          description="Confirmaciones antes de guardar branding, contacto, billing y localizacion de forma independiente."
          icon={SlidersHorizontal}
        />
        <OperationCard
          title="Historial de cambios"
          description="Registro de actor, timestamp y diff funcional para trazabilidad de configuracion."
          icon={FileSpreadsheet}
        />
        <OperationCard
          title="Comparativa y rollback"
          description="Vista antes/despues y restauracion controlada de versiones criticas del singleton."
          icon={Sparkles}
        />
      </div>

      <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold tracking-tight text-foreground">
              Ruta recomendada para soporte operativo
            </h4>
            <p className="mt-1 text-sm dashboard-text-muted">
              Empieza en configuracion, valida en vista efectiva y deja esta superficie para
              capacidades de gobierno y evolucion futura.
            </p>
          </div>
          <Link href="/app/settings/tenant?tab=effective">
            <Button variant="secondary">
              <ChevronRight className="size-4" />
              Ir a vista efectiva
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}

function OperationCard({
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
