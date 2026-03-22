import { expect, type Page, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";

const TENANT_ID = "507f191e810c19729de860ea";

function attachMemberAuthMocks(page: Page) {
  page.route("**/api/v1/auth/refresh/browser", async (route) => {
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
            id: "sess_01",
            userId: "usr_member_01",
            expiresAt: "2026-12-31T23:59:59.000Z",
          },
        },
        traceId: "trace-expenses-refresh",
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
                activeModuleKeys: ["inventory", "crm", "hr", "expenses"],
                memberLimit: null,
              },
              membership: {
                id: "mem_01",
                tenantId: TENANT_ID,
                userId: "usr_member_01",
                roleKey: "tenant:member",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-expenses-tenant-mine",
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
              activeModuleKeys: ["inventory", "crm", "hr", "expenses"],
              enabledModuleKeys: ["inventory", "crm", "hr", "expenses"],
              featureFlagKeys: ["inventory:analytics", "crm:base", "expenses:base"],
            },
          },
        },
        traceId: "trace-expenses-runtime",
      }),
    });
  });
}

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

test("shows read-only settings when role lacks settings update permission", async ({ page }) => {
  attachMemberAuthMocks(page);

  let updateCategoryCalled = false;
  let updateSettingsCalled = false;

  page.route("**/api/v1/modules/expenses/categories**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860f2",
              tenantId: TENANT_ID,
              key: "travel",
              name: "Travel",
              requiresAttachment: true,
              isActive: true,
              monthlyLimit: 5000,
              createdAt: "2026-03-21T10:00:00.000Z",
              updatedAt: "2026-03-21T10:00:00.000Z",
            },
          ],
        },
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        traceId: "trace-expenses-categories",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/categories/*", async (route) => {
    updateCategoryCalled = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { category: {} }, traceId: "trace-patch" }),
    });
  });

  page.route("**/api/v1/modules/expenses/settings", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            settings: {
              tenantId: TENANT_ID,
              allowedCurrencies: ["USD"],
              maxAmountWithoutReview: 100,
              approvalMode: "single_step",
              bulkMaxItemsPerOperation: 50,
              exportsEnabled: true,
              createdAt: "2026-03-21T10:00:00.000Z",
              updatedAt: "2026-03-21T10:00:00.000Z",
            },
          },
          traceId: "trace-expenses-settings",
        }),
      });
      return;
    }

    updateSettingsCalled = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { settings: {} }, traceId: "trace-put" }),
    });
  });

  await page.goto("/app/expenses?tab=settings");

  await expect(page.getByText("Modo solo lectura: tu rol no tiene permiso de actualizacion.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Guardar settings" })).toBeDisabled();
  expect(updateCategoryCalled).toBe(false);
  expect(updateSettingsCalled).toBe(false);
});
