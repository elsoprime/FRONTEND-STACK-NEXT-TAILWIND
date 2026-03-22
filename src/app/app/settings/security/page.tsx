"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  ChevronRight,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccessStatePanel } from "@/components/ui/access-state-panel";
import { Input } from "@/components/ui/input";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/features/platform-settings/platform-settings.service";
import { type PlatformSettings } from "@/features/platform-settings/platform-settings.schemas";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import { useSearchParams } from "next/navigation";

type PlatformSecurityTabKey = "overview" | "policies" | "roadmap";

type PlatformSecurityTabItem = {
  key: PlatformSecurityTabKey;
  label: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
};

type PlatformSecurityFormState = {
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  requireTwoFactorForPrivilegedUsers: boolean;
  minLength: string;
  preventReuseCount: string;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  browserSessionTtlMinutes: string;
  idleTimeoutMinutes: string;
  allowRecoveryCodes: boolean;
  enforceVerifiedEmailForPrivilegedAccess: boolean;
};

type PlatformSecurityAccessPresentation = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
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
    summary: "Controles activos de plataforma",
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

function buildFormState(settings: PlatformSettings): PlatformSecurityFormState {
  return {
    allowUserRegistration: settings.security.allowUserRegistration,
    requireEmailVerification: settings.security.requireEmailVerification,
    requireTwoFactorForPrivilegedUsers: settings.security.requireTwoFactorForPrivilegedUsers,
    minLength: String(settings.security.passwordPolicy.minLength),
    preventReuseCount: String(settings.security.passwordPolicy.preventReuseCount),
    requireUppercase: settings.security.passwordPolicy.requireUppercase,
    requireLowercase: settings.security.passwordPolicy.requireLowercase,
    requireNumber: settings.security.passwordPolicy.requireNumber,
    requireSpecialChar: settings.security.passwordPolicy.requireSpecialChar,
    browserSessionTtlMinutes: String(settings.security.sessionPolicy.browserSessionTtlMinutes),
    idleTimeoutMinutes:
      settings.security.sessionPolicy.idleTimeoutMinutes === null
        ? ""
        : String(settings.security.sessionPolicy.idleTimeoutMinutes),
    allowRecoveryCodes: settings.security.riskControls.allowRecoveryCodes,
    enforceVerifiedEmailForPrivilegedAccess:
      settings.security.riskControls.enforceVerifiedEmailForPrivilegedAccess,
  };
}

function parseIntegerField(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolvePlatformSecurityAccessPresentation(
  error: unknown,
): PlatformSecurityAccessPresentation {
  if (error instanceof ApiRequestError) {
    if (error.code === "AUTH_UNAUTHENTICATED" || error.status === 401) {
      return {
        title: "Necesitas autenticarte nuevamente",
        description:
          "No pudimos validar tu sesion para consultar politicas globales de plataforma. Inicia sesion otra vez y vuelve a intentar.",
        primaryHref: "/login",
        primaryLabel: "Ir a login",
        secondaryHref: "/app",
        secondaryLabel: "Volver al dashboard",
      };
    }

    if (error.code === "RBAC_PERMISSION_DENIED" || error.status === 403) {
      return {
        title: "Acceso restringido a seguridad de plataforma",
        description:
          "Esta vista administra politicas globales del sistema. Ser owner del tenant activo no otorga acceso por si solo; necesitas permisos platform-scoped como `platform:settings:read`.",
        primaryHref: "/app/settings/profile?tab=security",
        primaryLabel: "Ir a seguridad de usuario",
        secondaryHref: "/app",
        secondaryLabel: "Volver al dashboard",
      };
    }
  }

  return {
    title: "No pudimos cargar seguridad de plataforma",
    description:
      error instanceof ApiRequestError
        ? resolveTenantErrorMessage(error.code, error.message)
        : resolveTenantErrorMessage("GEN_INTERNAL_ERROR"),
    primaryHref: "/app",
    primaryLabel: "Volver al dashboard",
    secondaryHref: "/app/settings/profile?tab=security",
    secondaryLabel: "Seguridad de usuario",
  };
}

function PlatformSecurityAccessState({ error }: { error: unknown }) {
  const presentation = resolvePlatformSecurityAccessPresentation(error);

  return (
    <AccessStatePanel
      title={presentation.title}
      description={presentation.description}
      primaryAction={{
        href: presentation.primaryHref,
        label: presentation.primaryLabel,
        variant: "secondary",
      }}
      secondaryAction={{
        href: presentation.secondaryHref,
        label: presentation.secondaryLabel,
        variant: "outline",
      }}
    />
  );
}

export default function SecuritySettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = resolvePlatformSecurityTabKey(searchParams.get("tab"));

  return (
    <TenantPageShell
      eyebrow="Security"
      title="Seguridad de plataforma"
      description="Superficie operativa para politicas globales conectadas a platform settings."
      breadcrumbItems={[{ label: "Dashboard", href: "/app" }, { label: "Seguridad de plataforma" }]}
    >
      <PlatformSecurityWorkspace initialTab={initialTab} />
    </TenantPageShell>
  );
}

function PlatformSecurityWorkspace({ initialTab }: { initialTab: PlatformSecurityTabKey }) {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [activeTab, setActiveTab] = useState<PlatformSecurityTabKey>(initialTab);
  const settingsQuery = useQuery({
    queryKey: queryKeys.platformSettings(),
    queryFn: async () => {
      const response = await getPlatformSettings();
      setLastTraceId(response.traceId);
      return response.data.settings;
    },
    retry: false,
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <PlatformSecurityTabs activeTab={activeTab} onChange={setActiveTab} />

      <section className="overflow-hidden sm:p-5">
        {activeTab === "overview" ? (
          <PlatformSecurityOverviewTab settingsQuery={settingsQuery} />
        ) : null}
        {activeTab === "policies" ? (
          <PlatformSecurityPoliciesTab settingsQuery={settingsQuery} />
        ) : null}
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
            politicas globales del sistema con backend real.
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
function PlatformSecurityOverviewTab({
  settingsQuery,
}: {
  settingsQuery: ReturnType<typeof useQuery<PlatformSettings>>;
}) {
  if (settingsQuery.isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm dashboard-text-muted">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando politicas globales...
      </div>
    );
  }

  if (settingsQuery.error) {
    return <PlatformSecurityAccessState error={settingsQuery.error} />;
  }

  if (!settingsQuery.data) {
    return null;
  }

  const settings = settingsQuery.data;

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
          label="2FA privilegiados"
          value={settings.security.requireTwoFactorForPrivilegedUsers ? "Activa" : "Opcional"}
          hint="Enforcement global para usuarios privilegiados."
          icon={ShieldCheck}
        />
        <PlatformSecurityMetricCard
          label="Largo minimo"
          value={`${settings.security.passwordPolicy.minLength} caracteres`}
          hint="Politica base de password actual."
          icon={LockKeyhole}
        />
        <PlatformSecurityMetricCard
          label="TTL browser"
          value={`${settings.security.sessionPolicy.browserSessionTtlMinutes} min`}
          hint="Tiempo maximo de sesion en navegador."
          icon={BellRing}
        />
        <PlatformSecurityMetricCard
          label="Recovery codes"
          value={settings.security.riskControls.allowRecoveryCodes ? "Permitidos" : "Bloqueados"}
          hint="Control de recuperacion de acceso."
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <section className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold tracking-tight text-foreground">
                Politica efectiva cargada
              </h4>
              <p className="mt-1 text-sm dashboard-text-muted">
                `settings/security` consume `platform/settings.security` sin crear un modulo
                separado.
              </p>
            </div>
            <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
              Backend real
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <PlatformSecurityInfoCard
              label="Verificacion email"
              value={settings.security.requireEmailVerification ? "Requerida" : "Opcional"}
            />
            <PlatformSecurityInfoCard
              label="Reuso password"
              value={`${settings.security.passwordPolicy.preventReuseCount} historicos`}
            />
            <PlatformSecurityInfoCard
              label="Idle timeout"
              value={
                settings.security.sessionPolicy.idleTimeoutMinutes === null
                  ? "Sin timeout idle"
                  : `${settings.security.sessionPolicy.idleTimeoutMinutes} min`
              }
            />
            <PlatformSecurityInfoCard
              label="Email verificado para privilegiados"
              value={
                settings.security.riskControls.enforceVerifiedEmailForPrivilegedAccess
                  ? "Exigido"
                  : "No exigido"
              }
            />
          </div>
        </section>

        <aside className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
            Navegacion recomendada
          </h4>
          <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
            <p>Usa Perfil y seguridad para password, 2FA y recovery del usuario actual.</p>
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
                <ChevronRight className="size-4" />
                Platform settings
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PlatformSecurityPoliciesTab({
  settingsQuery,
}: {
  settingsQuery: ReturnType<typeof useQuery<PlatformSettings>>;
}) {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<PlatformSecurityFormState | null>(null);

  const effectiveFormState =
    formState ?? (settingsQuery.data ? buildFormState(settingsQuery.data) : null);
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveFormState) {
        throw new Error("No hay configuracion de seguridad cargada.");
      }

      return updatePlatformSettings({
        security: {
          allowUserRegistration: effectiveFormState.allowUserRegistration,
          requireEmailVerification: effectiveFormState.requireEmailVerification,
          requireTwoFactorForPrivilegedUsers: effectiveFormState.requireTwoFactorForPrivilegedUsers,
          passwordPolicy: {
            minLength: parseIntegerField(effectiveFormState.minLength, 12),
            preventReuseCount: parseIntegerField(effectiveFormState.preventReuseCount, 5),
            requireUppercase: effectiveFormState.requireUppercase,
            requireLowercase: effectiveFormState.requireLowercase,
            requireNumber: effectiveFormState.requireNumber,
            requireSpecialChar: effectiveFormState.requireSpecialChar,
          },
          sessionPolicy: {
            browserSessionTtlMinutes: parseIntegerField(
              effectiveFormState.browserSessionTtlMinutes,
              1440,
            ),
            idleTimeoutMinutes:
              effectiveFormState.idleTimeoutMinutes.trim().length === 0
                ? null
                : parseIntegerField(effectiveFormState.idleTimeoutMinutes, 30),
          },
          riskControls: {
            allowRecoveryCodes: effectiveFormState.allowRecoveryCodes,
            enforceVerifiedEmailForPrivilegedAccess:
              effectiveFormState.enforceVerifiedEmailForPrivilegedAccess,
          },
        },
      });
    },
    onSuccess: async (response) => {
      setLastTraceId(response.traceId);
      setErrorMessage(null);
      setSuccessMessage("Politicas de seguridad actualizadas correctamente.");
      setFormState(buildFormState(response.data.settings));
      await queryClient.invalidateQueries({ queryKey: queryKeys.platformSettings() });
    },
    onError: (error: unknown) => {
      setSuccessMessage(null);
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveTenantErrorMessage(error.code, error.message));
        return;
      }
      setErrorMessage(
        error instanceof Error ? error.message : resolveTenantErrorMessage("GEN_INTERNAL_ERROR"),
      );
    },
  });

  if (settingsQuery.isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm dashboard-text-muted">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando politicas editables...
      </div>
    );
  }

  if (settingsQuery.error) {
    return <PlatformSecurityAccessState error={settingsQuery.error} />;
  }

  if (!effectiveFormState) {
    return (
      <div className="flex items-center gap-3 text-sm dashboard-text-muted">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando politicas editables...
      </div>
    );
  }

  return (
    <div id="platform-security-panel-policies" role="tabpanel" className="space-y-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Politicas</p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          Controles globales activos
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Edita solo campos con respaldo real en backend dentro de `platform/settings.security`.
        </p>
      </header>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
        <div className="space-y-4">
          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
            <h4 className="text-base font-semibold tracking-tight text-foreground">Acceso base</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effectiveFormState.allowUserRegistration}
                  onChange={(event) =>
                    setFormState({
                      ...effectiveFormState,
                      allowUserRegistration: event.target.checked,
                    })
                  }
                />
                Permitir registro de usuarios
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effectiveFormState.requireEmailVerification}
                  onChange={(event) =>
                    setFormState({
                      ...effectiveFormState,
                      requireEmailVerification: event.target.checked,
                    })
                  }
                />
                Requerir verificacion de email
              </label>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={effectiveFormState.requireTwoFactorForPrivilegedUsers}
                  onChange={(event) =>
                    setFormState({
                      ...effectiveFormState,
                      requireTwoFactorForPrivilegedUsers: event.target.checked,
                    })
                  }
                />
                Requerir 2FA para usuarios privilegiados
              </label>
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
            <h4 className="text-base font-semibold tracking-tight text-foreground">
              Politica de password
            </h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="field-label">Largo minimo</label>
                <Input
                  value={effectiveFormState.minLength}
                  onChange={(event) =>
                    setFormState({ ...effectiveFormState, minLength: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Historial de reuso</label>
                <Input
                  value={effectiveFormState.preventReuseCount}
                  onChange={(event) =>
                    setFormState({ ...effectiveFormState, preventReuseCount: event.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effectiveFormState.requireUppercase}
                  onChange={(event) =>
                    setFormState({ ...effectiveFormState, requireUppercase: event.target.checked })
                  }
                />
                Requerir mayuscula
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effectiveFormState.requireLowercase}
                  onChange={(event) =>
                    setFormState({ ...effectiveFormState, requireLowercase: event.target.checked })
                  }
                />
                Requerir minuscula
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effectiveFormState.requireNumber}
                  onChange={(event) =>
                    setFormState({ ...effectiveFormState, requireNumber: event.target.checked })
                  }
                />
                Requerir numero
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effectiveFormState.requireSpecialChar}
                  onChange={(event) =>
                    setFormState({
                      ...effectiveFormState,
                      requireSpecialChar: event.target.checked,
                    })
                  }
                />
                Requerir caracter especial
              </label>
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
            <h4 className="text-base font-semibold tracking-tight text-foreground">
              Sesion y riesgo
            </h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="field-label">TTL browser (minutos)</label>
                <Input
                  value={effectiveFormState.browserSessionTtlMinutes}
                  onChange={(event) =>
                    setFormState({
                      ...effectiveFormState,
                      browserSessionTtlMinutes: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="field-label">Idle timeout (minutos, vacio = null)</label>
                <Input
                  value={effectiveFormState.idleTimeoutMinutes}
                  onChange={(event) =>
                    setFormState({ ...effectiveFormState, idleTimeoutMinutes: event.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effectiveFormState.allowRecoveryCodes}
                  onChange={(event) =>
                    setFormState({
                      ...effectiveFormState,
                      allowRecoveryCodes: event.target.checked,
                    })
                  }
                />
                Permitir recovery codes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effectiveFormState.enforceVerifiedEmailForPrivilegedAccess}
                  onChange={(event) =>
                    setFormState({
                      ...effectiveFormState,
                      enforceVerifiedEmailForPrivilegedAccess: event.target.checked,
                    })
                  }
                />
                Exigir email verificado para acceso privilegiado
              </label>
            </div>
          </article>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              Guardar politicas
            </Button>
          </div>

          {successMessage ? (
            <div className="rounded-md border border-emerald-400/55 bg-emerald-500/14 p-4 text-emerald-100">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-md border border-destructive/45 bg-destructive/14 p-4 text-red-200">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Reglas activas
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>Los cambios se persisten en `GET/PATCH /api/v1/platform/settings`.</p>
              <p>No existe `platform/security` separado en esta fase.</p>
              <p>La validacion de rangos y tipos ocurre en backend.</p>
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Contexto relacionado
            </h4>
            <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
              <p>El 2FA del usuario individual sigue estando en Perfil y seguridad.</p>
              <p>Aqui solo se editan politicas globales con respaldo real en backend.</p>
            </div>
          </article>
        </aside>
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
          Hoja de ruta para auditoria platform-scoped, alertas y enforcement mas fino por contexto.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <section className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
          <h4 className="text-base font-semibold tracking-tight text-foreground">
            Siguiente entrega razonable
          </h4>
          <ol className="mt-4 space-y-3 text-sm dashboard-text-muted">
            <li>1. Auditoria platform-scoped expuesta en router principal y OpenAPI.</li>
            <li>2. Alertas de seguridad y eventos de enforcement.</li>
            <li>3. Estados agregados por tenant o modulo.</li>
            <li>4. Trazabilidad avanzada para cambios de politica.</li>
          </ol>
        </section>

        <aside className="surface-card rounded-[1.5rem] border-border/90 bg-background/75 p-5">
          <Badge variant="outline" className="border-primary/22 bg-primary/8 text-primary">
            Fase actual
          </Badge>
          <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
            <p>La vista ya esta conectada a politicas reales de `platform/settings.security`.</p>
            <p>
              Lo que sigue siendo roadmap no debe presentarse como funcionalidad operativa todavia.
            </p>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Base lista para la fase siguiente
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
