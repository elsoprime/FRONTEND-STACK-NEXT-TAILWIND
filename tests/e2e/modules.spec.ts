import { expect, Page, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";

const DEFAULT_TENANT_ID = "507f191e810c19729de860ea";

function buildTenantSummary(id: string, name: string) {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    status: "active",
    ownerUserId: "usr_owner_01",
    planId: "plan:growth",
    activeModuleKeys: ["inventory", "crm", "hr"],
    memberLimit: null,
  };
}

const DEFAULT_RUNTIME_RESPONSE = {
  success: true,
  data: {
    settings: {
      tenantId: DEFAULT_TENANT_ID,
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
        activeModuleKeys: ["inventory", "crm", "hr"],
        enabledModuleKeys: ["inventory", "crm", "hr"],
        featureFlagKeys: ["inventory:analytics", "crm:base"],
      },
    },
  },
  traceId: "trace-tenant-settings-effective",
};

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

function attachAuthAndTenantMocks(page: Page) {
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
        traceId: "trace-e2e-refresh",
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
              tenant: buildTenantSummary(DEFAULT_TENANT_ID, "Acme"),
              membership: {
                id: "mem_01",
                tenantId: DEFAULT_TENANT_ID,
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-tenant-mine",
      }),
    });
  });

  page.route("**/api/v1/tenant/settings/effective", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DEFAULT_RUNTIME_RESPONSE),
    });
  });
}

test("inventory items page renders list", async ({ page }) => {
  attachAuthAndTenantMocks(page);

  page.route("**/api/v1/modules/inventory/categories**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "cat_01",
              tenantId: DEFAULT_TENANT_ID,
              name: "Hardware",
              description: "Stock fisico",
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        traceId: "trace-inventory-categories",
      }),
    });
  });

  page.route("**/api/v1/modules/inventory/items**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "item_01",
              tenantId: DEFAULT_TENANT_ID,
              categoryId: "cat_01",
              sku: "SKU-001",
              name: "Laptop",
              description: "Equipo",
              currentStock: 12,
              minStock: 3,
              isLowStock: false,
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        traceId: "trace-inventory-items",
      }),
    });
  });

  await page.goto("/app/inventory/items");

  await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
  await expect(page.getByText("Laptop")).toBeVisible();
  await expect(page.getByText("SKU: SKU-001")).toBeVisible();

  const sidebar = page.getByLabel("Sidebar tenant");
  const panelPrincipalLink = sidebar.getByRole("link", { name: "Panel principal" }).first();
  const itemsLink = sidebar.getByRole("link", { name: "Items" }).first();

  await expect(panelPrincipalLink).not.toHaveClass(/text-sidebar-primary/);
  await expect(itemsLink).toHaveClass(/text-sidebar-primary/);
});

test("inventory warehouses page renders list", async ({ page }) => {
  attachAuthAndTenantMocks(page);

  page.route("**/api/v1/modules/inventory/warehouses**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860ed",
              tenantId: DEFAULT_TENANT_ID,
              name: "Bodega Central",
              description: "Principal",
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        traceId: "trace-inventory-warehouses",
      }),
    });
  });

  await page.goto("/app/inventory/warehouses");

  await expect(page.getByRole("heading", { name: "Bodegas" })).toBeVisible();
  await expect(page.getByText("Bodega Central")).toBeVisible();

  const sidebar = page.getByLabel("Sidebar tenant");
  const panelPrincipalLink = sidebar.getByRole("link", { name: "Panel principal" }).first();
  const warehousesLink = sidebar.getByRole("link", { name: "Bodegas" }).first();

  await expect(panelPrincipalLink).not.toHaveClass(/text-sidebar-primary/);
  await expect(warehousesLink).toHaveClass(/text-sidebar-primary/);
});

test("inventory lots page renders list", async ({ page }) => {
  attachAuthAndTenantMocks(page);

  page.route("**/api/v1/modules/inventory/items**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860ec",
              tenantId: DEFAULT_TENANT_ID,
              categoryId: "507f191e810c19729de860eb",
              sku: "SKU-001",
              name: "Laptop",
              description: "Equipo",
              currentStock: 12,
              minStock: 3,
              isLowStock: false,
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        traceId: "trace-inventory-items-lots",
      }),
    });
  });

  page.route("**/api/v1/modules/inventory/warehouses**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860ed",
              tenantId: DEFAULT_TENANT_ID,
              name: "Bodega Central",
              description: "Principal",
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        traceId: "trace-inventory-warehouses-lots",
      }),
    });
  });

  page.route("**/api/v1/modules/inventory/lots**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860ee",
              tenantId: DEFAULT_TENANT_ID,
              itemId: "507f191e810c19729de860ec",
              warehouseId: "507f191e810c19729de860ed",
              lotCode: "LOT-2026-001",
              receivedAt: "2026-03-17T00:00:00.000Z",
              expiresAt: "2026-06-17T00:00:00.000Z",
              initialQuantity: 20,
              currentQuantity: 18,
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        traceId: "trace-inventory-lots",
      }),
    });
  });

  await page.goto("/app/inventory/lots");

  await expect(page.getByRole("heading", { name: "Lotes" })).toBeVisible();
  await expect(page.getByText("LOT-2026-001")).toBeVisible();

  const sidebar = page.getByLabel("Sidebar tenant");
  const panelPrincipalLink = sidebar.getByRole("link", { name: "Panel principal" }).first();
  const lotsLink = sidebar.getByRole("link", { name: "Lotes" }).first();

  await expect(panelPrincipalLink).not.toHaveClass(/text-sidebar-primary/);
  await expect(lotsLink).toHaveClass(/text-sidebar-primary/);
});
test("inventory stocktakes page renders list", async ({ page }) => {
  attachAuthAndTenantMocks(page);

  page.route("**/api/v1/modules/inventory/warehouses**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860ed",
              tenantId: DEFAULT_TENANT_ID,
              name: "Bodega Central",
              description: "Principal",
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        traceId: "trace-inventory-warehouses-stocktakes",
      }),
    });
  });

  page.route("**/api/v1/modules/inventory/stocktakes**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860ef",
              tenantId: DEFAULT_TENANT_ID,
              warehouseId: "507f191e810c19729de860ed",
              name: "Conteo mensual",
              status: "draft",
              lines: [],
              createdAt: "2026-03-17T00:00:00.000Z",
              updatedAt: "2026-03-17T00:00:00.000Z",
            },
          ],
        },
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        traceId: "trace-inventory-stocktakes",
      }),
    });
  });

  await page.goto("/app/inventory/stocktakes");

  await expect(page.getByRole("heading", { name: "Conteos (Stocktakes)" })).toBeVisible();
  await expect(page.getByText("Conteo mensual")).toBeVisible();

  const sidebar = page.getByLabel("Sidebar tenant");
  const panelPrincipalLink = sidebar.getByRole("link", { name: "Panel principal" }).first();
  const stocktakesLink = sidebar.getByRole("link", { name: "Conteos" }).first();

  await expect(panelPrincipalLink).not.toHaveClass(/text-sidebar-primary/);
  await expect(stocktakesLink).toHaveClass(/text-sidebar-primary/);
});
test("inventory stock page renders movement list", async ({ page }) => {
  attachAuthAndTenantMocks(page);

  page.route("**/api/v1/modules/inventory/items**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860ec",
              tenantId: DEFAULT_TENANT_ID,
              categoryId: "507f191e810c19729de860eb",
              sku: "SKU-001",
              name: "Laptop",
              description: "Equipo",
              currentStock: 12,
              minStock: 3,
              isLowStock: false,
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        traceId: "trace-inventory-items-stock",
      }),
    });
  });

  page.route("**/api/v1/modules/inventory/stock-movements**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "507f191e810c19729de860fd",
              tenantId: DEFAULT_TENANT_ID,
              itemId: "507f191e810c19729de860ec",
              direction: "out",
              quantity: 2,
              stockBefore: 12,
              stockAfter: 10,
              reason: "Venta",
              performedByUserId: "507f191e810c19729de860ff",
              createdAt: "2026-03-16T23:32:13.765Z",
            },
          ],
        },
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        traceId: "trace-inventory-stock",
      }),
    });
  });

  await page.goto("/app/inventory/stock");

  await expect(page.getByRole("heading", { name: "Movimientos de stock" })).toBeVisible();
  await expect(page.getByText("Salida - 2")).toBeVisible();
  await expect(page.getByText("Venta", { exact: true })).toBeVisible();
});

test("inventory reconciliation page renders report", async ({ page }) => {
  attachAuthAndTenantMocks(page);

  page.route("**/api/v1/modules/inventory/reconciliation**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          report: {
            tenantId: DEFAULT_TENANT_ID,
            comparedAt: "2026-03-17T01:00:00.000Z",
            movementCount: 12,
            movementIn: 8,
            movementOut: 4,
            balanceTotal: 120,
            itemStockTotal: 120,
            drift: 0,
            status: "ok",
          },
        },
        traceId: "trace-inventory-reconciliation",
      }),
    });
  });

  await page.goto("/app/inventory/reconciliation");

  await expect(page.getByRole("heading", { name: "Reconciliacion" })).toBeVisible();
  await expect(page.getByText("ok")).toBeVisible();
});

test("inventory settings page renders config", async ({ page }) => {
  attachAuthAndTenantMocks(page);

  page.route("**/api/v1/modules/inventory/settings**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            settings: {
              tenantId: DEFAULT_TENANT_ID,
              lotAllocationPolicy: "FIFO",
              rolloutPhase: "general",
              capabilities: {
                warehouses: true,
                lots: true,
                stocktakes: true,
              },
            },
          },
          traceId: "trace-inventory-settings-get",
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
            tenantId: DEFAULT_TENANT_ID,
            lotAllocationPolicy: "FEFO",
            rolloutPhase: "general",
            capabilities: {
              warehouses: true,
              lots: true,
              stocktakes: true,
            },
          },
        },
        traceId: "trace-inventory-settings-update",
      }),
    });
  });

  await page.goto("/app/inventory/settings");

  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("FIFO", { exact: true })).toBeVisible();
});
test("crm contacts page renders list", async ({ page }) => {
  attachAuthAndTenantMocks(page);

  page.route("**/api/v1/modules/crm/contacts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "contact_01",
              tenantId: DEFAULT_TENANT_ID,
              firstName: "Rafael",
              lastName: "Acme",
              email: "rafael@acme.dev",
              phone: null,
              organizationId: "org_01",
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        traceId: "trace-crm-contacts",
      }),
    });
  });

  page.route("**/api/v1/modules/crm/organizations**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "org_01",
              tenantId: DEFAULT_TENANT_ID,
              name: "Acme",
              domain: "acme.dev",
              industry: "SaaS",
              isActive: true,
            },
          ],
        },
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        traceId: "trace-crm-orgs",
      }),
    });
  });

  await page.goto("/app/crm/contacts");

  await expect(page.getByRole("heading", { name: "Contactos" })).toBeVisible();
  await expect(page.getByText("Rafael Acme")).toBeVisible();
  await expect(page.getByText("rafael@acme.dev")).toBeVisible();
});

test("hr employees page renders list", async ({ page }) => {
  attachAuthAndTenantMocks(page);

  page.route("**/api/v1/modules/hr/employees**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "emp_01",
              tenantId: DEFAULT_TENANT_ID,
              employeeCode: "EMP-01",
              firstName: "Valeria",
              lastName: "Acme",
              workEmail: "valeria@acme.dev",
              personalEmail: null,
              phone: null,
              department: "Operations",
              jobTitle: "Analyst",
              employmentType: "full_time",
              status: "active",
              startDate: "2026-01-01T00:00:00-03:00",
              endDate: null,
              birthDate: null,
              managerId: null,
              isActive: true,
              deletedAt: null,
            },
          ],
        },
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        traceId: "trace-hr-employees",
      }),
    });
  });

  await page.goto("/app/hr/employees");

  await expect(page.getByRole("heading", { name: "Empleados" })).toBeVisible();
  const employeeRow = page
    .locator("div")
    .filter({ hasText: "Valeria Acme" })
    .filter({ has: page.getByRole("link", { name: "Ver detalle" }) })
    .first();
  await expect(employeeRow).toBeVisible();
  await expect(page.getByText("EMP-01")).toBeVisible();
});
