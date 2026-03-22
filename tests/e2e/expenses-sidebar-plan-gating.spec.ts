import { expect, Page, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";

const TENANT_ID = "507f191e810c19729de860ea";

type RuntimeModules = {
  activeModuleKeys: string[];
  enabledModuleKeys: string[];
};

function attachBaseShellMocks(page: Page, modules: RuntimeModules) {
  page.route("**/api/v1/auth/refresh/browser", async (route) => {
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
        traceId: "trace-expenses-sidebar-refresh",
      }),
    });
  });

  page.route("**/api/v1/tenant/mine", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              tenant: {
                id: TENANT_ID,
                name: "Acme",
                slug: "acme",
                status: "active",
                ownerUserId: "usr_owner_01",
                planId: "plan:growth",
                activeModuleKeys: modules.activeModuleKeys,
                memberLimit: null,
              },
              membership: {
                id: "mem_01",
                tenantId: TENANT_ID,
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-expenses-sidebar-tenant-mine",
      }),
    });
  });

  page.route("**/api/v1/tenant/settings/effective", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          settings: {
            tenantId: TENANT_ID,
            branding: {
              displayName: "Acme",
              supportEmail: "ops@acme.dev",
              supportUrl: "https://support.acme.dev",
            },
            localization: {
              defaultTimezone: "America/Santiago",
              defaultCurrency: "USD",
              defaultLanguage: "es",
            },
            contact: {
              primaryEmail: "ops@acme.dev",
              phone: "+56 9 0000 0000",
              websiteUrl: "https://acme.dev",
            },
            billing: {
              billingEmail: "billing@acme.dev",
              legalName: "Acme Corporation",
              taxId: "123456789",
            },
            runtime: {
              planId: "plan:growth",
              activeModuleKeys: modules.activeModuleKeys,
              enabledModuleKeys: modules.enabledModuleKeys,
              featureFlagKeys: ["inventory:analytics", "crm:base"],
            },
          },
        },
        traceId: "trace-expenses-sidebar-runtime",
      }),
    });
  });

  page.route("**/api/v1/billing/plans", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { items: [] }, traceId: "trace-plans" }),
    });
  });

  page.route("**/api/v1/modules/inventory/alerts/low-stock", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { items: [] }, traceId: "trace-alerts" }),
    });
  });

  page.route("**/api/v1/modules/crm/counters", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          counters: {
            tenantId: TENANT_ID,
            contactsActive: 0,
            organizationsActive: 0,
            opportunitiesOpen: 0,
            opportunitiesWon: 0,
            opportunitiesLost: 0,
          },
        },
        traceId: "trace-crm-counters",
      }),
    });
  });

  page.route("**/api/v1/modules/hr/employees**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { items: [] },
        pagination: { page: 1, limit: 1, total: 0, totalPages: 1 },
        traceId: "trace-hr-employees",
      }),
    });
  });

  page.route("**/api/v1/audit**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { items: [] },
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
        traceId: "trace-audit",
      }),
    });
  });
}

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

test("keeps expenses disabled in sidebar when plan does not include module", async ({ page }) => {
  attachBaseShellMocks(page, {
    activeModuleKeys: ["inventory", "crm", "hr"],
    enabledModuleKeys: ["inventory", "crm", "hr"],
  });

  await page.goto("/app");

  const sidebar = page.getByLabel("Sidebar tenant");
  await expect(sidebar.getByText("Expenses")).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Expenses" })).toHaveCount(0);
  await expect(sidebar.locator('[title="Expenses: No incluido en tu plan activo"]')).toBeVisible();
});

test("enables expenses link in sidebar when plan includes module", async ({ page }) => {
  attachBaseShellMocks(page, {
    activeModuleKeys: ["inventory", "crm", "hr", "expenses"],
    enabledModuleKeys: ["inventory", "crm", "hr", "expenses"],
  });

  await page.goto("/app");

  const sidebar = page.getByLabel("Sidebar tenant");
  const expensesLink = sidebar.getByRole("link", { name: "Expenses" });
  await expect(expensesLink).toBeVisible();
  await expect(expensesLink).toHaveAttribute("href", "/app/expenses");
});
