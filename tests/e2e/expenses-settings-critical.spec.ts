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

test("manages categories and updates expense settings", async ({ page }) => {
  attachBaseExpensesAuthMocks(page);

  let categories: Array<{
    id: string;
    tenantId: string;
    key: string;
    name: string;
    requiresAttachment: boolean;
    isActive: boolean;
    monthlyLimit: number | null;
    createdAt: string;
    updatedAt: string;
  }> = [
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
  ];

  let settings = {
    tenantId: TENANT_ID,
    allowedCurrencies: ["USD"],
    maxAmountWithoutReview: 100,
    approvalMode: "single_step" as const,
    bulkMaxItemsPerOperation: 50,
    exportsEnabled: true,
    createdAt: "2026-03-21T10:00:00.000Z",
    updatedAt: "2026-03-21T10:00:00.000Z",
  };

  page.route("**/api/v1/modules/expenses/categories**", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { items: categories },
          pagination: { page: 1, limit: 50, total: categories.length, totalPages: 1 },
          traceId: "trace-expenses-categories",
        }),
      });
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    const nextId = `507f191e810c19729de86${(100 + categories.length).toString().padStart(3, "0")}`;
    categories = [
      ...categories,
      {
        id: nextId,
        tenantId: TENANT_ID,
        key: String(body.key),
        name: String(body.name),
        requiresAttachment: Boolean(body.requiresAttachment),
        isActive: true,
        monthlyLimit: body.monthlyLimit === null ? null : Number(body.monthlyLimit),
        createdAt: "2026-03-21T10:05:00.000Z",
        updatedAt: "2026-03-21T10:05:00.000Z",
      },
    ];

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { category: categories[categories.length - 1] },
        traceId: "trace-expenses-category-create",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/categories/*", async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.fallback();
      return;
    }

    const categoryId = route.request().url().split("/").pop() ?? "";
    const body = route.request().postDataJSON() as Record<string, unknown>;
    categories = categories.map((category) =>
      category.id === categoryId
        ? {
            ...category,
            name: body.name ? String(body.name) : category.name,
            isActive:
              typeof body.isActive === "boolean" ? body.isActive : category.isActive,
            updatedAt: "2026-03-21T10:06:00.000Z",
          }
        : category,
    );

    const updated = categories.find((category) => category.id === categoryId) ?? categories[0];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { category: updated },
        traceId: "trace-expenses-category-update",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/settings", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { settings },
          traceId: "trace-expenses-settings",
        }),
      });
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    settings = {
      ...settings,
      allowedCurrencies: (body.allowedCurrencies as string[]) ?? settings.allowedCurrencies,
      maxAmountWithoutReview:
        typeof body.maxAmountWithoutReview === "number"
          ? body.maxAmountWithoutReview
          : settings.maxAmountWithoutReview,
      approvalMode:
        (body.approvalMode as typeof settings.approvalMode | undefined) ?? settings.approvalMode,
      bulkMaxItemsPerOperation:
        typeof body.bulkMaxItemsPerOperation === "number"
          ? body.bulkMaxItemsPerOperation
          : settings.bulkMaxItemsPerOperation,
      exportsEnabled:
        typeof body.exportsEnabled === "boolean" ? body.exportsEnabled : settings.exportsEnabled,
      updatedAt: "2026-03-21T10:07:00.000Z",
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { settings },
        traceId: "trace-expenses-settings-update",
      }),
    });
  });

  await page.goto("/app/expenses?tab=settings");

  await expect(page.getByRole("heading", { name: "Categorias" })).toBeVisible();
  await page.getByRole("button", { name: "Nueva categoria" }).click();
  await page.getByTestId("expenses-category-key-input").fill("office");
  await page.getByTestId("expenses-category-name-input").fill("Office");
  await page.getByRole("button", { name: "Crear categoria", exact: true }).click();
  await expect(page.getByText("Categoria creada.")).toBeVisible();
  await expect(page.getByText("office", { exact: true })).toBeVisible();

  const row = page.locator("tr", { hasText: "office" }).first();
  await row.getByRole("button", { name: "Editar" }).click();
  await row.getByRole("textbox").fill("Office Updated");
  await row.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Categoria actualizada.")).toBeVisible();

  const csvPayload = [
    "key,name,requiresAttachment,monthlyLimit",
    "meals,Meals,si,100000",
    "transport,Transport,no,",
  ].join("\n");

  await page.getByRole("button", { name: "Importar CSV" }).click();
  await expect(page.getByRole("heading", { name: "Importar categorias desde CSV" })).toBeVisible();
  await page.getByTestId("expenses-categories-csv-input").setInputFiles({
    name: "expenses-categories.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csvPayload, "utf8"),
  });
  await page.getByRole("button", { name: "Ejecutar import" }).click();
  await expect(page.getByText("Importacion finalizada. Exitos: 2. Fallos: 0.")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(page.getByText("Importacion masiva finalizada. Procesadas: 2. Exitos: 2. Fallos: 0.")).toBeVisible();
  await expect(page.getByText("meals", { exact: true })).toBeVisible();
  await expect(page.getByText("transport", { exact: true })).toBeVisible();

  await page.getByLabel("Monedas permitidas (CSV)").fill("USD,CLP");
  await page.getByRole("button", { name: "Guardar settings" }).click();
  await expect(page.getByText("Configuracion actualizada.")).toBeVisible();
});