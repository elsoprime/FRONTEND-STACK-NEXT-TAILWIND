"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  Globe2,
  Layers3,
  Mail,
  ReceiptText,
  ShieldAlert,
} from "lucide-react";
import { resolvePlanDisplayName } from "@/features/billing/plan-catalog";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import {
  hasTenantFeatureFlag,
  resolveTenantModuleState,
} from "@/features/tenant/tenant-runtime-guards";
import {
  tenantSettingsEffectiveSchema,
  type TenantSettingsEffective,
} from "@/features/tenant/tenant-settings.schemas";
import { getTenantSettingsEffective } from "@/features/tenant/tenant-settings.service";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";
import { AccessDeniedPanel } from "./access-denied-panel";
import { TenantRuntimeSummary } from "./tenant-runtime-summary";

type TenantEffectiveSettingsPanelProps = {
  tenantId: string;
  heading?: string;
  description?: string;
  showHeader?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  showSummaryGrid?: boolean;
};

const RUNTIME_MODULE_LABELS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "inventory", label: "Inventory" },
  { key: "crm", label: "CRM" },
  { key: "hr", label: "HR" },
];

const RUNTIME_FEATURE_LABELS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "inventory:base", label: "Inventory Base" },
  { key: "inventory:analytics", label: "Inventory Analytics" },
  { key: "crm:base", label: "CRM Base" },
  { key: "hr:base", label: "HR Base" },
];

function renderNullableValue(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : "sin configurar";
}

type SettingsBlockProps = {
  title: string;
  icon: React.ReactNode;
  rows: ReadonlyArray<{ label: string; value: string }>;
};

function SettingsBlock({ title, icon, rows }: SettingsBlockProps) {
  return (
    <article className="surface-card rounded-xl border-border/85 bg-card/88 p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
      </div>

      <div className="mt-4 divide-y divide-border/70 rounded-xl border border-border/80 bg-background/72">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/60">
              {row.label}
            </p>
            <p className="text-right text-sm font-semibold text-foreground">{row.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function OverviewCard({
  title,
  value,
  caption,
  accent,
}: {
  title: string;
  value: string;
  caption: string;
  accent: React.ReactNode;
}) {
  return (
    <article className="surface-card rounded-xl border-border/85 bg-card/88 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/60">
            {title}
          </p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-2 text-sm dashboard-text-muted">{caption}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl border border-primary/18 bg-primary/10 text-primary">
          {accent}
        </div>
      </div>
    </article>
  );
}

function buildOverviewCards(effectiveSettings: TenantSettingsEffective) {
  const runtime = effectiveSettings.runtime;
  const moduleStates = RUNTIME_MODULE_LABELS.map((module) => ({
    label: module.label,
    state: resolveTenantModuleState(runtime, module.key),
  }));
  const activeModules = moduleStates.filter(
    (module) => module.state === "active" || module.state === "enabled",
  );
  const activeFeatureCount = RUNTIME_FEATURE_LABELS.filter((feature) =>
    hasTenantFeatureFlag(runtime, feature.key),
  ).length;
  const planId =
    typeof runtime?.planId === "string" && runtime.planId.trim().length > 0 ? runtime.planId : null;

  return [
    {
      title: "Estado del modulo",
      value:
        activeModules.length > 0
          ? activeModules.map((module) => module.label).join(" / ")
          : "Sin modulos activos",
      caption: `${activeModules.length} modulo(s) con disponibilidad en runtime vigente.`,
      accent: <Layers3 className="size-4" />,
    },
    {
      title: "Catalogo de features",
      value: `${activeFeatureCount} activas`,
      caption: "Cantidad de feature flags activas sobre el catalogo esperado del tenant.",
      accent: <BadgeCheck className="size-4" />,
    },
    {
      title: "Marca y contacto",
      value: renderNullableValue(effectiveSettings.branding?.displayName),
      caption: `${renderNullableValue(effectiveSettings.contact?.primaryEmail)} / ${renderNullableValue(effectiveSettings.branding?.supportEmail)}`,
      accent: <Mail className="size-4" />,
    },
    {
      title: "Localizacion y facturacion",
      value: renderNullableValue(effectiveSettings.localization?.defaultTimezone),
      caption: `${renderNullableValue(effectiveSettings.localization?.defaultCurrency)} / ${renderNullableValue(effectiveSettings.billing?.billingEmail)}`,
      accent: <ReceiptText className="size-4" />,
    },
    {
      title: "Plan runtime",
      value: planId ? resolvePlanDisplayName(planId, planId) : "Sin plan",
      caption: "Resolucion final del plan que gobierna modulos y feature flags.",
      accent: <ShieldAlert className="size-4" />,
    },
    {
      title: "Soporte operativo",
      value: renderNullableValue(effectiveSettings.branding?.supportUrl),
      caption: "URL y canales efectivos para soporte y operacion del tenant.",
      accent: <Building2 className="size-4" />,
    },
  ] as const;
}

export function TenantEffectiveSettingsPanel({
  tenantId,
  heading = "Vista efectiva del tenant",
  description = "Resolucion final de configuracion tenant + defaults de plataforma + runtime del tenant activo.",
  showHeader = true,
  showDetails = true,
  compact = false,
  showSummaryGrid = false,
}: TenantEffectiveSettingsPanelProps) {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const setEffectiveRuntime = useTenantStore((state) => state.setEffectiveRuntime);

  const effectiveQuery = useQuery({
    queryKey: queryKeys.tenantSettingsEffective(tenantId),
    queryFn: async () => {
      const response = await getTenantSettingsEffective(tenantId);
      setLastTraceId(response.traceId);
      setEffectiveRuntime(response.data.settings.runtime ?? null);
      return response.data.settings;
    },
  });

  const parsedSettings = tenantSettingsEffectiveSchema.safeParse(effectiveQuery.data);
  const effectiveSettings: TenantSettingsEffective | null = parsedSettings.success
    ? parsedSettings.data
    : null;

  const dataShapeError =
    !effectiveQuery.isLoading && !effectiveQuery.error && !parsedSettings.success
      ? "Formato inesperado en runtime efectivo. Refresca la pagina para recargar el cache."
      : null;

  const apiErrorCode =
    effectiveQuery.error instanceof ApiRequestError ? effectiveQuery.error.code : null;
  const errorMessage =
    effectiveQuery.error instanceof ApiRequestError
      ? resolveTenantErrorMessage(effectiveQuery.error.code, effectiveQuery.error.message)
      : effectiveQuery.error
        ? "No pudimos cargar la vista efectiva del tenant."
        : dataShapeError;

  const isPaymentRequired = apiErrorCode === "TENANT_SUBSCRIPTION_PAYMENT_REQUIRED";
  const overviewCards = effectiveSettings ? buildOverviewCards(effectiveSettings) : [];

  return (
    <div
      className={
        compact
          ? "reveal-up space-y-2 [--reveal-delay:60ms]"
          : "reveal-up space-y-6 [--reveal-delay:60ms]"
      }
    >
      {showHeader ? (
        <div className={compact ? "space-y-0" : "space-y-1"}>
          <h2
            className={
              compact
                ? "text-base font-semibold tracking-tight text-foreground"
                : "text-2xl font-bold tracking-tight text-foreground"
            }
          >
            {heading}
          </h2>
          <p className={compact ? "hidden" : "text-sm leading-relaxed dashboard-text-muted"}>
            {description}
          </p>
        </div>
      ) : null}

      {isPaymentRequired ? (
        <AccessDeniedPanel
          title="Suscripcion con pago pendiente"
          message={
            errorMessage ?? resolveTenantErrorMessage("TENANT_SUBSCRIPTION_PAYMENT_REQUIRED")
          }
          code="TENANT_SUBSCRIPTION_PAYMENT_REQUIRED"
          actionLabel="Ir a Billing"
          actionHref="/app/settings/billing"
        />
      ) : (
        <TenantRuntimeSummary
          runtime={effectiveSettings?.runtime ?? null}
          isLoading={effectiveQuery.isLoading}
          errorMessage={errorMessage}
          title={showDetails ? "Resumen de runtime" : "Runtime vigente"}
          description={
            showDetails
              ? "Estado runtime final por plan, modulos y feature flags activos del tenant."
              : "Estado runtime final para validacion rapida antes de guardar cambios."
          }
          compact={compact || !showDetails}
        />
      )}

      {showSummaryGrid && effectiveSettings ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {overviewCards.map((card) => (
            <OverviewCard
              key={card.title}
              title={card.title}
              value={card.value}
              caption={card.caption}
              accent={card.accent}
            />
          ))}
        </div>
      ) : null}

      {showDetails && effectiveSettings ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SettingsBlock
            title="Marca"
            icon={<Building2 className="size-4 text-primary" />}
            rows={[
              {
                label: "Nombre para mostrar",
                value: renderNullableValue(effectiveSettings.branding?.displayName),
              },
              {
                label: "Correo de soporte",
                value: renderNullableValue(effectiveSettings.branding?.supportEmail),
              },
              {
                label: "URL de soporte",
                value: renderNullableValue(effectiveSettings.branding?.supportUrl),
              },
            ]}
          />

          <SettingsBlock
            title="Localizacion"
            icon={<Globe2 className="size-4 text-primary" />}
            rows={[
              {
                label: "Zona horaria por defecto",
                value: renderNullableValue(effectiveSettings.localization?.defaultTimezone),
              },
              {
                label: "Moneda por defecto",
                value: renderNullableValue(effectiveSettings.localization?.defaultCurrency),
              },
              {
                label: "Idioma por defecto",
                value: renderNullableValue(effectiveSettings.localization?.defaultLanguage),
              },
            ]}
          />

          <SettingsBlock
            title="Contacto"
            icon={<Mail className="size-4 text-primary" />}
            rows={[
              {
                label: "Correo principal",
                value: renderNullableValue(effectiveSettings.contact?.primaryEmail),
              },
              { label: "Telefono", value: renderNullableValue(effectiveSettings.contact?.phone) },
              {
                label: "Sitio web",
                value: renderNullableValue(effectiveSettings.contact?.websiteUrl),
              },
            ]}
          />

          <SettingsBlock
            title="Facturacion"
            icon={<ReceiptText className="size-4 text-primary" />}
            rows={[
              {
                label: "Correo de facturacion",
                value: renderNullableValue(effectiveSettings.billing?.billingEmail),
              },
              {
                label: "Razon social",
                value: renderNullableValue(effectiveSettings.billing?.legalName),
              },
              {
                label: "Identificacion fiscal",
                value: renderNullableValue(effectiveSettings.billing?.taxId),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
