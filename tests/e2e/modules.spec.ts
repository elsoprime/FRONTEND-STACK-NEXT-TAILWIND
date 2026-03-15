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

