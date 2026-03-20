"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import {
  BellRing,
  ChevronRight,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { cn } from "@/lib/utils";

type PlatformSecurityTabKey = "overview" | "policies" | "roadmap";

type PlatformSecurityTabItem = {
  key: PlatformSecurityTabKey;
  label: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PLATFORM_SECURITY_TABS: readonly PlatformSecurityTabItem[] = [
  {
    key: "overview",
    label: "Resumen",
    summary: "Estado general y alcance actual",
    icon: ShieldCheck,
  },
  {
    key: "policies",
    label: "Politicas",
    summary: "Controles proyectados de plataforma",
    icon: LockKeyhole,
  },
  {
    key: "roadmap",
    label: "En desarrollo",
    summary: "Dependencias backend y siguientes fases",
    icon: Sparkles,
  },
] as const;

function resolvePlatformSecurityTabKey(value: string | null): PlatformSecurityTabKey {
  switch (value) {
    case "policies":
    case "roadmap":
      return value;
    default:
      return "overview";
  }
}

export default function SecuritySettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [initialTab, setInitialTab] = useState<PlatformSecurityTabKey>("overview");

  useEffect(() => {
    let cancelled = false;

    async function resolveInitialTab() {
      const resolved = searchParams ? await searchParams : undefined;
      const rawTab = Array.isArray(resolved?.tab) ? resolved?.tab[0] : resolved?.tab;
      const nextTab = resolvePlatformSecurityTabKey(rawTab ?? null);
      if (!cancelled) {
        setInitialTab(nextTab);
      }
    }

    void resolveInitialTab();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <TenantPageShell
      eyebrow="Security"
      title="Seguridad de plataforma"
      description="Superficie reservada para controles globales, politicas y endurecimiento transversal del entorno."
      breadcrumbItems={[{ label: "Dashboard", href: "/app" }, { label: "Seguridad de plataforma" }]}
    >
      <PlatformSecurityWorkspace initialTab={initialTab} />
    </TenantPageShell>
  );
}

function PlatformSecurityWorkspace({ initialTab }: { initialTab: PlatformSecurityTabKey }) {
  const [activeTab, setActiveTab] = useState<PlatformSecurityTabKey>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <PlatformSecurityTabs activeTab={activeTab} onChange={setActiveTab} />

      <section className="overflow-hidden sm:p-5">
        {activeTab === "overview" ? <PlatformSecurityOverviewTab /> : null}
        {activeTab === "policies" ? <PlatformSecurityPoliciesTab /> : null}
        {activeTab === "roadmap" ? <PlatformSecurityRoadmapTab /> : null}
      </section>
    </div>
  );
}

function PlatformSecurityTabs({
  activeTab,
  onChange,
}: {
  activeTab: PlatformSecurityTabKey;
  onChange: (key: PlatformSecurityTabKey) => void;
}) {
  return (
    <section className="overflow-hidden rounded-md border-border/90 bg-card/96 p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="label-kicker text-primary/90">Workspace Security</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Controles globales y endurecimiento de plataforma
          </h2>
          <p className="max-w-3xl text-sm dashboard-text-muted">
            Esta superficie no reemplaza la seguridad del usuario. Su objetivo es centralizar las
            capacidades globales del sistema cuando el backend este disponible.
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Tabs del modulo security" className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-border/85 px-1">
          {PLATFORM_SECURITY_TABS.map((tab) => {
            const active = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`platform-security-panel-${tab.key}`}
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

function PlatformSecurityOverviewTab() {
  return (
    <div id="platform-security-panel-overview" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Resumen</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Estado actual de seguridad de plataforma
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Vista ejecutiva para diferenciar claramente los controles globales del sistema frente a la
          seguridad personal del usuario.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PlatformSecurityMetricCard
          label="Politicas globales"
          value="Pendiente"
          hint="Definicion backend no disponible aun."
          icon={ShieldEllipsis}
        />
        <PlatformSecurityMetricCard
          label="Hardening"
          value="Parcial"
          hint="UI preparada, integracion pendiente."
          icon={LockKeyhole}
        />
        <PlatformSecurityMetricCard
          label="Auditoria tecnica"
          value="Planeada"
          hint="Cruce futuro con eventos de plataforma."
          icon={BellRing}
        />
        <PlatformSecurityMetricCard
          label="Feature gates"
          value="Disponible"
          hint="Puede convivir con platform settings existentes."
          icon={Waypoints}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <section className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold tracking-tight text-foreground">
                Alcance propuesto
              </h4>
              <p className="mt-1 text-sm dashboard-text-muted">
                Esta vista esta pensada para controles globales del sistema, no para configuracion
                personal del usuario.
              </p>
            </div>
            <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
              Vista conceptual
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <PlatformSecurityInfoCard
              label="Autenticacion global"
              value="Pendiente de politica central"
            />
            <PlatformSecurityInfoCard
              label="Reglas de acceso"
              value="Dependiente de backend"
            />
            <PlatformSecurityInfoCard
              label="Protecciones operativas"
              value="Definicion inicial lista"
            />
            <PlatformSecurityInfoCard
              label="Integracion con auditoria"
              value="Fase siguiente"
            />
          </div>
        </section>

        <aside className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
            Navegacion recomendada
          </h4>
          <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
            <p>Usa `Perfil y seguridad` para password, 2FA y recovery del usuario.</p>
            <p>Usa esta vista para politica central, enforcement y controles transversales.</p>
            <p>La separacion evita mezclar contexto personal con gobierno de plataforma.</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/app/settings/profile?tab=security">
              <Button variant="secondary">
                <ShieldCheck className="size-4" />
                Seguridad usuario
              </Button>
            </Link>
            <Link href="/app/settings/platform">
              <Button variant="outline">
                <KeyRound className="size-4" />
                Platform settings
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PlatformSecurityPoliciesTab() {
  return (
    <div id="platform-security-panel-policies" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Politicas</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Controles proyectados de enforcement
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Propuesta de estructura para cuando exista soporte backend real de politica de seguridad.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PolicyCard
          title="Requerir 2FA"
          description="Forzar 2FA por rol, tenant o contexto de riesgo."
          status="No disponible"
        />
        <PolicyCard
          title="Caducidad de sesion"
          description="Definir TTL de sesion y revocacion automatica por riesgo."
          status="En definicion"
        />
        <PolicyCard
          title="Politica de contrasenas"
          description="Longitud minima, rotacion y restricciones de reutilizacion."
          status="En definicion"
        />
        <PolicyCard
          title="Proteccion de onboarding"
          description="Revisiones de email, aprobacion y controles previos al acceso."
          status="Planeado"
        />
        <PolicyCard
          title="Hardening por tenant"
          description="Aplicacion gradual de controles globales en tenants especificos."
          status="Planeado"
        />
        <PolicyCard
          title="Auditoria avanzada"
          description="Vincular policy enforcement con trazabilidad de eventos."
          status="Planeado"
        />
      </div>
    </div>
  );
}

function PlatformSecurityRoadmapTab() {
  return (
    <div id="platform-security-panel-roadmap" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">En desarrollo</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Dependencias y proxima evolucion
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Hoja de ruta para que esta pagina pase de vista conceptual a consola operativa real.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <section className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
          <h4 className="text-base font-semibold tracking-tight text-foreground">
            Backend requerido
          </h4>
          <ol className="mt-4 space-y-3 text-sm dashboard-text-muted">
            <li>1. Endpoint de lectura de politicas globales.</li>
            <li>2. Endpoint de actualizacion con versionado/auditoria.</li>
            <li>3. Estado de enforcement por modulo o tenant.</li>
            <li>4. Integracion con eventos de seguridad y alertas.</li>
          </ol>
        </section>

        <aside className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
          <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
            Propuesta actual
          </Badge>
          <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
            <p>La UI ya separa correctamente seguridad de usuario y seguridad de plataforma.</p>
            <p>La siguiente fase natural es conectar esta vista a `platform settings` o a un endpoint especifico.</p>
            <p>Hasta entonces, esta superficie sirve como placeholder coherente y navegable.</p>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Lista para integracion futura
            <ChevronRight className="size-4" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function PlatformSecurityMetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="surface-card rounded-[1.35rem] border-border/90 bg-background/82 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/62">
          {label}
        </p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-3 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm dashboard-text-muted">{hint}</p>
    </article>
  );
}

function PlatformSecurityInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border/85 bg-card/92 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/58">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </article>
  );
}

function PolicyCard({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
      <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
        {status}
      </Badge>
      <h4 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed dashboard-text-muted">{description}</p>
    </article>
  );
}
