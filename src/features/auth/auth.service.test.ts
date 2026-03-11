import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  loginAndBootstrapSession,
  loginHeadless,
  logoutAllSessions,
  logoutCurrentSession,
  refreshBrowserSession,
  refreshHeadlessSession,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  changeCurrentPassword,
  setupTwoFactor,
  confirmTwoFactor,
  regenerateRecoveryCodes,
  disableTwoFactor,
  resendVerification,
  resolvePostLoginRoute,
  verifyEmailToken,
} from "@/features/auth/auth.service";
import { type TenantSummary } from "@/features/tenant/tenant.schemas";
import { server } from "@/mocks/server";

const LOGIN_PATH = "*/api/v1/auth/login/browser";
const LOGIN_HEADLESS_PATH = "*/api/v1/auth/login/headless";
const REFRESH_BROWSER_PATH = "*/api/v1/auth/refresh/browser";
const TENANT_MINE_PATH = "*/api/v1/tenant/mine";
const REGISTER_PATH = "*/api/v1/auth/register";
const RESEND_VERIFICATION_PATH = "*/api/v1/auth/resend-verification";
const FORGOT_PASSWORD_PATH = "*/api/v1/auth/forgot-password";
const RESET_PASSWORD_PATH = "*/api/v1/auth/reset-password";
const CHANGE_PASSWORD_PATH = "*/api/v1/auth/change-password";
const VERIFY_EMAIL_PATH = "*/api/v1/auth/verify-email";
const LOGOUT_PATH = "*/api/v1/auth/logout";
const LOGOUT_ALL_PATH = "*/api/v1/auth/logout-all";
const REFRESH_HEADLESS_PATH = "*/api/v1/auth/refresh/headless";
const SETUP_2FA_PATH = "*/api/v1/auth/2fa/setup";
const CONFIRM_2FA_PATH = "*/api/v1/auth/2fa/confirm";
const DISABLE_2FA_PATH = "*/api/v1/auth/2fa/disable";
const RECOVERY_CODES_REGEN_PATH = "*/api/v1/auth/recovery-codes/regenerate";

const loginSuccessEnvelope = {
  success: true as const,
  data: {
    user: {
      id: "usr_01",
      email: "owner@acme.dev",
      firstName: "Owner",
      lastName: "Acme",
      status: "active",
      isEmailVerified: true,
    },
    session: {
      id: "sess_01",
      userId: "usr_01",
      expiresAt: "2026-12-31T23:59:59.000Z",
    },
  },
  traceId: "trace-login-ok",
};

function buildTenantSummary(id: string, name: string): TenantSummary {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    status: "active",
    ownerUserId: "usr_01",
    planId: "plan:starter",
    activeModuleKeys: [],
    memberLimit: null,
  };
}

describe("auth.service", () => {
  it("resolvePostLoginRoute returns create page when there are no tenants", () => {
    expect(resolvePostLoginRoute([])).toBe("/app/tenants/create");
  });

  it("resolvePostLoginRoute returns dashboard when there is one tenant", () => {
    expect(
      resolvePostLoginRoute([
        buildTenantSummary("tenant_01", "Acme"),
      ]),
    ).toBe("/app");
  });

  it("resolvePostLoginRoute returns selector when there are multiple tenants", () => {
    expect(
      resolvePostLoginRoute([
        buildTenantSummary("tenant_01", "Acme"),
        buildTenantSummary("tenant_02", "Globex"),
      ]),
    ).toBe("/app/tenants/select");
  });

  it("bootstraps session and routes to tenant create when tenant list is empty", async () => {
    server.use(
      http.post(LOGIN_PATH, () => HttpResponse.json(loginSuccessEnvelope)),
      http.get(TENANT_MINE_PATH, () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [],
          },
          traceId: "trace-tenant-empty",
        }),
      ),
    );

    const result = await loginAndBootstrapSession({
      email: "owner@acme.dev",
      password: "Demo123!",
    });

    expect(result.nextRoute).toBe("/app/tenants/create");
    expect(result.session.user.email).toBe("owner@acme.dev");
    expect(result.traceIds.login).toBe("trace-login-ok");
    expect(result.traceIds.tenantMine).toBe("trace-tenant-empty");
  });

  it("normalizes tenant membership summaries from tenant/mine", async () => {
    server.use(
      http.post(LOGIN_PATH, () => HttpResponse.json(loginSuccessEnvelope)),
      http.get(TENANT_MINE_PATH, () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                tenant: buildTenantSummary("tenant_01", "Acme"),
                membership: {
                  id: "mem_01",
                  tenantId: "tenant_01",
                  userId: "usr_01",
                  roleKey: "tenant:owner",
                  status: "active",
                },
                isActive: false,
              },
              {
                tenant: buildTenantSummary("tenant_02", "Globex"),
                membership: {
                  id: "mem_02",
                  tenantId: "tenant_02",
                  userId: "usr_01",
                  roleKey: "tenant:member",
                  status: "active",
                },
                isActive: false,
              },
            ],
          },
          traceId: "trace-tenant-memberships",
        }),
      ),
    );

    const result = await loginAndBootstrapSession({
      email: "owner@acme.dev",
      password: "Demo123!",
    });

    expect(result.nextRoute).toBe("/app/tenants/select");
    expect(result.tenants).toHaveLength(2);
    expect(result.tenants[0]?.id).toBe("tenant_01");
    expect(result.tenants[1]?.id).toBe("tenant_02");
  });

  it("registers a user and returns a generic acknowledgement", async () => {
    server.use(
      http.post(REGISTER_PATH, async ({ request }) => {
        const payload = (await request.json()) as {
          firstName: string;
          lastName: string | null;
          email: string;
          password: string;
        };

        expect(payload).toEqual({
          firstName: "Ana",
          lastName: "Diaz",
          email: "ana@acme.dev",
          password: "Demo123!",
        });

        return HttpResponse.json(
          {
            success: true,
            data: {
              accepted: true,
            },
            traceId: "trace-register-ok",
          },
          { status: 202 },
        );
      }),
    );

    const result = await registerUser({
      firstName: "Ana",
      lastName: "Diaz",
      email: "ana@acme.dev",
      password: "Demo123!",
    });

    expect(result.success).toBe(true);
    expect(result.traceId).toBe("trace-register-ok");
    expect(result.data.accepted).toBe(true);
  });

  it("resends verification with a generic acknowledgement", async () => {
    server.use(
      http.post(RESEND_VERIFICATION_PATH, async ({ request }) => {
        const payload = (await request.json()) as {
          email: string;
        };

        expect(payload.email).toBe("ana@acme.dev");

        return HttpResponse.json(
          {
            success: true,
            data: {
              accepted: true,
            },
            traceId: "trace-resend-ok",
          },
          { status: 202 },
        );
      }),
    );

    const result = await resendVerification({
      email: "ana@acme.dev",
    });

    expect(result.success).toBe(true);
    expect(result.traceId).toBe("trace-resend-ok");
    expect(result.data.accepted).toBe(true);
  });

  it("requests password reset with generic acknowledgement", async () => {
    server.use(
      http.post(FORGOT_PASSWORD_PATH, async ({ request }) => {
        const payload = (await request.json()) as {
          email: string;
        };

        expect(payload.email).toBe("ana@acme.dev");

        return HttpResponse.json(
          {
            success: true,
            data: {
              accepted: true,
            },
            traceId: "trace-forgot-password-ok",
          },
          { status: 202 },
        );
      }),
    );

    const result = await requestPasswordReset({ email: "ana@acme.dev" });

    expect(result.success).toBe(true);
    expect(result.traceId).toBe("trace-forgot-password-ok");
    expect(result.data.accepted).toBe(true);
  });

  it("does not reveal account existence on forgot password", async () => {
    server.use(
      http.post(FORGOT_PASSWORD_PATH, async ({ request }) => {
        const payload = (await request.json()) as { email: string };

        expect(payload.email).toBe("ghost@acme.dev");

        return HttpResponse.json(
          {
            success: true,
            data: {
              accepted: true,
            },
            traceId: "trace-forgot-password-generic",
          },
          { status: 202 },
        );
      }),
    );

    const result = await requestPasswordReset({ email: "ghost@acme.dev" });

    expect(result.success).toBe(true);
    expect(result.data.accepted).toBe(true);
    expect(result.traceId).toBe("trace-forgot-password-generic");
  });
  it("resets password with token", async () => {
    server.use(
      http.post(RESET_PASSWORD_PATH, async ({ request }) => {
        const payload = (await request.json()) as {
          email: string;
          token: string;
          newPassword: string;
        };

        expect(payload).toEqual({
          email: "ana@acme.dev",
          token: "token_123",
          newPassword: "Demo456!",
        });

        return HttpResponse.json({
          success: true,
          data: {
            reset: true,
            revokedSessionIds: ["sess_01", "sess_02"],
          },
          traceId: "trace-reset-password-ok",
        });
      }),
    );

    const result = await resetPasswordWithToken({
      email: "ana@acme.dev",
      token: "token_123",
      newPassword: "Demo456!",
    });

    expect(result.success).toBe(true);
    expect(result.traceId).toBe("trace-reset-password-ok");
    expect(result.data.reset).toBe(true);
    expect(result.data.revokedSessionIds).toEqual(["sess_01", "sess_02"]);
  });

  it("changes password for authenticated user", async () => {
    server.use(
      http.post(CHANGE_PASSWORD_PATH, async ({ request }) => {
        const payload = (await request.json()) as {
          currentPassword: string;
          newPassword: string;
        };

        expect(payload).toEqual({
          currentPassword: "Demo123!",
          newPassword: "Demo456!",
        });

        return HttpResponse.json({
          success: true,
          data: {
            changed: true,
            revokedSessionIds: ["sess_02"],
          },
          traceId: "trace-change-password-ok",
        });
      }),
    );

    const result = await changeCurrentPassword({
      currentPassword: "Demo123!",
      newPassword: "Demo456!",
    });

    expect(result.success).toBe(true);
    expect(result.traceId).toBe("trace-change-password-ok");
    expect(result.data.changed).toBe(true);
    expect(result.data.revokedSessionIds).toEqual(["sess_02"]);
  });
  it("verifies email by email and token", async () => {
    server.use(
      http.post(VERIFY_EMAIL_PATH, async ({ request }) => {
        const payload = (await request.json()) as {
          email: string;
          token: string;
        };

        return HttpResponse.json({
          success: true,
          data: {
            user: {
              id: "usr_01",
              email: payload.email,
              firstName: "Ana",
              lastName: "Diaz",
              status: "active",
              isEmailVerified: payload.token.length > 0,
            },
          },
          traceId: "trace-verify-email-ok",
        });
      }),
    );

    const result = await verifyEmailToken({
      email: "ana@acme.dev",
      token: "token_123456",
    });

    expect(result.success).toBe(true);
    expect(result.traceId).toBe("trace-verify-email-ok");
    expect(result.data.user.email).toBe("ana@acme.dev");
    expect(result.data.user.isEmailVerified).toBe(true);
  });

    it("logs in headless mode and returns tokens", async () => {
    server.use(
      http.post(LOGIN_HEADLESS_PATH, async ({ request }) => {
        const payload = (await request.json()) as {
          email: string;
          password: string;
          twoFactorCode?: string;
        };

        expect(payload.email).toBe("owner@acme.dev");
        expect(payload.password).toBe("Demo123!");
        expect(payload.twoFactorCode).toBe("123456");

        return HttpResponse.json({
          success: true,
          data: {
            user: loginSuccessEnvelope.data.user,
            session: loginSuccessEnvelope.data.session,
            accessToken: "at_headless_123",
            refreshToken: "rt_headless_123",
          },
          traceId: "trace-login-headless-ok",
        });
      }),
    );

    const result = await loginHeadless({
      email: "owner@acme.dev",
      password: "Demo123!",
      twoFactorCode: "123456",
    });

    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBe("at_headless_123");
    expect(result.data.refreshToken).toBe("rt_headless_123");
    expect(result.traceId).toBe("trace-login-headless-ok");
  });
  it("restores browser session through refresh/browser", async () => {
    server.use(
      http.post(REFRESH_BROWSER_PATH, () =>
        HttpResponse.json({
          success: true,
          data: loginSuccessEnvelope.data,
          traceId: "trace-refresh-restore-ok",
        }),
      ),
    );

    const result = await refreshBrowserSession();

    expect(result.success).toBe(true);
    expect(result.traceId).toBe("trace-refresh-restore-ok");
    expect(result.data.session.id).toBe("sess_01");
  });

  it("restores headless session without CSRF", async () => {
    server.use(
      http.post(REFRESH_HEADLESS_PATH, () =>
        HttpResponse.json({
          success: true,
          data: {
            user: loginSuccessEnvelope.data.user,
            session: loginSuccessEnvelope.data.session,
            accessToken: "at_123",
            refreshToken: "rt_123",
          },
          traceId: "trace-refresh-headless-ok",
        }),
      ),
    );

    const result = await refreshHeadlessSession();

    expect(result.data.accessToken).toBe("at_123");
    expect(result.traceId).toBe("trace-refresh-headless-ok");
  });

  it("logs out the current session", async () => {
    server.use(
      http.post(LOGOUT_PATH, () =>
        HttpResponse.json({
          success: true,
          data: {
            revokedSessionIds: ["sess_01"],
          },
          traceId: "trace-logout-ok",
        }),
      ),
    );

    const result = await logoutCurrentSession();

    expect(result.success).toBe(true);
    expect(result.traceId).toBe("trace-logout-ok");
    expect(result.data.revokedSessionIds).toEqual(["sess_01"]);
  });

  it("logs out all active sessions", async () => {
    server.use(
      http.post(LOGOUT_ALL_PATH, () =>
        HttpResponse.json({
          success: true,
          data: {
            revokedSessionIds: ["sess_01", "sess_02"],
          },
          traceId: "trace-logout-all-ok",
        }),
      ),
    );

    const result = await logoutAllSessions();

    expect(result.success).toBe(true);
    expect(result.traceId).toBe("trace-logout-all-ok");
    expect(result.data.revokedSessionIds).toEqual(["sess_01", "sess_02"]);
  });

  it("starts 2FA setup", async () => {
    server.use(
      http.post(SETUP_2FA_PATH, () =>
        HttpResponse.json({
          success: true,
          data: {
            pending: true,
          },
          traceId: "trace-2fa-setup",
        }),
      ),
    );

    const result = await setupTwoFactor();
    expect(result.data.pending).toBe(true);
    expect(result.traceId).toBe("trace-2fa-setup");
  });

  it("confirms 2FA", async () => {
    server.use(
      http.post(CONFIRM_2FA_PATH, async ({ request }) => {
        const body = (await request.json()) as { code: string };
        expect(body.code).toBe("123456");
        return HttpResponse.json({
          success: true,
          data: {
            enabled: true,
          },
          traceId: "trace-2fa-confirm",
        });
      }),
    );

    const result = await confirmTwoFactor({ code: "123456" });
    expect(result.data.enabled).toBe(true);
    expect(result.traceId).toBe("trace-2fa-confirm");
  });

  it("regenerates recovery codes with recoveryCode challenge", async () => {
    server.use(
      http.post(RECOVERY_CODES_REGEN_PATH, async ({ request }) => {
        const body = (await request.json()) as { code?: string; recoveryCode?: string };
        expect(body.recoveryCode).toBe("RC-001");
        return HttpResponse.json({
          success: true,
          data: {
            regenerated: true,
          },
          traceId: "trace-2fa-recovery-regen",
        });
      }),
    );

    const result = await regenerateRecoveryCodes({ recoveryCode: "RC-001" });
    expect(result.data.regenerated).toBe(true);
  });

  it("disables 2FA with current code", async () => {
    server.use(
      http.post(DISABLE_2FA_PATH, async ({ request }) => {
        const body = (await request.json()) as { code?: string; recoveryCode?: string };
        expect(body.code).toBe("654321");
        return HttpResponse.json({
          success: true,
          data: {
            disabled: true,
          },
          traceId: "trace-2fa-disable",
        });
      }),
    );

    const result = await disableTwoFactor({ code: "654321" });
    expect(result.data.disabled).toBe(true);
  });
});

