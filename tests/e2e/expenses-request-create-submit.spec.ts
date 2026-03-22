import { expect, type Page, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";

const TENANT_ID = "507f191e810c19729de860ea";
const REQUEST_ID = "507f191e810c19729de860f9";

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

test("creates expense request and submits from workspace form", async ({ page }) => {
  attachBaseExpensesAuthMocks(page);

  const queueItems: Array<Record<string, unknown>> = [];
  let capturedCreatePayload: Record<string, unknown> | null = null;

  page.route("**/api/v1/modules/expenses/counters", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          counters: {
            total: queueItems.length,
            draft: 0,
            submitted: queueItems.length,
            returned: 0,
            approved: 0,
            rejected: 0,
            paid: 0,
            canceled: 0,
          },
        },
        traceId: "trace-expenses-counters",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/queue**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: queueItems,
        },
        pagination: {
          page: 1,
          limit: 8,
          total: queueItems.length,
          totalPages: 1,
        },
        traceId: "trace-expenses-queue",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/settings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          settings: {
            allowedCurrencies: ["CLP", "USD"],
            maxAmountWithoutReview: 500000,
            approvalMode: "single_step",
            bulkMaxItemsPerOperation: 50,
            exportsEnabled: true,
          },
        },
        traceId: "trace-expenses-settings",
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
              id: "cat_01",
              tenantId: TENANT_ID,
              key: "travel",
              name: "Viajes",
              requiresAttachment: true,
              monthlyLimit: 500000,
              isActive: true,
              createdAt: "2026-03-20T10:00:00.000Z",
              updatedAt: "2026-03-20T10:00:00.000Z",
            },
          ],
        },
        pagination: {
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        },
        traceId: "trace-expenses-categories",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/requests", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    capturedCreatePayload = route.request().postDataJSON() as Record<string, unknown>;

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          request: {
            id: REQUEST_ID,
            tenantId: TENANT_ID,
            requestNumber: "EXP-900",
            requesterUserId: "usr_owner_01",
            title: "Hotel cliente",
            description: "Viaje de ventas",
            categoryKey: "travel",
            amount: 120,
            currency: "CLP",
            expenseDate: "2026-03-21",
            status: "draft",
            submittedAt: null,
            approvedAt: null,
            paidAt: null,
            canceledAt: null,
            rejectionReasonCode: null,
            paymentReference: null,
            metadata: {},
            createdAt: "2026-03-21T10:00:00.000Z",
            updatedAt: "2026-03-21T10:00:00.000Z",
          },
        },
        traceId: "trace-expenses-create",
      }),
    });
  });

  page.route(`**/api/v1/modules/expenses/requests/${REQUEST_ID}/submit`, async (route) => {
    queueItems.splice(0, queueItems.length, {
      id: REQUEST_ID,
      tenantId: TENANT_ID,
      requestNumber: "EXP-900",
      requesterUserId: "usr_owner_01",
      title: "Hotel cliente",
      description: "Viaje de ventas",
      categoryKey: "travel",
      amount: 120,
      currency: "CLP",
      expenseDate: "2026-03-21",
      status: "submitted",
      submittedAt: "2026-03-21T10:10:00.000Z",
      approvedAt: null,
      paidAt: null,
      canceledAt: null,
      rejectionReasonCode: null,
      paymentReference: null,
      metadata: {},
      createdAt: "2026-03-21T10:00:00.000Z",
      updatedAt: "2026-03-21T10:10:00.000Z",
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          request: queueItems[0],
        },
        traceId: "trace-expenses-submit",
      }),
    });
  });

  await page.goto("/app/expenses");

  await page.getByRole("button", { name: "Nueva solicitud" }).click();
  await page.getByLabel("Titulo").fill("Hotel cliente");
  await page.getByLabel("Categoria").selectOption("travel");
  await page.getByLabel("Monto").fill("120");
  await expect(page.getByLabel("Moneda")).toHaveValue("CLP");
  await expect(page.getByLabel("Moneda")).toBeDisabled();
  await page.getByLabel("Fecha de gasto").fill("2026-03-21");
  await page.getByLabel("Descripcion (opcional)").fill("Viaje de ventas");

  await page.getByRole("button", { name: "Guardar y enviar" }).click();

  await expect(page.getByRole("heading", { name: "Solicitudes de gasto" })).toBeVisible();
  await expect(page.getByText("Hotel cliente")).toBeVisible();
  expect(capturedCreatePayload?.expenseDate).toBe("2026-03-21T00:00:00.000Z");
});
