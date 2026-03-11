import { apiRequest } from "@/lib/api/client";
import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import {
  changePasswordDataSchema,
  type ChangePasswordData,
  type ChangePasswordInput,
  confirmTwoFactorDataSchema,
  confirmTwoFactorInputSchema,
  disableTwoFactorDataSchema,
  forgotPasswordDataSchema,
  type ForgotPasswordData,
  type ForgotPasswordInput,
  loginBrowserDataSchema,
  loginHeadlessDataSchema,
  type LoginBrowserData,
  type LoginBrowserInput,
  type LoginHeadlessData,
  type LoginHeadlessInput,
  logoutDataSchema,
  type LogoutData,
  registerDataSchema,
  type RegisterData,
  type RegisterInput,
  regenerateRecoveryCodesDataSchema,
  refreshHeadlessDataSchema,
  type RefreshHeadlessData,
  resendVerificationDataSchema,
  type ResendVerificationData,
  type ResendVerificationInput,
  resetPasswordDataSchema,
  type ResetPasswordData,
  type ResetPasswordInput,
  setupTwoFactorDataSchema,
  twoFactorChallengeInputSchema,
  verifyEmailDataSchema,
  type VerifyEmailData,
  type VerifyEmailInput,
} from "@/features/auth/auth.schemas";
import { getMyTenantsNormalized } from "@/features/tenant/tenant.service";
import { type TenantSummary } from "@/features/tenant/tenant.schemas";

const AUTH_ENDPOINTS = {
  loginBrowser: "/api/v1/auth/login/browser",
  loginHeadless: "/api/v1/auth/login/headless",
  refreshBrowser: "/api/v1/auth/refresh/browser",
  register: "/api/v1/auth/register",
  resendVerification: "/api/v1/auth/resend-verification",
  forgotPassword: "/api/v1/auth/forgot-password",
  resetPassword: "/api/v1/auth/reset-password",
  verifyEmail: "/api/v1/auth/verify-email",
  logout: "/api/v1/auth/logout",
  logoutAll: "/api/v1/auth/logout-all",
  setupTwoFactor: "/api/v1/auth/2fa/setup",
  confirmTwoFactor: "/api/v1/auth/2fa/confirm",
  disableTwoFactor: "/api/v1/auth/2fa/disable",
  regenerateRecoveryCodes: "/api/v1/auth/recovery-codes/regenerate",
  changePassword: "/api/v1/auth/change-password",
  refreshHeadless: "/api/v1/auth/refresh/headless",
} as const;

export type PostLoginRoute = "/app" | "/app/tenants/create" | "/app/tenants/select";

export type LoginBootstrapResult = {
  session: LoginBrowserData;
  tenants: TenantSummary[];
  nextRoute: PostLoginRoute;
  traceIds: {
    login: string;
    tenantMine: string;
  };
};

export function resolvePostLoginRoute(tenants: TenantSummary[]): PostLoginRoute {
  if (tenants.length === 0) {
    return "/app/tenants/create";
  }

  if (tenants.length === 1) {
    return "/app";
  }

  return "/app/tenants/select";
}

export async function loginBrowser(
  payload: LoginBrowserInput,
): Promise<ApiSuccessEnvelope<LoginBrowserData>> {
  return apiRequest(AUTH_ENDPOINTS.loginBrowser, {
    method: "POST",
    body: payload,
    dataSchema: loginBrowserDataSchema,
    withCsrf: false,
    allowRefreshRetry: false,
  });
}


export async function loginHeadless(
  payload: LoginHeadlessInput,
): Promise<ApiSuccessEnvelope<LoginHeadlessData>> {
  return apiRequest(AUTH_ENDPOINTS.loginHeadless, {
    method: "POST",
    body: payload,
    dataSchema: loginHeadlessDataSchema,
    withCsrf: false,
    browserMode: false,
    allowRefreshRetry: false,
  });
}
export async function registerUser(
  payload: RegisterInput,
): Promise<ApiSuccessEnvelope<RegisterData>> {
  return apiRequest(AUTH_ENDPOINTS.register, {
    method: "POST",
    body: payload,
    dataSchema: registerDataSchema,
    withCsrf: false,
    allowRefreshRetry: false,
  });
}

export async function resendVerification(
  payload: ResendVerificationInput,
): Promise<ApiSuccessEnvelope<ResendVerificationData>> {
  return apiRequest(AUTH_ENDPOINTS.resendVerification, {
    method: "POST",
    body: payload,
    dataSchema: resendVerificationDataSchema,
    withCsrf: false,
    allowRefreshRetry: false,
  });
}

export async function requestPasswordReset(
  payload: ForgotPasswordInput,
): Promise<ApiSuccessEnvelope<ForgotPasswordData>> {
  return apiRequest(AUTH_ENDPOINTS.forgotPassword, {
    method: "POST",
    body: payload,
    dataSchema: forgotPasswordDataSchema,
    withCsrf: false,
    allowRefreshRetry: false,
  });
}

export async function resetPasswordWithToken(
  payload: ResetPasswordInput,
): Promise<ApiSuccessEnvelope<ResetPasswordData>> {
  return apiRequest(AUTH_ENDPOINTS.resetPassword, {
    method: "POST",
    body: payload,
    dataSchema: resetPasswordDataSchema,
    withCsrf: false,
    allowRefreshRetry: false,
  });
}

export async function verifyEmailToken(
  payload: VerifyEmailInput,
): Promise<ApiSuccessEnvelope<VerifyEmailData>> {
  return apiRequest(AUTH_ENDPOINTS.verifyEmail, {
    method: "POST",
    body: payload,
    dataSchema: verifyEmailDataSchema,
    withCsrf: false,
    allowRefreshRetry: false,
  });
}

export async function refreshBrowserSession(): Promise<ApiSuccessEnvelope<LoginBrowserData>> {
  return apiRequest(AUTH_ENDPOINTS.refreshBrowser, {
    method: "POST",
    dataSchema: loginBrowserDataSchema,
    allowRefreshRetry: false,
  });
}

export async function refreshHeadlessSession(): Promise<ApiSuccessEnvelope<RefreshHeadlessData>> {
  return apiRequest(AUTH_ENDPOINTS.refreshHeadless, {
    method: "POST",
    dataSchema: refreshHeadlessDataSchema,
    withCsrf: false,
    browserMode: false,
    allowRefreshRetry: false,
  });
}

export async function logoutCurrentSession(): Promise<ApiSuccessEnvelope<LogoutData>> {
  return apiRequest(AUTH_ENDPOINTS.logout, {
    method: "POST",
    dataSchema: logoutDataSchema,
  });
}

export async function logoutAllSessions(): Promise<ApiSuccessEnvelope<LogoutData>> {
  return apiRequest(AUTH_ENDPOINTS.logoutAll, {
    method: "POST",
    dataSchema: logoutDataSchema,
  });
}

export async function changeCurrentPassword(
  payload: ChangePasswordInput,
): Promise<ApiSuccessEnvelope<ChangePasswordData>> {
  return apiRequest(AUTH_ENDPOINTS.changePassword, {
    method: "POST",
    body: payload,
    dataSchema: changePasswordDataSchema,
  });
}

export async function loginAndBootstrapSession(
  payload: LoginBrowserInput,
): Promise<LoginBootstrapResult> {
  const loginResponse = await loginBrowser(payload);
  const { tenants, traceId } = await getMyTenantsNormalized();

  return {
    session: loginResponse.data,
    tenants,
    nextRoute: resolvePostLoginRoute(tenants),
    traceIds: {
      login: loginResponse.traceId,
      tenantMine: traceId,
    },
  };
}

export async function setupTwoFactor(): Promise<ApiSuccessEnvelope<typeof setupTwoFactorDataSchema["_input"]>> {
  return apiRequest(AUTH_ENDPOINTS.setupTwoFactor, {
    method: "POST",
    dataSchema: setupTwoFactorDataSchema,
  });
}

export async function confirmTwoFactor(
  payload: typeof confirmTwoFactorInputSchema["_input"],
): Promise<ApiSuccessEnvelope<typeof confirmTwoFactorDataSchema["_input"]>> {
  return apiRequest(AUTH_ENDPOINTS.confirmTwoFactor, {
    method: "POST",
    body: payload,
    dataSchema: confirmTwoFactorDataSchema,
  });
}

export async function regenerateRecoveryCodes(
  payload: typeof twoFactorChallengeInputSchema["_input"],
): Promise<ApiSuccessEnvelope<typeof regenerateRecoveryCodesDataSchema["_input"]>> {
  return apiRequest(AUTH_ENDPOINTS.regenerateRecoveryCodes, {
    method: "POST",
    body: payload,
    dataSchema: regenerateRecoveryCodesDataSchema,
  });
}

export async function disableTwoFactor(
  payload: typeof twoFactorChallengeInputSchema["_input"],
): Promise<ApiSuccessEnvelope<typeof disableTwoFactorDataSchema["_input"]>> {
  return apiRequest(AUTH_ENDPOINTS.disableTwoFactor, {
    method: "POST",
    body: payload,
    dataSchema: disableTwoFactorDataSchema,
  });
}


