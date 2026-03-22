import { expect, Page, test } from "@playwright/test";
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

test("bulk approve reports partial result", async ({ page }) => {
  attachBaseExpensesAuthMocks(page);

  page.route("**/api/v1/modules/expenses/queue**", async (route) => {
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
              title: "Hotel cliente",
              description: "Viaje operativo",
              categoryKey: "travel",
              amount: 300,
              currency: "USD",
              expenseDate: "2026-03-21T10:00:00.000Z",
              status: "submitted",
              submittedAt: "2026-03-21T10:05:00.000Z",
              approvedAt: null,
              paidAt: null,
              canceledAt: null,
              rejectionReasonCode: null,
              paymentReference: null,
              metadata: {},
              createdAt: "2026-03-21T10:00:00.000Z",
              updatedAt: "2026-03-21T10:00:00.000Z",
            },
            {
              id: "507f191e810c19729de860f2",
              tenantId: TENANT_ID,
              requestNumber: "EXP-002",
              requesterUserId: "usr_owner_01",
              title: "Taxi retorno",
              description: null,
              categoryKey: "transport",
              amount: 60,
              currency: "USD",
              expenseDate: "2026-03-21T11:00:00.000Z",
              status: "submitted",
              submittedAt: "2026-03-21T11:05:00.000Z",
              approvedAt: null,
              paidAt: null,
              canceledAt: null,
              rejectionReasonCode: null,
              paymentReference: null,
              metadata: {},
              createdAt: "2026-03-21T11:00:00.000Z",
              updatedAt: "2026-03-21T11:00:00.000Z",
            },
          ],
        },
        pagination: {
          page: 1,
          limit: 8,
          total: 2,
          totalPages: 1,
        },
        traceId: "trace-expenses-queue",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/requests/bulk/approve", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          result: {
            processed: 2,
            succeeded: 1,
            failed: 1,
            results: [
              {
                id: "507f191e810c19729de860f1",
                success: true,
              },
              {
                id: "507f191e810c19729de860f2",
                success: false,
                code: "EXPENSE_INVALID_STATUS",
                message: "La solicitud ya no esta en estado submitted.",
              },
            ],
          },
        },
        traceId: "trace-expenses-bulk-approve",
      }),
    });
  });

  await page.goto("/app/expenses");

  await expect(page.getByRole("heading", { name: "Solicitudes de gasto" })).toBeVisible();
  await page.getByRole("button", { name: "Seleccionar visibles" }).click();
  await page.getByRole("button", { name: "Aprobar" }).click();

  await expect(page.getByText("Aprobacion masiva completada")).toBeVisible();
  await expect(page.getByText("Parcial")).toBeVisible();
  await expect(page.getByText("EXPENSE_INVALID_STATUS")).toBeVisible();
});

