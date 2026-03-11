import { z } from "zod";

export const loginBrowserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  twoFactorCode: z.string().min(6).max(6).optional(),
  recoveryCode: z.string().optional(),
});

export type LoginBrowserInput = z.infer<typeof loginBrowserInputSchema>;
export type LoginHeadlessInput = LoginBrowserInput;

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string().nullable(),
  status: z.enum(["active", "pending_verification"]).or(z.string()),
  isEmailVerified: z.boolean(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export const loginSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.string(),
});

export type LoginSession = z.infer<typeof loginSessionSchema>;

export const loginBrowserDataSchema = z.object({
  user: sessionUserSchema,
  session: loginSessionSchema,
});

export type LoginBrowserData = z.infer<typeof loginBrowserDataSchema>;

export const logoutDataSchema = z.object({
  revokedSessionIds: z.array(z.string()),
});

export type LogoutData = z.infer<typeof logoutDataSchema>;

export const registerInputSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().nullable().optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const emailVerificationDispatchDataSchema = z.object({
  accepted: z.literal(true),
});

export type EmailVerificationDispatchData = z.infer<typeof emailVerificationDispatchDataSchema>;

export const registerDataSchema = emailVerificationDispatchDataSchema;

export type RegisterData = EmailVerificationDispatchData;

export const resendVerificationInputSchema = z.object({
  email: z.string().email(),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationInputSchema>;

export const resendVerificationDataSchema = emailVerificationDispatchDataSchema;

export type ResendVerificationData = EmailVerificationDispatchData;

export const forgotPasswordInputSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const forgotPasswordDataSchema = emailVerificationDispatchDataSchema;

export type ForgotPasswordData = EmailVerificationDispatchData;

export const resetPasswordInputSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const resetPasswordDataSchema = z.object({
  reset: z.literal(true),
  revokedSessionIds: z.array(z.string()),
});

export type ResetPasswordData = z.infer<typeof resetPasswordDataSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const changePasswordDataSchema = z.object({
  changed: z.literal(true),
  revokedSessionIds: z.array(z.string()),
});

export type ChangePasswordData = z.infer<typeof changePasswordDataSchema>;

export const verifyEmailInputSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;

export const verifyEmailDataSchema = z
  .object({
    user: sessionUserSchema,
  })
  .passthrough();

export type VerifyEmailData = z.infer<typeof verifyEmailDataSchema>;

export const setupTwoFactorDataSchema = z.object({
  pending: z.literal(true),
});

export type SetupTwoFactorData = z.infer<typeof setupTwoFactorDataSchema>;

export const confirmTwoFactorInputSchema = z.object({
  code: z.string().min(6).max(6),
});

export type ConfirmTwoFactorInput = z.infer<typeof confirmTwoFactorInputSchema>;

export const confirmTwoFactorDataSchema = z.object({
  enabled: z.literal(true),
});

export type ConfirmTwoFactorData = z.infer<typeof confirmTwoFactorDataSchema>;

export const twoFactorChallengeInputSchema = z
  .object({
    code: z.string().min(6).max(6).optional(),
    recoveryCode: z.string().optional(),
  })
  .refine((val) => Boolean(val.code) || Boolean(val.recoveryCode), {
    message: "Debe ingresar un codigo 2FA o un codigo de recuperacion",
    path: ["code"],
  });

export type TwoFactorChallengeInput = z.infer<typeof twoFactorChallengeInputSchema>;

export const disableTwoFactorDataSchema = z.object({
  disabled: z.literal(true),
});

export type DisableTwoFactorData = z.infer<typeof disableTwoFactorDataSchema>;

export const regenerateRecoveryCodesDataSchema = z.object({
  regenerated: z.literal(true),
});

export type RegenerateRecoveryCodesData = z.infer<typeof regenerateRecoveryCodesDataSchema>;

export const refreshHeadlessDataSchema = z.object({
  user: sessionUserSchema,
  session: loginSessionSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type RefreshHeadlessData = z.infer<typeof refreshHeadlessDataSchema>;

export const loginHeadlessDataSchema = refreshHeadlessDataSchema;

export type LoginHeadlessData = RefreshHeadlessData;
