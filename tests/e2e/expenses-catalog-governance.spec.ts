import { expect, type Page, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";

const TENANT_ID = "507f191e810c19729de860ea";
const CATEGORY_ID = "507f191e810c19729de860f2";

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

test("runs guided governance flow and creates real expense subcategory", async ({ page }) => {
  attachBaseExpensesAuthMocks(page);

  let categories = [
    {
      id: CATEGORY_ID,
      tenantId: TENANT_ID,
      key: "travel",
      name: "Travel",
      requiresAttachment: true,
      isActive: true,
      monthlyLimit: 500000,
      createdAt: "2026-03-21T10:00:00.000Z",
      updatedAt: "2026-03-21T10:00:00.000Z",
    },
  ];

  let subcategories = [
    {
      id: "507f191e810c19729de860f3",
      tenantId: TENANT_ID,
      categoryId: CATEGORY_ID,
      key: "travel_local",
      name: "Viajes locales",
      requiresAttachment: true,
      isActive: true,
      monthlyLimit: 250000,
      createdAt: "2026-03-21T10:02:00.000Z",
      updatedAt: "2026-03-21T10:02:00.000Z",
    },
  ];

  page.route("**/api/v1/modules/expenses/categories**", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { items: categories },
          pagination: { page: 1, limit: 100, total: categories.length, totalPages: 1 },
          traceId: "trace-expenses-categories",
        }),
      });
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    const nextCategory = {
      id: `507f191e810c19729de86${(100 + categories.length).toString().padStart(3, "0")}`,
      tenantId: TENANT_ID,
      key: String(body.key),
      name: String(body.name),
      requiresAttachment: Boolean(body.requiresAttachment),
      isActive: true,
      monthlyLimit: body.monthlyLimit === null ? null : Number(body.monthlyLimit),
      createdAt: "2026-03-21T10:05:00.000Z",
      updatedAt: "2026-03-21T10:05:00.000Z",
    };
    categories = [...categories, nextCategory];

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { category: nextCategory },
        traceId: "trace-expenses-category-create",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/subcategories**", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { items: subcategories },
          pagination: { page: 1, limit: 100, total: subcategories.length, totalPages: 1 },
          traceId: "trace-expenses-subcategories",
        }),
      });
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    const nextSubcategory = {
      id: `507f191e810c19729de87${(100 + subcategories.length).toString().padStart(3, "0")}`,
      tenantId: TENANT_ID,
      categoryId: String(body.categoryId),
      key: String(body.key),
      name: String(body.name),
      requiresAttachment: Boolean(body.requiresAttachment),
      isActive: true,
      monthlyLimit: body.monthlyLimit === null ? null : Number(body.monthlyLimit),
      createdAt: "2026-03-21T10:07:00.000Z",
      updatedAt: "2026-03-21T10:07:00.000Z",
    };

    subcategories = [...subcategories, nextSubcategory];

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { subcategory: nextSubcategory },
        traceId: "trace-expenses-subcategory-create",
      }),
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
              allowedCurrencies: ["CLP"],
              maxAmountWithoutReview: 100000,
              approvalMode: "single_step",
              bulkMaxItemsPerOperation: 100,
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

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          settings: {
            tenantId: TENANT_ID,
            allowedCurrencies: ["CLP"],
            maxAmountWithoutReview: 100000,
            approvalMode: "single_step",
            bulkMaxItemsPerOperation: 100,
            exportsEnabled: true,
            createdAt: "2026-03-21T10:00:00.000Z",
            updatedAt: "2026-03-21T10:08:00.000Z",
          },
        },
        traceId: "trace-expenses-settings-update",
      }),
    });
  });

  await page.goto("/app/expenses?tab=settings");
  await expect(page.getByRole("heading", { name: "Gobernanza de catalogo" })).toBeVisible();

  await page.getByTestId("expenses-category-governance-bulk-create-button").click();
  await expect(page.getByRole("heading", { name: "Alta masiva guiada" })).toBeVisible();

  await page.getByTestId("expenses-category-bulk-lines-input").fill(
    "travel_hotel|Hoteles|si|250000\ntravel_meals|Comidas|no|",
  );
  await page.getByRole("button", { name: "Validar lineas" }).click();
  await page.getByRole("button", { name: "Ejecutar alta" }).click();

  await expect(page.getByText("Alta masiva finalizada. Exitos: 2. Fallos: 0.")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();

  await page.getByTestId("expenses-subcategory-parent-select").selectOption(CATEGORY_ID);
  await page.getByTestId("expenses-subcategory-key-input").fill("travel_air");
  await page.getByTestId("expenses-subcategory-name-input").fill("Vuelos");
  await page.getByTestId("expenses-subcategory-limit-input").fill("350000");
  await page.getByTestId("expenses-subcategory-create-button").click();

  await expect(page.getByText("Subcategoria creada correctamente.")).toBeVisible();
  await expect(page.getByText("Vuelos")).toBeVisible();
});
