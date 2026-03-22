import { expect, test } from "@playwright/test";
import { attachTenantDashboardMocks } from "./helpers/dashboard-mocks";
import { setCsrfCookie } from "./helpers/csrf";

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

test("members workspace muestra estado sin acceso cuando faltan permisos", async ({ page }) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "usr_member_01",
            email: "member@acme.dev",
            firstName: "Member",
            lastName: "Acme",
            status: "active",
            isEmailVerified: true,
          },
          session: {
            id: "sess_guard_01",
            userId: "usr_member_01",
            expiresAt: "2026-12-31T23:59:59.000Z",
          },
        },
        traceId: "trace-e2e-guards-refresh",
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
                id: "507f191e810c19729de860ea",
                name: "Acme",
                slug: "acme",
                status: "active",
                ownerUserId: "usr_owner_01",
                planId: "plan:growth",
                activeModuleKeys: ["inventory", "crm"],
                memberLimit: 25,
              },
              membership: {
                id: "mem_guard_01",
                tenantId: "507f191e810c19729de860ea",
                userId: "usr_member_01",
                roleKey: "tenant:member",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-guards-tenant",
      }),
    });
  });

  attachTenantDashboardMocks(page);
  await page.goto("/app/members?tab=team");

  await expect(page.getByRole("heading", { level: 1, name: "Miembros y acceso" })).toBeVisible();
  await expect(
    page.getByText("No tienes permisos para consultar memberships del tenant activo."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar" })).toHaveCount(0);
});

test("platform security muestra acceso restringido para owner tenant sin permisos platform", async ({
  page,
}) => {
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
            id: "sess_platform_guard_01",
            userId: "usr_owner_01",
            expiresAt: "2026-12-31T23:59:59.000Z",
          },
        },
        traceId: "trace-e2e-platform-guard-refresh",
      }),
    });
  });

  await page.route("**/api/v1/platform/settings", async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "RBAC_PERMISSION_DENIED",
          message: "Forbidden",
        },
        traceId: "trace-e2e-platform-guard-denied",
      }),
    });
  });

  await page.goto("/app/settings/security");

  await expect(
    page.getByRole("heading", { level: 1, name: "Seguridad de plataforma" }),
  ).toBeVisible();
  await expect(page.getByText("Acceso restringido a seguridad de plataforma")).toBeVisible();
  await expect(
    page.getByText(/Ser owner del tenant activo no otorga acceso por si solo/),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir a seguridad de usuario" })).toHaveAttribute(
    "href",
    "/app/settings/profile?tab=security",
  );
});
