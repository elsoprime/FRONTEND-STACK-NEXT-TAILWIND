"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  ChevronRight,
  Clock3,
  LayoutGrid,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { SecurityTwoFactorPanel } from "@/components/auth/security-two-factor-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type ProfileSettingsWorkspaceProps = {
  initialTab?: ProfileTabKey;
};

export type ProfileTabKey = "profile" | "security" | "roadmap";

export function resolveProfileTabKey(value: string | null): ProfileTabKey {
  switch (value) {
    case "security":
    case "roadmap":
      return value;
    default:
      return "profile";
  }
}

type ProfileTabItem = {
  key: ProfileTabKey;
  label: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PROFILE_TABS: readonly ProfileTabItem[] = [
  {
    key: "profile",
    label: "Perfil",
    summary: "Identidad y contexto activo",
    icon: UserRound,
  },
  {
    key: "security",
    label: "Seguridad",
    summary: "2FA, contrasena y recovery",
    icon: LockKeyhole,
  },
  {
    key: "roadmap",
    label: "En desarrollo",
    summary: "Capacidades futuras del modulo",
    icon: Sparkles,
  },
] as const;

function resolveInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.trim();
  return initials.length > 0 ? initials.toUpperCase() : "U";
}

function formatUserName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Usuario autenticado";
}

function resolveUserStatusLabel(status?: string | null, isEmailVerified?: boolean): string {
  if (status === "pending_verification" || !isEmailVerified) {
    return "Verificacion pendiente";
  }

  return "Cuenta activa";
}

function formatSessionExpiry(value?: string | null): string {
  if (!value) {
    return "No disponible";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ProfileSettingsWorkspace({
  initialTab = "profile",
}: ProfileSettingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <ProfileWorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />

      <section className="overflow-hidden sm:p-5">
        {activeTab === "profile" ? <ProfileOverviewTab /> : null}
        {activeTab === "security" ? <ProfileSecurityTab /> : null}
        {activeTab === "roadmap" ? <ProfileRoadmapTab /> : null}
      </section>
    </div>
  );
}

function ProfileWorkspaceTabs({
  activeTab,
  onChange,
}: {
  activeTab: ProfileTabKey;
  onChange: (key: ProfileTabKey) => void;
}) {
  return (
    <section className="overflow-hidden rounded-md border-border/90 bg-card/96 p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="label-kicker text-primary/90">Workspace Profile</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Perfil, seguridad y vistas escalables
          </h2>
          <p className="max-w-3xl text-sm dashboard-text-muted">
            Unifica identidad del usuario y proteccion de acceso en una sola superficie, sin separar
            rutas funcionales que pertenecen al mismo contexto personal.
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Tabs del modulo profile" className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-border/85 px-1">
          {PROFILE_TABS.map((tab) => {
            const active = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`profile-panel-${tab.key}`}
                onClick={() => startTransition(() => onChange(tab.key))}
                className={cn(
                  "group relative flex min-w-37.5 flex-col gap-1 px-4 py-3 text-left transition-colors",
                  active
                    ? "rounded-t-md border-b border-primary bg-white/10 text-primary shadow-lg"
                    : "text-foreground/58 hover:text-foreground",
                )}
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <tab.icon
                    className={cn("size-4", active ? "text-primary" : "text-foreground/45")}
                  />
                  {tab.label}
                </span>
                <span
                  className={cn(
                    "text-xs text-foreground/60",
                    active ? "font-bold" : "font-extralight",
                  )}
                >
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

function ProfileOverviewTab() {
  const user = useSessionStore((state) => state.user);
  const sessionExpiresAt = useSessionStore((state) => state.sessionExpiresAt);
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const formattedSessionExpiry = useMemo(
    () => formatSessionExpiry(sessionExpiresAt),
    [sessionExpiresAt],
  );

  const initials = useMemo(
    () => resolveInitials(user?.firstName ?? null, user?.lastName ?? null),
    [user?.firstName, user?.lastName],
  );

  return (
    <div id="profile-panel-profile" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Perfil</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Identidad operativa del usuario
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Resume la identidad activa, el tenant actual y el estado de la sesion dentro de una vista
          consistente con el resto del entorno tenant.
        </p>
      </header>

      <article className="surface-card relative overflow-hidden rounded-[1.5rem] border-border/90 bg-card/96 p-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/16 via-accent/10 to-transparent" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-[1.35rem] border border-primary/25 bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-semibold tracking-tight text-foreground">
                {formatUserName(user?.firstName ?? null, user?.lastName ?? null)}
              </h4>
              <p className="text-sm dashboard-text-muted">
                {user?.email ?? "Sin email disponible"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                  {resolveUserStatusLabel(user?.status, user?.isEmailVerified)}
                </Badge>
                <Badge variant="outline" className="font-semibold">
                  {activeMembership?.roleKey ?? "Sin tenant activo"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/app/settings/profile?tab=security">
              <Button variant="primary">
                <LockKeyhole className="size-4" />
                Abrir seguridad
              </Button>
            </Link>
            <Link href="/app/settings/security">
              <Button variant="secondary">
                <ShieldCheck className="size-4" />
                Seguridad plataforma
              </Button>
            </Link>
          </div>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProfileMetricCard
          label="Sesion expira"
          value={formattedSessionExpiry}
          hint="Vigencia de la sesion actual en navegador."
          icon={Clock3}
        />
        <ProfileMetricCard
          label="Tenant activo"
          value={activeTenant?.name ?? "Sin tenant"}
          hint="Contexto operativo seleccionado actualmente."
          icon={LayoutGrid}
        />
        <ProfileMetricCard
          label="Rol actual"
          value={activeMembership?.roleKey ?? "Sin rol"}
          hint="Permisos efectivos dentro del tenant activo."
          icon={ShieldCheck}
        />
        <ProfileMetricCard
          label="Estado cuenta"
          value={resolveUserStatusLabel(user?.status, user?.isEmailVerified)}
          hint="Disponibilidad general y verificacion del usuario."
          icon={BellRing}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <section className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
          <h4 className="text-base font-semibold tracking-tight text-foreground">
            Resumen personal
          </h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ProfileInfoCard label="Nombre" value={user?.firstName ?? "No disponible"} />
            <ProfileInfoCard label="Apellido" value={user?.lastName ?? "No disponible"} />
            <ProfileInfoCard label="Email" value={user?.email ?? "No disponible"} />
            <ProfileInfoCard
              label="Tenant"
              value={activeTenant?.name ?? "Sin tenant seleccionado"}
            />
          </div>
        </section>

        <aside className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
            Recomendaciones
          </h4>
          <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
            <p>Centraliza cambios de acceso personal en el tab Seguridad.</p>
            <p>Usa seguridad de plataforma solo para controles globales y roadmap tecnico.</p>
            <p>Si no hay tenant activo, tu identidad sigue disponible sin bloquear la vista.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProfileSecurityTab() {
  const sessionExpiresAt = useSessionStore((state) => state.sessionExpiresAt);
  const formattedSessionExpiry = useMemo(
    () => formatSessionExpiry(sessionExpiresAt),
    [sessionExpiresAt],
  );

  return (
    <div id="profile-panel-security" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Seguridad</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Proteccion de acceso del usuario
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Gestiona 2FA, recovery y cambio de contrasena sin salir del mismo workspace personal.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <SecurityTwoFactorPanel />

        <aside className="space-y-4">
          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Estado actual
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Sesion actual: {formattedSessionExpiry}</p>
              <p>El cambio de contrasena revoca otras sesiones del usuario.</p>
              <p>La administracion de 2FA aplica a tu identidad actual, no al tenant.</p>
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Siguiente paso
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Activa 2FA antes de compartir acceso con equipos distribuidos.</p>
              <p>Guarda los recovery codes fuera del navegador.</p>
              <p>
                Usa seguridad de plataforma para politicas globales ya conectadas a backend real.
              </p>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}

function ProfileRoadmapTab() {
  return (
    <div id="profile-panel-roadmap" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">En desarrollo</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Superficies escalables del modulo personal
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Espacio reservado para capacidades de actividad, preferencias y sesiones avanzadas sin
          romper la consistencia del workspace.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RoadmapCard
          title="Actividad reciente"
          description="Timeline de cambios personales, sesiones y eventos sensibles vinculados a la cuenta."
        />
        <RoadmapCard
          title="Preferencias"
          description="Idioma, densidad visual, accesibilidad y ajustes personales del entorno de trabajo."
        />
        <RoadmapCard
          title="Dispositivos y sesiones"
          description="Vista centralizada de sesiones activas, expiracion y revocacion manual por dispositivo."
        />
      </div>
    </div>
  );
}

function ProfileMetricCard({
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

function ProfileInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border/85 bg-card/92 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/58">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </article>
  );
}

function RoadmapCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
      <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
        No disponible
      </Badge>
      <h4 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed dashboard-text-muted">{description}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        Reservado para fase siguiente
        <ChevronRight className="size-4" />
      </div>
    </article>
  );
}
