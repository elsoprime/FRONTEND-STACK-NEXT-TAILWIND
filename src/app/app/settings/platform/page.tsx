"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { getPlatformSettings, updatePlatformSettings } from "@/features/platform-settings/platform-settings.service";
import { type PlatformSettings } from "@/features/platform-settings/platform-settings.schemas";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

function splitKeys(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

type PlatformSettingsFormState = {
  applicationName: string;
  supportEmail: string;
  supportUrl: string;
  defaultTimezone: string;
  defaultCurrency: string;
  defaultLanguage: string;
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
  disabledModuleKeys: string;
  disabledFeatureFlagKeys: string;
};

function buildFormState(settings: PlatformSettings): PlatformSettingsFormState {
  return {
    applicationName: settings.branding.applicationName,
    supportEmail: settings.branding.supportEmail ?? "",
    supportUrl: settings.branding.supportUrl ?? "",
    defaultTimezone: settings.localization.defaultTimezone,
    defaultCurrency: settings.localization.defaultCurrency,
    defaultLanguage: settings.localization.defaultLanguage,
    allowUserRegistration: settings.security.allowUserRegistration,
    requireEmailVerification: settings.security.requireEmailVerification,
    maintenanceMode: settings.operations.maintenanceMode,
    disabledModuleKeys: settings.modules.disabledModuleKeys.join(", "),
    disabledFeatureFlagKeys: settings.featureFlags.disabledFeatureFlagKeys.join(", "),
  };
}

export default function PlatformSettingsPage() {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  const settingsQuery = useQuery({
    queryKey: queryKeys.platformSettings(),
    queryFn: async () => {
      const response = await getPlatformSettings();
      setLastTraceId(response.traceId);
      return response.data.settings;
    },
  });

  return (
    <TenantPageShell
      eyebrow="Platform"
      title="Platform settings"
      description="Configura branding, seguridad y feature flags de la plataforma."
    >
      <TenantContextGate>
        {() => (
          <>
            {settingsQuery.isLoading ? (
              <LoadingScreen
                variant="inline"
                className="mt-4"
                label="Cargando platform settings..."
                hint="Sincronizando configuracion global."
              />
            ) : null}

            {settingsQuery.error ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
                {settingsQuery.error instanceof ApiRequestError
                  ? resolveTenantErrorMessage(settingsQuery.error.code, settingsQuery.error.message)
                  : resolveTenantErrorMessage("GEN_INTERNAL_ERROR")}
              </div>
            ) : null}

            {!settingsQuery.isLoading && !settingsQuery.error && settingsQuery.data ? (
              <PlatformSettingsForm
                key={settingsQuery.data.id}
                settings={settingsQuery.data}
                setLastTraceId={setLastTraceId}
              />
            ) : null}
          </>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type PlatformSettingsFormProps = {
  settings: PlatformSettings;
  setLastTraceId: (traceId: string | null) => void;
};

function PlatformSettingsForm({ settings, setLastTraceId }: PlatformSettingsFormProps) {
  const [formState, setFormState] = useState<PlatformSettingsFormState>(() => buildFormState(settings));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async () =>
      updatePlatformSettings({
        branding: {
          applicationName: formState.applicationName.trim(),
          supportEmail: formState.supportEmail.trim() || null,
          supportUrl: formState.supportUrl.trim() || null,
        },
        localization: {
          defaultTimezone: formState.defaultTimezone.trim(),
          defaultCurrency: formState.defaultCurrency.trim().toUpperCase(),
          defaultLanguage: formState.defaultLanguage.trim(),
        },
        security: {
          allowUserRegistration: formState.allowUserRegistration,
          requireEmailVerification: formState.requireEmailVerification,
        },
        operations: {
          maintenanceMode: formState.maintenanceMode,
        },
        modules: {
          disabledModuleKeys: splitKeys(formState.disabledModuleKeys),
        },
        featureFlags: {
          disabledFeatureFlagKeys: splitKeys(formState.disabledFeatureFlagKeys),
        },
      }),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setFormState(buildFormState(response.data.settings));
      setErrorMessage(null);
      setSuccessMessage("Platform settings actualizados correctamente.");
    },
    onError: (error: unknown) => {
      setSuccessMessage(null);
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveTenantErrorMessage(error.code, error.message));
        return;
      }
      setErrorMessage(resolveTenantErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <p className="text-sm font-semibold">Branding</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Nombre aplicacion</label>
            <Input
              value={formState.applicationName}
              onChange={(event) => setFormState({ ...formState, applicationName: event.target.value })}
              placeholder="ERP Solutions"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Email soporte</label>
            <Input
              value={formState.supportEmail}
              onChange={(event) => setFormState({ ...formState, supportEmail: event.target.value })}
              placeholder="soporte@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">URL soporte</label>
            <Input
              value={formState.supportUrl}
              onChange={(event) => setFormState({ ...formState, supportUrl: event.target.value })}
              placeholder="https://support.empresa.com"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <p className="text-sm font-semibold">Localizacion</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="field-label">Zona horaria</label>
            <Input
              value={formState.defaultTimezone}
              onChange={(event) => setFormState({ ...formState, defaultTimezone: event.target.value })}
              placeholder="America/Santiago"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Moneda</label>
            <Input
              value={formState.defaultCurrency}
              onChange={(event) => setFormState({ ...formState, defaultCurrency: event.target.value })}
              placeholder="USD"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Idioma</label>
            <Input
              value={formState.defaultLanguage}
              onChange={(event) => setFormState({ ...formState, defaultLanguage: event.target.value })}
              placeholder="es"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <p className="text-sm font-semibold">Seguridad y operaciones</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formState.allowUserRegistration}
              onChange={(event) =>
                setFormState({ ...formState, allowUserRegistration: event.target.checked })
              }
            />
            Permitir registro de usuarios
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formState.requireEmailVerification}
              onChange={(event) =>
                setFormState({ ...formState, requireEmailVerification: event.target.checked })
              }
            />
            Requerir verificacion de email
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formState.maintenanceMode}
              onChange={(event) => setFormState({ ...formState, maintenanceMode: event.target.checked })}
            />
            Modo mantenimiento
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <p className="text-sm font-semibold">Modulos y feature flags</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Modulos deshabilitados</label>
            <Input
              value={formState.disabledModuleKeys}
              onChange={(event) => setFormState({ ...formState, disabledModuleKeys: event.target.value })}
              placeholder="inventory, crm"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Feature flags deshabilitadas</label>
            <Input
              value={formState.disabledFeatureFlagKeys}
              onChange={(event) =>
                setFormState({ ...formState, disabledFeatureFlagKeys: event.target.value })
              }
              placeholder="inventory:analytics"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          Guardar platform settings
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
  );
}

