import { expect, test } from "@playwright/test";
import { attachTenantDashboardMocks } from "./helpers/dashboard-mocks";
import { setCsrfCookie } from "./helpers/csrf";

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

function buildTenantSummary(id: string, name: string, activeModuleKeys: string[] = []) {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    status: "active",
    ownerUserId: "usr_owner_01",
    planId: "plan:starter",
    activeModuleKeys,
    memberLimit: null,
  };
}

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
        id: "sess_restore_01",
        userId: "usr_owner_01",
        expiresAt: "2026-12-31T23:59:59.000Z",
      },
    },
    traceId: "trace-e2e-refresh-restore-ok",
  };
}

test("app shell auto-switches when exactly one tenant exists", async ({ page }) => {
  let switchPayload: { tenantId?: string } | null = null;

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
              tenant: buildTenantSummary("507f191e810c19729de860ea", "Acme", ["inventory"]),
              membership: {
                id: "mem_01",
                tenantId: "507f191e810c19729de860ea",
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: false,
            },
          ],
        },
        traceId: "trace-e2e-tenant-one",
      }),
    });
  });

  await page.route("**/api/v1/tenant/switch", async (route) => {
    switchPayload = route.request().postDataJSON() as { tenantId?: string };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tenant: buildTenantSummary("507f191e810c19729de860ea", "Acme", ["inventory"]),
          membership: {
            id: "mem_01",
            tenantId: "507f191e810c19729de860ea",
            userId: "usr_owner_01",
            roleKey: "tenant:owner",
            status: "active",
          },
        },
        traceId: "trace-e2e-tenant-switch-ok",
      }),
    });
  });

  attachTenantDashboardMocks(page);
  await page.goto("/app");

  await expect(page.getByRole("heading", { level: 2, name: "Acme" })).toBeVisible();
  await expect(page.getByText("Contexto activo")).toBeVisible();
  expect(switchPayload).toEqual({
    tenantId: "507f191e810c19729de860ea",
  });
});

test("tenant selector activates the chosen tenant and returns to shell", async ({ page }) => {
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
              tenant: buildTenantSummary("507f191e810c19729de860ea", "Acme"),
              membership: {
                id: "mem_01",
                tenantId: "507f191e810c19729de860ea",
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: false,
            },
            {
              tenant: buildTenantSummary("507f191e810c19729de860eb", "Globex", ["crm"]),
              membership: {
                id: "mem_02",
                tenantId: "507f191e810c19729de860eb",
                userId: "usr_owner_01",
                roleKey: "tenant:member",
                status: "active",
              },
              isActive: false,
            },
          ],
        },
        traceId: "trace-e2e-tenant-multi",
      }),
    });
  });

  await page.route("**/api/v1/tenant/switch", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tenant: buildTenantSummary("507f191e810c19729de860eb", "Globex", ["crm"]),
          membership: {
            id: "mem_02",
            tenantId: "507f191e810c19729de860eb",
            userId: "usr_owner_01",
            roleKey: "tenant:member",
            status: "active",
          },
        },
        traceId: "trace-e2e-tenant-switch-globex",
      }),
    });
  });

  await page.goto("/app/tenants/select");
  await page.getByRole("button", { name: /Activar( tenant)?/i }).nth(1).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { level: 2, name: "Globex" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "CRM" })).toBeVisible();
});

test("tenant create form creates and activates a new tenant", async ({ page }) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildRefreshSuccess()),
    });
  });

  await page.route("**/api/v1/tenant", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tenant: buildTenantSummary("507f191e810c19729de860ec", "Nexa", ["inventory", "crm"]),
          membership: {
            id: "mem_03",
            tenantId: "507f191e810c19729de860ec",
            userId: "usr_owner_01",
            roleKey: "tenant:owner",
            status: "active",
          },
        },
        traceId: "trace-e2e-tenant-create-ok",
      }),
    });
  });

  await page.route("**/api/v1/tenant/switch", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tenant: buildTenantSummary("507f191e810c19729de860ec", "Nexa", ["inventory", "crm"]),
          membership: {
            id: "mem_03",
            tenantId: "507f191e810c19729de860ec",
            userId: "usr_owner_01",
            roleKey: "tenant:owner",
            status: "active",
          },
        },
        traceId: "trace-e2e-tenant-switch-created",
      }),
    });
  });

  await page.goto("/app/tenants/create");
  await page.getByLabel("Nombre del tenant").fill("Nexa");
  await page.getByLabel("Slug publico").fill("nexa");
  await page.getByRole("button", { name: "Crear tenant y activar contexto" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { level: 2, name: "Nexa" })).toBeVisible();
  await expect(page.getByText("inventory, crm", { exact: false })).toBeVisible();
});




