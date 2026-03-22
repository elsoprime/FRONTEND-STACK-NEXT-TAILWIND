import { expect, type Page, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";

const TENANT_ID = "507f191e810c19729de860ea";

function attachBaseExpensesAuthMocks(page: Page) {
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
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
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
              defaultCurrency: "CLP",
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

test("renders expenses reports dashboard with filters", async ({ page }) => {
  attachBaseExpensesAuthMocks(page);

  page.route("**/api/v1/modules/expenses/requests**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860f1",
              tenantId: TENANT_ID,
              requestNumber: "EXP-001",
              requesterUserId: "usr_owner_01",
              title: "Taxi aeropuerto",
              description: null,
              categoryKey: "travel",
              amount: 180000,
              currency: "CLP",
              expenseDate: "2026-03-20T10:00:00.000Z",
              status: "submitted",
              submittedAt: "2026-03-20T11:00:00.000Z",
              approvedAt: null,
              paidAt: null,
              canceledAt: null,
              rejectionReasonCode: null,
              paymentReference: null,
              metadata: {},
              createdAt: "2026-03-20T10:00:00.000Z",
              updatedAt: "2026-03-20T10:00:00.000Z",
            },
            {
              id: "507f191e810c19729de860f2",
              tenantId: TENANT_ID,
              requestNumber: "EXP-002",
              requesterUserId: "usr_owner_01",
              title: "Hotel cliente",
              description: null,
              categoryKey: "travel",
              amount: 320000,
              currency: "CLP",
              expenseDate: "2026-03-19T10:00:00.000Z",
              status: "approved",
              submittedAt: "2026-03-19T11:00:00.000Z",
              approvedAt: "2026-03-19T12:00:00.000Z",
              paidAt: null,
              canceledAt: null,
              rejectionReasonCode: null,
              paymentReference: null,
              metadata: {},
              createdAt: "2026-03-19T10:00:00.000Z",
              updatedAt: "2026-03-19T12:00:00.000Z",
            },
          ],
        },
        pagination: {
          page: 1,
          limit: 200,
          total: 2,
          totalPages: 1,
        },
        traceId: "trace-expenses-requests-dashboard",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/categories**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860c1",
              tenantId: TENANT_ID,
              key: "travel",
              name: "Travel",
              requiresAttachment: true,
              isActive: true,
              monthlyLimit: null,
              createdAt: "2026-03-19T10:00:00.000Z",
              updatedAt: "2026-03-19T10:00:00.000Z",
            },
          ],
        },
        pagination: {
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        },
        traceId: "trace-expenses-categories-dashboard",
      }),
    });
  });

  await page.goto("/app/expenses?tab=reports");

  await expect(page.getByRole("heading", { name: "Panel operativo de expenses" })).toBeVisible();
  await expect(page.getByTestId("expenses-dashboard-kpis")).toBeVisible();
  await expect(page.getByTestId("expenses-dashboard-trends")).toBeVisible();
  await expect(page.getByTestId("expenses-dashboard-categories")).toBeVisible();
  await expect(page.getByTestId("expenses-dashboard-alerts")).toBeVisible();

  await page.getByLabel("Estado").selectOption("approved");
  await expect(page.getByLabel("Estado")).toHaveValue("approved");

  await page.getByLabel("Categoria").selectOption("travel");
  await expect(page.getByLabel("Categoria")).toHaveValue("travel");
});