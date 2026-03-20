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

export const platformSettingsPasswordPolicySchema = z
  .object({
    minLength: z.number().int().min(8).max(128),
    preventReuseCount: z.number().int().min(0).max(24),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumber: z.boolean(),
    requireSpecialChar: z.boolean(),
  })
  .passthrough();

export const platformSettingsSessionPolicySchema = z
  .object({
    browserSessionTtlMinutes: z.number().int().min(5).max(43200),
    idleTimeoutMinutes: z.number().int().min(1).max(43200).nullable(),
  })
  .passthrough();

export const platformSettingsRiskControlsSchema = z
  .object({
    allowRecoveryCodes: z.boolean(),
    enforceVerifiedEmailForPrivilegedAccess: z.boolean(),
  })
  .passthrough();

export const platformSettingsSecuritySchema = z
  .object({
    allowUserRegistration: z.boolean(),
    requireEmailVerification: z.boolean(),
    requireTwoFactorForPrivilegedUsers: z.boolean(),
    passwordPolicy: platformSettingsPasswordPolicySchema,
    sessionPolicy: platformSettingsSessionPolicySchema,
    riskControls: platformSettingsRiskControlsSchema,
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
export type PlatformSettingsPasswordPolicy = z.infer<typeof platformSettingsPasswordPolicySchema>;
export type PlatformSettingsSessionPolicy = z.infer<typeof platformSettingsSessionPolicySchema>;
export type PlatformSettingsRiskControls = z.infer<typeof platformSettingsRiskControlsSchema>;

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
    defaultCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    defaultLanguage: z.string().optional(),
  })
  .passthrough();

const updatePlatformSettingsPasswordPolicySchema = z
  .object({
    minLength: z.number().int().min(8).max(128).optional(),
    preventReuseCount: z.number().int().min(0).max(24).optional(),
    requireUppercase: z.boolean().optional(),
    requireLowercase: z.boolean().optional(),
    requireNumber: z.boolean().optional(),
    requireSpecialChar: z.boolean().optional(),
  })
  .passthrough();

const updatePlatformSettingsSessionPolicySchema = z
  .object({
    browserSessionTtlMinutes: z.number().int().min(5).max(43200).optional(),
    idleTimeoutMinutes: z.number().int().min(1).max(43200).nullable().optional(),
  })
  .passthrough();

const updatePlatformSettingsRiskControlsSchema = z
  .object({
    allowRecoveryCodes: z.boolean().optional(),
    enforceVerifiedEmailForPrivilegedAccess: z.boolean().optional(),
  })
  .passthrough();

const updatePlatformSettingsSecuritySchema = z
  .object({
    allowUserRegistration: z.boolean().optional(),
    requireEmailVerification: z.boolean().optional(),
    requireTwoFactorForPrivilegedUsers: z.boolean().optional(),
    passwordPolicy: updatePlatformSettingsPasswordPolicySchema.optional(),
    sessionPolicy: updatePlatformSettingsSessionPolicySchema.optional(),
    riskControls: updatePlatformSettingsRiskControlsSchema.optional(),
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
