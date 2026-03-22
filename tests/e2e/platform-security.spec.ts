import { expect, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

function buildRefreshSuccess() {
  return {
    success: true,
    data: {
      user: {
        id: "usr_platform_01",
        email: "platform@acme.dev",
        firstName: "Platform",
        lastName: "Admin",
        status: "active",
        isEmailVerified: true,
      },
      session: {
        id: "sess_platform_01",
        userId: "usr_platform_01",
        expiresAt: "2026-12-31T23:59:59.000Z",
      },
    },
    traceId: "trace-e2e-refresh-platform-security",
  };
}

function buildPlatformSettings(overrides?: {
  requireTwoFactorForPrivilegedUsers?: boolean;
  minLength?: number;
  browserSessionTtlMinutes?: number;
}) {
  return {
    success: true,
    data: {
      settings: {
        id: "cfg_platform_01",
        singletonKey: "platform_settings",
        branding: {
          applicationName: "Acme Platform",
          supportEmail: "support@acme.dev",
          supportUrl: "https://acme.dev/support",
        },
        localization: {
          defaultLanguage: "es",
          defaultTimezone: "America/Santiago",
          defaultCurrency: "USD",
        },
        security: {
          allowUserRegistration: true,
          requireEmailVerification: true,
          requireTwoFactorForPrivilegedUsers: overrides?.requireTwoFactorForPrivilegedUsers ?? true,
          passwordPolicy: {
            minLength: overrides?.minLength ?? 12,
            preventReuseCount: 5,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecialChar: true,
          },
          sessionPolicy: {
            browserSessionTtlMinutes: overrides?.browserSessionTtlMinutes ?? 1440,
            idleTimeoutMinutes: 30,
          },
          riskControls: {
            allowRecoveryCodes: true,
            enforceVerifiedEmailForPrivilegedAccess: true,
          },
        },
        operations: {
          maintenanceMode: false,
        },
        modules: {
          disabledModuleKeys: [],
        },
        featureFlags: {
          disabledFeatureFlagKeys: [],
        },
      },
    },
    traceId: "trace-e2e-platform-settings-read",
  };
}

test("platform security carga y guarda politicas globales", async ({ page }) => {
  let patchPayload: Record<string, unknown> | null = null;
  let currentSettings = buildPlatformSettings();

  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildRefreshSuccess()),
    });
  });

  await page.route("**/api/v1/platform/settings", async (route) => {
    if (route.request().method() === "PATCH") {
      patchPayload = route.request().postDataJSON() as Record<string, unknown>;
      currentSettings = buildPlatformSettings({
        requireTwoFactorForPrivilegedUsers: false,
        minLength: 16,
        browserSessionTtlMinutes: 720,
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...currentSettings,
          traceId: "trace-e2e-platform-settings-update",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(currentSettings),
    });
  });

  await page.goto("/app/settings/security");

  await expect(
    page.getByRole("heading", { level: 1, name: "Seguridad de plataforma" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Estado actual de seguridad de plataforma" }),
  ).toBeVisible();
  await expect(page.getByText("Activa", { exact: true })).toBeVisible();
  await expect(page.getByText("12 caracteres")).toBeVisible();

  await page.getByRole("tab", { name: /Politicas/i }).click();
  await expect(
    page.getByRole("heading", { level: 3, name: "Controles globales activos" }),
  ).toBeVisible();

  await page.getByLabel("Requerir 2FA para usuarios privilegiados").uncheck();
  await page
    .getByRole("heading", { level: 4, name: "Politica de password" })
    .locator("..")
    .getByRole("textbox")
    .nth(0)
    .fill("16");
  await page
    .getByRole("heading", { level: 4, name: "Sesion y riesgo" })
    .locator("..")
    .getByRole("textbox")
    .nth(0)
    .fill("720");
  await page.getByRole("button", { name: "Guardar politicas" }).click();

  await expect(page.getByText("Politicas de seguridad actualizadas correctamente.")).toBeVisible();
  expect(patchPayload).toMatchObject({
    security: {
      requireTwoFactorForPrivilegedUsers: false,
      passwordPolicy: {
        minLength: 16,
      },
      sessionPolicy: {
        browserSessionTtlMinutes: 720,
      },
    },
  });

  await page.getByRole("tab", { name: /Resumen/i }).click();
  await expect(page.getByText("Opcional")).toBeVisible();
  await expect(page.getByText("16 caracteres")).toBeVisible();
  await expect(page.getByText("720 min")).toBeVisible();
});
