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

  page.route("**/api/v1/modules/expenses/reports/dashboard**", async (route) => {
    const url = new URL(route.request().url());
    const status = url.searchParams.get("status");
    const categoryKey = url.searchParams.get("categoryKey");

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          dashboard: {
            filters: {
              dateWindowDays: Number(url.searchParams.get("dateWindowDays") ?? 30),
              status,
              categoryKey,
            },
            primaryCurrency: "CLP",
            hasMixedCurrencies: false,
            totalsByCurrency: [
              {
                currency: "CLP",
                requestCount: 2,
                totalAmount: 500000,
                pendingAmount: 180000,
                approvedAmount: 320000,
                paidAmount: 0,
              },
            ],
            availableCategories: [
              {
                key: "travel",
                name: "Travel",
              },
            ],
            kpis: {
              totalRequests: 2,
              pendingRequests: 1,
              approvedRequests: status === "approved" ? 1 : 1,
              rejectedRequests: 0,
              totalAmount: status === "approved" ? 320000 : 500000,
              pendingAmount: status === "approved" ? 0 : 180000,
            },
            trends: [
              {
                day: "19/03",
                requested: 1,
                approved: 1,
                rejected: 0,
              },
              {
                day: "20/03",
                requested: status === "approved" ? 0 : 1,
                approved: 0,
                rejected: 0,
              },
            ],
            categories: categoryKey === "travel"
              ? [
                  {
                    categoryKey: "travel",
                    label: "Travel",
                    totalAmount: status === "approved" ? 320000 : 500000,
                    requests: status === "approved" ? 1 : 2,
                  },
                ]
              : [
                  {
                    categoryKey: "travel",
                    label: "Travel",
                    totalAmount: status === "approved" ? 320000 : 500000,
                    requests: status === "approved" ? 1 : 2,
                  },
                ],
            alerts: [
              {
                id: "healthy",
                severity: "info",
                title: "Operacion estable",
                description: "No se detectaron alertas operativas para el rango seleccionado.",
              },
            ],
          },
        },
        traceId: "trace-expenses-dashboard-native",
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
