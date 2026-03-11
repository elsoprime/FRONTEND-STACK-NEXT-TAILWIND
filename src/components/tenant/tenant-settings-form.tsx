"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Globe2,
  Info,
  LoaderCircle,
  Mail,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import {
  getTenantSettings,
  getTenantSettingsEffective,
  updateTenantSettings,
} from "@/features/tenant/tenant-settings.service";
import {
  tenantSettingsFormSchema,
  toTenantSettingsFormValues,
  toUpdateTenantSettingsInput,
  type TenantSettingsFormValues,
} from "@/features/tenant/tenant-settings.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { invalidateTenantRuntimeQueries } from "@/lib/query/tenant-cache";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type TenantSettingsFormProps = {
  tenantId: string;
  tenantName: string;
};

type FormViewState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; code: string; message: string };

type SettingsSectionProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
};

function SettingsSection({ title, description, icon, children }: SettingsSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="rounded-md border border-blue-200 bg-blue-50 p-2 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

const fieldPathMap: Record<string, FieldPath<TenantSettingsFormValues>> = {
  "branding.displayName": "branding.displayName",
  "branding.supportEmail": "branding.supportEmail",
  "branding.supportUrl": "branding.supportUrl",
  "localization.defaultTimezone": "localization.defaultTimezone",
  "localization.defaultCurrency": "localization.defaultCurrency",
  "localization.defaultLanguage": "localization.defaultLanguage",
  "contact.primaryEmail": "contact.primaryEmail",
  "contact.phone": "contact.phone",
  "contact.websiteUrl": "contact.websiteUrl",
  "billing.billingEmail": "billing.billingEmail",
  "billing.legalName": "billing.legalName",
  "billing.taxId": "billing.taxId",
};

export function TenantSettingsForm({ tenantId, tenantName }: TenantSettingsFormProps) {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const setEffectiveRuntime = useTenantStore((state) => state.setEffectiveRuntime);
  const [viewState, setViewState] = useState<FormViewState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<TenantSettingsFormValues>({
    resolver: zodResolver(tenantSettingsFormSchema),
    defaultValues: {
      branding: {
        displayName: "",
        supportEmail: "",
        supportUrl: "",
      },
      localization: {
        defaultTimezone: "",
        defaultCurrency: "",
        defaultLanguage: "",
      },
      contact: {
        primaryEmail: "",
        phone: "",
        websiteUrl: "",
      },
      billing: {
        billingEmail: "",
        legalName: "",
        taxId: "",
      },
    },
  });

  const settingsQuery = useQuery({
    queryKey: queryKeys.tenantSettings(tenantId),
    queryFn: async () => {
      const response = await getTenantSettings(tenantId);
      setLastTraceId(response.traceId);
      return response.data.settings;
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    reset(toTenantSettingsFormValues(settingsQuery.data));
  }, [reset, settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (values: TenantSettingsFormValues) =>
      updateTenantSettings(tenantId, toUpdateTenantSettingsInput(values)),
    onSuccess: async (response) => {
      setLastTraceId(response.traceId);
      queryClient.setQueryData(queryKeys.tenantSettings(tenantId), response.data.settings);
      reset(toTenantSettingsFormValues(response.data.settings));

      await invalidateTenantRuntimeQueries(queryClient, tenantId);

      const effectiveResponse = await getTenantSettingsEffective(tenantId);
      setLastTraceId(effectiveResponse.traceId);
      setEffectiveRuntime(effectiveResponse.data.settings.runtime);
      queryClient.setQueryData(
        queryKeys.tenantSettingsEffective(tenantId),
        effectiveResponse.data.settings,
      );

      setViewState({ status: "success" });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);

        if (error.status === 400 && error.details) {
          for (const [field, messages] of Object.entries(error.details)) {
            const targetPath = fieldPathMap[field];
            if (!targetPath || messages.length === 0) {
              continue;
            }

            setError(targetPath, {
              type: "server",
              message: messages[0],
            });
          }
        }

        setViewState({
          status: "error",
          code: error.code,
          message: resolveTenantErrorMessage(error.code, error.message),
        });
        return;
      }

      setViewState({
        status: "error",
        code: "GEN_INTERNAL_ERROR",
        message: resolveTenantErrorMessage("GEN_INTERNAL_ERROR"),
      });
    },
  });

  const onSubmit = (values: TenantSettingsFormValues) => {
    setViewState({ status: "idle" });
    updateMutation.mutate(values);
  };

  const errorCopy = viewState.status === "error" ? viewState.message : null;

  if (settingsQuery.isLoading) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <LoaderCircle className="size-4 animate-spin" />
          Cargando configuracion del tenant...
        </div>
      </div>
    );
  }

  if (settingsQuery.error) {
    const queryErrorCode =
      settingsQuery.error instanceof ApiRequestError
        ? resolveTenantErrorMessage(settingsQuery.error.code, settingsQuery.error.message)
        : resolveTenantErrorMessage("GEN_INTERNAL_ERROR");

    return (
      <article className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-4" />
          <p className="text-sm font-semibold">{queryErrorCode}</p>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">
            Estas editando el singleton de configuracion del tenant{" "}
            <span className="font-semibold">{tenantName}</span>. El runtime efectivo se recalcula
            despues de guardar.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <SettingsSection
          title="Marca"
          description="Datos visibles de marca y canales de soporte."
          icon={<Building2 className="size-4" />}
        >
          <Field
            id="branding-display-name"
            label="Nombre para mostrar"
            error={errors.branding?.displayName?.message}
          >
            <input
              id="branding-display-name"
              type="text"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.branding?.displayName &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("branding.displayName")}
            />
          </Field>

          <Field
            id="branding-support-email"
            label="Correo de soporte"
            error={errors.branding?.supportEmail?.message}
          >
            <input
              id="branding-support-email"
              type="email"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.branding?.supportEmail &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("branding.supportEmail")}
            />
          </Field>

          <Field
            id="branding-support-url"
            label="URL de soporte"
            error={errors.branding?.supportUrl?.message}
          >
            <input
              id="branding-support-url"
              type="url"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.branding?.supportUrl &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("branding.supportUrl")}
            />
          </Field>
        </SettingsSection>

        <SettingsSection
          title="Localizacion"
          description="Valores por defecto de zona horaria, moneda e idioma."
          icon={<Globe2 className="size-4" />}
        >
          <Field
            id="localization-default-timezone"
            label="Zona horaria por defecto"
            error={errors.localization?.defaultTimezone?.message}
          >
            <input
              id="localization-default-timezone"
              type="text"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.localization?.defaultTimezone &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("localization.defaultTimezone")}
            />
          </Field>

          <Field
            id="localization-default-currency"
            label="Moneda por defecto"
            error={errors.localization?.defaultCurrency?.message}
          >
            <input
              id="localization-default-currency"
              type="text"
              maxLength={3}
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm uppercase text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.localization?.defaultCurrency &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("localization.defaultCurrency")}
            />
          </Field>

          <Field
            id="localization-default-language"
            label="Idioma por defecto"
            error={errors.localization?.defaultLanguage?.message}
          >
            <input
              id="localization-default-language"
              type="text"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.localization?.defaultLanguage &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("localization.defaultLanguage")}
            />
          </Field>
        </SettingsSection>

        <SettingsSection
          title="Contacto"
          description="Canales publicos y operativos del tenant."
          icon={<Mail className="size-4" />}
        >
          <Field
            id="contact-primary-email"
            label="Correo principal"
            error={errors.contact?.primaryEmail?.message}
          >
            <input
              id="contact-primary-email"
              type="email"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.contact?.primaryEmail &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("contact.primaryEmail")}
            />
          </Field>

          <Field id="contact-phone" label="Telefono" error={errors.contact?.phone?.message}>
            <input
              id="contact-phone"
              type="text"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.contact?.phone &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("contact.phone")}
            />
          </Field>

          <Field
            id="contact-website-url"
            label="Sitio web"
            error={errors.contact?.websiteUrl?.message}
          >
            <input
              id="contact-website-url"
              type="url"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.contact?.websiteUrl &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("contact.websiteUrl")}
            />
          </Field>
        </SettingsSection>

        <SettingsSection
          title="Facturacion"
          description="Datos administrativos y fiscales del tenant."
          icon={<ReceiptText className="size-4" />}
        >
          <Field
            id="billing-billing-email"
            label="Correo de facturacion"
            error={errors.billing?.billingEmail?.message}
          >
            <input
              id="billing-billing-email"
              type="email"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.billing?.billingEmail &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("billing.billingEmail")}
            />
          </Field>

          <Field
            id="billing-legal-name"
            label="Razon social"
            error={errors.billing?.legalName?.message}
          >
            <input
              id="billing-legal-name"
              type="text"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.billing?.legalName &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("billing.legalName")}
            />
          </Field>

          <Field
            id="billing-tax-id"
            label="Identificacion fiscal"
            error={errors.billing?.taxId?.message}
          >
            <input
              id="billing-tax-id"
              type="text"
              className={cn(
                "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30",
                errors.billing?.taxId &&
                  "border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30",
              )}
              {...register("billing.taxId")}
            />
          </Field>
        </SettingsSection>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="lg"
            className="h-11 rounded-md bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Guardando cambios...
              </span>
            ) : (
              "Guardar configuracion del tenant"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 rounded-md"
            onClick={() =>
              settingsQuery.data ? reset(toTenantSettingsFormValues(settingsQuery.data)) : undefined
            }
            disabled={updateMutation.isPending || !settingsQuery.data || !isDirty}
          >
            Revertir cambios
          </Button>
        </div>
      </form>

      {viewState.status === "success" ? (
        <article className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4" />
            <p className="text-sm font-semibold">
              Tenant settings actualizados correctamente. El runtime efectivo ya fue refrescado.
            </p>
          </div>
        </article>
      ) : null}

      {viewState.status === "error" && errorCopy ? (
        <article className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-4" />
            <p className="text-sm font-semibold">{errorCopy}</p>
          </div>
        </article>
      ) : null}
    </div>
  );
}
