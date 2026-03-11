import { z } from "zod";

const nullableEmailSchema = z.string().email().nullable();
const nullableUrlSchema = z.string().url().nullable();

export const platformSettingsBrandingSchema = z
  .object({
    applicationName: z.string(),
    supportEmail: nullableEmailSchema,
    supportUrl: nullableUrlSchema,
  })
  .passthrough();

export const platformSettingsLocalizationSchema = z
  .object({
    defaultTimezone: z.string(),
    defaultCurrency: z.string().regex(/^[A-Z]{3}$/),
    defaultLanguage: z.string(),
  })
  .passthrough();

export const platformSettingsSecuritySchema = z
  .object({
    allowUserRegistration: z.boolean(),
    requireEmailVerification: z.boolean(),
  })
  .passthrough();

export const platformSettingsOperationsSchema = z
  .object({
    maintenanceMode: z.boolean(),
  })
  .passthrough();

export const platformSettingsModulesSchema = z
  .object({
    disabledModuleKeys: z.array(z.string()),
  })
  .passthrough();

export const platformSettingsFeatureFlagsSchema = z
  .object({
    disabledFeatureFlagKeys: z.array(z.string()),
  })
  .passthrough();

export const platformSettingsSchema = z
  .object({
    id: z.string(),
    singletonKey: z.literal("platform_settings"),
    branding: platformSettingsBrandingSchema,
    localization: platformSettingsLocalizationSchema,
    security: platformSettingsSecuritySchema,
    operations: platformSettingsOperationsSchema,
    modules: platformSettingsModulesSchema,
    featureFlags: platformSettingsFeatureFlagsSchema,
  })
  .passthrough();

export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export const platformSettingsDataSchema = z
  .object({
    settings: platformSettingsSchema,
  })
  .passthrough();

export type PlatformSettingsData = z.infer<typeof platformSettingsDataSchema>;

const updatePlatformSettingsBrandingSchema = z
  .object({
    applicationName: z.string().optional(),
    supportEmail: nullableEmailSchema.optional(),
    supportUrl: nullableUrlSchema.optional(),
  })
  .passthrough();

const updatePlatformSettingsLocalizationSchema = z
  .object({
    defaultTimezone: z.string().optional(),
    defaultCurrency: z.string().regex(/^[A-Z]{3}$/).optional(),
    defaultLanguage: z.string().optional(),
  })
  .passthrough();

const updatePlatformSettingsSecuritySchema = z
  .object({
    allowUserRegistration: z.boolean().optional(),
    requireEmailVerification: z.boolean().optional(),
  })
  .passthrough();

const updatePlatformSettingsOperationsSchema = z
  .object({
    maintenanceMode: z.boolean().optional(),
  })
  .passthrough();

const updatePlatformSettingsModulesSchema = z
  .object({
    disabledModuleKeys: z.array(z.string()).optional(),
  })
  .passthrough();

const updatePlatformSettingsFeatureFlagsSchema = z
  .object({
    disabledFeatureFlagKeys: z.array(z.string()).optional(),
  })
  .passthrough();

export const updatePlatformSettingsInputSchema = z
  .object({
    branding: updatePlatformSettingsBrandingSchema.optional(),
    localization: updatePlatformSettingsLocalizationSchema.optional(),
    security: updatePlatformSettingsSecuritySchema.optional(),
    operations: updatePlatformSettingsOperationsSchema.optional(),
    modules: updatePlatformSettingsModulesSchema.optional(),
    featureFlags: updatePlatformSettingsFeatureFlagsSchema.optional(),
  })
  .refine(
    (value) =>
      value.branding !== undefined ||
      value.localization !== undefined ||
      value.security !== undefined ||
      value.operations !== undefined ||
      value.modules !== undefined ||
      value.featureFlags !== undefined,
    {
      message: "Debes enviar al menos una seccion para actualizar platform settings.",
    },
  );

export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsInputSchema>;
