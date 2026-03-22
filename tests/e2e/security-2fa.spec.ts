import { expect, test } from "@playwright/test";
import { attachTenantDashboardMocks } from "./helpers/dashboard-mocks";
import { setCsrfCookie } from "./helpers/csrf";

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

test("2FA setup y confirmacion basicos en perfil y seguridad", async ({ page }) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "usr_owner_01",
            email: "owner@acme.dev",
            firstName: "Owner",
            lastName: "Acme",
            status: "active",
            isEmailVerified: true,
          },
          session: {
            id: "sess_01",
            userId: "usr_owner_01",
            expiresAt: "2026-12-31T23:59:59.000Z",
          },
        },
        traceId: "trace-e2e-refresh-security",
      }),
    });
  });

  await page.route("**/api/v1/tenant/mine", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              tenant: {
                id: "t1",
                name: "Acme",
                slug: "acme",
                status: "active",
                ownerUserId: "usr_owner_01",
                planId: "plan:starter",
                activeModuleKeys: [],
                memberLimit: null,
              },
              membership: {
                id: "mem_01",
                tenantId: "t1",
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-tenant-security",
      }),
    });
  });

  await page.route("**/api/v1/tenant/settings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tenantId: "t1",
          timezone: "UTC",
          locale: "es-CL",
        },
        traceId: "trace-e2e-tenant-settings",
      }),
    });
  });

  await page.route("**/api/v1/tenant/settings/effective", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tenantId: "t1",
          planId: "plan:starter",
          modules: {
            inventory: { enabled: true },
            crm: { enabled: true },
            hr: { enabled: false },
          },
          featureFlags: {},
        },
        traceId: "trace-e2e-tenant-effective",
      }),
    });
  });

  await page.route("**/api/v1/auth/2fa/setup", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { pending: true },
        traceId: "trace-e2e-2fa-setup",
      }),
    });
  });

  let confirmPayload: { code?: string } | null = null;

  await page.route("**/api/v1/auth/2fa/confirm", async (route) => {
    confirmPayload = route.request().postDataJSON() as { code?: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { enabled: true },
        traceId: "trace-e2e-2fa-confirm",
      }),
    });
  });

  attachTenantDashboardMocks(page);
  await page.goto("/app/settings/profile?tab=security");

  await expect(page.getByRole("heading", { level: 1, name: "Perfil y seguridad" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Proteccion de acceso del usuario" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Iniciar 2FA" }).click();
  await expect(page.getByText("Provision pendiente")).toBeVisible();

  await page.getByLabel("Codigo TOTP").fill("123456");
  await page.getByRole("button", { name: "Confirmar 2FA" }).click();
  await expect(page.getByText("2FA habilitado correctamente.")).toBeVisible();
  expect(confirmPayload).toEqual({ code: "123456" });
});
