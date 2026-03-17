"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Globe2, Mail, ReceiptText } from "lucide-react";
import { AccessDeniedPanel } from "@/components/tenant/access-denied-panel";
import { TenantRuntimeSummary } from "@/components/tenant/tenant-runtime-summary";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import {
  tenantSettingsEffectiveSchema,
  type TenantSettingsEffective,
} from "@/features/tenant/tenant-settings.schemas";
import { getTenantSettingsEffective } from "@/features/tenant/tenant-settings.service";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type TenantEffectiveSettingsPanelProps = {
  tenantId: string;
  heading?: string;
  description?: string;
  showDetails?: boolean;
  compact?: boolean;
};

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

export function TenantEffectiveSettingsPanel({
  tenantId,
  heading = "Vista efectiva del tenant",
  description = "Resolucion final de configuracion tenant + defaults de plataforma + runtime del tenant activo.",
  showDetails = true,
  compact = false,
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

  return (
    <div
      className={
        compact
          ? "reveal-up space-y-2 [--reveal-delay:60ms]"
          : "reveal-up space-y-6 [--reveal-delay:60ms]"
      }
    >
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
