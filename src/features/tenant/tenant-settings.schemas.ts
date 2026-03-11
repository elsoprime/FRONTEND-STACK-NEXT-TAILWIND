import { z } from "zod";

const nullableStringSchema = z.string().nullable();
const nullableEmailSchema = z.string().email().nullable();
const nullableUrlSchema = z.string().url().nullable();

const formTextFieldSchema = z.string().trim();
const formEmailFieldSchema = z.union([
  z.literal(""),
  z.string().trim().email("Ingresa un email valido."),
]);
const formUrlFieldSchema = z.union([
  z.literal(""),
  z.string().trim().url("Ingresa una URL valida."),
]);
const formCurrencyFieldSchema = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .regex(/^[a-zA-Z]{3}$/, "Usa un codigo ISO de 3 letras."),
]);

export const tenantSettingsBrandingSchema = z
  .object({
    displayName: nullableStringSchema,
    supportEmail: nullableEmailSchema,
    supportUrl: nullableUrlSchema,
  })
  .passthrough();

export const tenantSettingsLocalizationSchema = z
  .object({
    defaultTimezone: nullableStringSchema,
    defaultCurrency: nullableStringSchema,
    defaultLanguage: nullableStringSchema,
  })
  .passthrough();

export const tenantSettingsContactSchema = z
  .object({
    primaryEmail: nullableEmailSchema,
    phone: nullableStringSchema,
    websiteUrl: nullableUrlSchema,
  })
  .passthrough();

export const tenantSettingsBillingSchema = z
  .object({
    billingEmail: nullableEmailSchema,
    legalName: nullableStringSchema,
    taxId: nullableStringSchema,
  })
  .passthrough();

export const tenantRuntimeSchema = z
  .object({
    planId: z.string().nullable(),
    activeModuleKeys: z.array(z.string()),
    enabledModuleKeys: z.array(z.string()),
    featureFlagKeys: z.array(z.string()),
  })
  .passthrough();

export type TenantRuntime = z.infer<typeof tenantRuntimeSchema>;

export const tenantSettingsSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    singletonKey: z.literal("tenant_settings"),
    branding: tenantSettingsBrandingSchema,
    localization: tenantSettingsLocalizationSchema,
    contact: tenantSettingsContactSchema,
    billing: tenantSettingsBillingSchema,
  })
  .passthrough();

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;

export const tenantSettingsEffectiveBrandingSchema = z
  .object({
    displayName: z.string(),
    supportEmail: nullableEmailSchema,
    supportUrl: nullableUrlSchema,
  })
  .passthrough();

export const tenantSettingsEffectiveLocalizationSchema = z
  .object({
    defaultTimezone: z.string(),
    defaultCurrency: z.string(),
    defaultLanguage: z.string(),
  })
  .passthrough();

export const tenantSettingsEffectiveSchema = z
  .object({
    tenantId: z.string(),
    branding: tenantSettingsEffectiveBrandingSchema,
    localization: tenantSettingsEffectiveLocalizationSchema,
    contact: tenantSettingsContactSchema,
    billing: tenantSettingsBillingSchema,
    runtime: tenantRuntimeSchema,
  })
  .passthrough();

export type TenantSettingsEffective = z.infer<typeof tenantSettingsEffectiveSchema>;

const partialBrandingUpdateSchema = z
  .object({
    displayName: nullableStringSchema.optional(),
    supportEmail: nullableEmailSchema.optional(),
    supportUrl: nullableUrlSchema.optional(),
  })
  .passthrough()
  .optional();

const partialLocalizationUpdateSchema = z
  .object({
    defaultTimezone: nullableStringSchema.optional(),
    defaultCurrency: nullableStringSchema.optional(),
    defaultLanguage: nullableStringSchema.optional(),
  })
  .passthrough()
  .optional();

const partialContactUpdateSchema = z
  .object({
    primaryEmail: nullableEmailSchema.optional(),
    phone: nullableStringSchema.optional(),
    websiteUrl: nullableUrlSchema.optional(),
  })
  .passthrough()
  .optional();

const partialBillingUpdateSchema = z
  .object({
    billingEmail: nullableEmailSchema.optional(),
    legalName: nullableStringSchema.optional(),
    taxId: nullableStringSchema.optional(),
  })
  .passthrough()
  .optional();

export const updateTenantSettingsRequestSchema = z
  .object({
    branding: partialBrandingUpdateSchema,
    localization: partialLocalizationUpdateSchema,
    contact: partialContactUpdateSchema,
    billing: partialBillingUpdateSchema,
  })
  .refine(
    (value) =>
      value.branding !== undefined ||
      value.localization !== undefined ||
      value.contact !== undefined ||
      value.billing !== undefined,
    {
      message: "Debes enviar al menos una seccion para actualizar.",
    },
  );

export type UpdateTenantSettingsInput = z.infer<typeof updateTenantSettingsRequestSchema>;

export const tenantSettingsFormSchema = z.object({
  branding: z.object({
    displayName: formTextFieldSchema,
    supportEmail: formEmailFieldSchema,
    supportUrl: formUrlFieldSchema,
  }),
  localization: z.object({
    defaultTimezone: formTextFieldSchema,
    defaultCurrency: formCurrencyFieldSchema,
    defaultLanguage: formTextFieldSchema,
  }),
  contact: z.object({
    primaryEmail: formEmailFieldSchema,
    phone: formTextFieldSchema,
    websiteUrl: formUrlFieldSchema,
  }),
  billing: z.object({
    billingEmail: formEmailFieldSchema,
    legalName: formTextFieldSchema,
    taxId: formTextFieldSchema,
  }),
});

export type TenantSettingsFormValues = z.infer<typeof tenantSettingsFormSchema>;

export const tenantSettingsDataSchema = z
  .object({
    settings: tenantSettingsSchema,
  })
  .passthrough();

export type TenantSettingsData = z.infer<typeof tenantSettingsDataSchema>;

export const tenantSettingsEffectiveDataSchema = z
  .object({
    settings: tenantSettingsEffectiveSchema,
  })
  .passthrough();

export type TenantSettingsEffectiveData = z.infer<typeof tenantSettingsEffectiveDataSchema>;

function normalizeNullableTextInput(value: string): string | null {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeNullableEmailInput(value: string): string | null {
  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeNullableUrlInput(value: string): string | null {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeNullableCurrencyInput(value: string): string | null {
  const normalizedValue = value.trim().toUpperCase();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function readNullableInput(value: string | null): string {
  return value ?? "";
}

export function toTenantSettingsFormValues(settings: TenantSettings): TenantSettingsFormValues {
  return {
    branding: {
      displayName: readNullableInput(settings.branding.displayName),
      supportEmail: readNullableInput(settings.branding.supportEmail),
      supportUrl: readNullableInput(settings.branding.supportUrl),
    },
    localization: {
      defaultTimezone: readNullableInput(settings.localization.defaultTimezone),
      defaultCurrency: readNullableInput(settings.localization.defaultCurrency),
      defaultLanguage: readNullableInput(settings.localization.defaultLanguage),
    },
    contact: {
      primaryEmail: readNullableInput(settings.contact.primaryEmail),
      phone: readNullableInput(settings.contact.phone),
      websiteUrl: readNullableInput(settings.contact.websiteUrl),
    },
    billing: {
      billingEmail: readNullableInput(settings.billing.billingEmail),
      legalName: readNullableInput(settings.billing.legalName),
      taxId: readNullableInput(settings.billing.taxId),
    },
  };
}

export function toUpdateTenantSettingsInput(
  values: TenantSettingsFormValues,
): UpdateTenantSettingsInput {
  return updateTenantSettingsRequestSchema.parse({
    branding: {
      displayName: normalizeNullableTextInput(values.branding.displayName),
      supportEmail: normalizeNullableEmailInput(values.branding.supportEmail),
      supportUrl: normalizeNullableUrlInput(values.branding.supportUrl),
    },
    localization: {
      defaultTimezone: normalizeNullableTextInput(values.localization.defaultTimezone),
      defaultCurrency: normalizeNullableCurrencyInput(values.localization.defaultCurrency),
      defaultLanguage: normalizeNullableTextInput(values.localization.defaultLanguage),
    },
    contact: {
      primaryEmail: normalizeNullableEmailInput(values.contact.primaryEmail),
      phone: normalizeNullableTextInput(values.contact.phone),
      websiteUrl: normalizeNullableUrlInput(values.contact.websiteUrl),
    },
    billing: {
      billingEmail: normalizeNullableEmailInput(values.billing.billingEmail),
      legalName: normalizeNullableTextInput(values.billing.legalName),
      taxId: normalizeNullableTextInput(values.billing.taxId),
    },
  });
}
