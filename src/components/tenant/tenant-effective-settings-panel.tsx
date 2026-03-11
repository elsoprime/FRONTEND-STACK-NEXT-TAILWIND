"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Globe2, Mail, ReceiptText } from "lucide-react";
import { TenantRuntimeSummary } from "@/components/tenant/tenant-runtime-summary";
import { getTenantSettingsEffective } from "@/features/tenant/tenant-settings.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import {
  tenantSettingsEffectiveSchema,
  type TenantSettingsEffective,
} from "@/features/tenant/tenant-settings.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type TenantEffectiveSettingsPanelProps = {
  tenantId: string;
  heading?: string;
  description?: string;
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
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          {title}
        </h3>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {row.label}
            </p>
            <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{row.value}</p>
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

  const errorMessage =
    effectiveQuery.error instanceof ApiRequestError
      ? resolveTenantErrorMessage(effectiveQuery.error.code, effectiveQuery.error.message)
      : effectiveQuery.error
        ? "No pudimos cargar la vista efectiva del tenant."
        : dataShapeError;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>

      <TenantRuntimeSummary
        runtime={effectiveSettings?.runtime ?? null}
        isLoading={effectiveQuery.isLoading}
        errorMessage={errorMessage}
      />

      {effectiveSettings ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SettingsBlock
            title="Marca"
            icon={<Building2 className="size-4 text-blue-700 dark:text-blue-400" />}
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
            icon={<Globe2 className="size-4 text-blue-700 dark:text-blue-400" />}
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
            icon={<Mail className="size-4 text-blue-700 dark:text-blue-400" />}
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
            icon={<ReceiptText className="size-4 text-blue-700 dark:text-blue-400" />}
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
