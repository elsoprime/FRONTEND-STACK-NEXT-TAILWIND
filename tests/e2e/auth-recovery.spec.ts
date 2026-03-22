import { expect, test } from "@playwright/test";
import { attachTenantDashboardMocks } from "./helpers/dashboard-mocks";
import { setCsrfCookie } from "./helpers/csrf";

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

function buildRefreshSuccess() {
  return {
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
        id: "sess_profile_01",
        userId: "usr_owner_01",
        expiresAt: "2026-12-31T23:59:59.000Z",
      },
    },
    traceId: "trace-e2e-refresh-auth-recovery",
  };
}

function buildTenantSummary() {
  return {
    id: "507f191e810c19729de860ea",
    name: "Acme",
    slug: "acme",
    status: "active",
    ownerUserId: "usr_owner_01",
    planId: "plan:growth",
    activeModuleKeys: ["inventory"],
    memberLimit: 25,
  };
}

test("forgot y reset password completan el flujo publico", async ({ page }) => {
  let forgotPayload: { email?: string } | null = null;
  let resetPayload: { email?: string; token?: string; newPassword?: string } | null = null;

  await page.route("**/api/v1/auth/forgot-password", async (route) => {
    forgotPayload = route.request().postDataJSON() as { email?: string };
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { accepted: true },
        traceId: "trace-e2e-forgot-password",
      }),
    });
  });

  await page.route("**/api/v1/auth/reset-password", async (route) => {
    resetPayload = route.request().postDataJSON() as {
      email?: string;
      token?: string;
      newPassword?: string;
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          reset: true,
          revokedSessionIds: ["sess_a", "sess_b"],
        },
        traceId: "trace-e2e-reset-password",
      }),
    });
  });

  await page.goto("/auth/forgot-password");

  await expect(page.getByRole("heading", { name: "Recuperar contrasena" })).toBeVisible();
  await page.getByLabel("Email de la cuenta").fill("owner@acme.dev");
  await page.getByRole("button", { name: "Enviar instrucciones" }).click();

  await expect(page.getByText("Solicitud aceptada")).toBeVisible();
  await expect(page.getByText("Si la cuenta es elegible, enviamos instrucciones a")).toBeVisible();
  expect(forgotPayload).toEqual({ email: "owner@acme.dev" });

  await page.goto("/auth/reset-password?email=owner@acme.dev&token=token_123456");

  await expect(page.getByRole("heading", { name: "Restablecer contrasena" })).toBeVisible();
  await expect(page.getByLabel("Email de la cuenta")).toHaveValue("owner@acme.dev");
  await expect(page.getByLabel("Token de recuperacion")).toHaveValue("token_123456");
  await page.getByLabel("Nueva contrasena").fill("NuevaClave123!");
  await page.getByLabel("Confirmar contrasena").fill("NuevaClave123!");
  await page.getByRole("button", { name: "Restablecer contrasena" }).click();

  await expect(page.getByText("Contrasena actualizada")).toBeVisible();
  await expect(
    page.getByText("Se revocaron 2 sesiones activas asociadas a la cuenta."),
  ).toBeVisible();
  expect(resetPayload).toEqual({
    email: "owner@acme.dev",
    token: "token_123456",
    newPassword: "NuevaClave123!",
  });
});

test("perfil y seguridad permite cambiar contrasena y refleja sesiones revocadas", async ({
  page,
}) => {
  let changePasswordPayload: { currentPassword?: string; newPassword?: string } | null = null;

  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildRefreshSuccess()),
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
              tenant: buildTenantSummary(),
              membership: {
                id: "mem_01",
                tenantId: "507f191e810c19729de860ea",
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-profile-tenant-active",
      }),
    });
  });

  await page.route("**/api/v1/auth/change-password", async (route) => {
    changePasswordPayload = route.request().postDataJSON() as {
      currentPassword?: string;
      newPassword?: string;
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          changed: true,
          revokedSessionIds: ["sess_other_01", "sess_other_02"],
        },
        traceId: "trace-e2e-change-password",
      }),
    });
  });

  attachTenantDashboardMocks(page);
  await page.goto("/app/settings/profile?tab=security");

  await expect(page.getByRole("heading", { level: 1, name: "Perfil y seguridad" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Proteccion de acceso del usuario" }),
  ).toBeVisible();

  await page.locator("#change-current-password").fill("Actual123!");
  await page.locator("#change-new-password").fill("NuevaClave123!");
  await page.locator("#change-confirm-password").fill("NuevaClave123!");
  await page.getByRole("button", { name: "Cambiar contrasena" }).click();

  await expect(page.getByText("Contrasena actualizada. Sesiones revocadas: 2.")).toBeVisible();
  expect(changePasswordPayload).toEqual({
    currentPassword: "Actual123!",
    newPassword: "NuevaClave123!",
  });
});
