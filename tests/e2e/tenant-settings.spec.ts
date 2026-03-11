import { expect, test } from "@playwright/test";

function buildRefreshSuccess() {
  return {
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
        id: "sess_restore_01",
        userId: "usr_owner_01",
        expiresAt: "2026-12-31T23:59:59.000Z",
      },
    },
    traceId: "trace-e2e-refresh-restore-ok",
  };
}

function buildTenantSummary() {
  return {
    id: "507f191e810c19729de860ea",
    name: "Acme",
    slug: "acme",
    status: "active",
    ownerUserId: "usr_owner_01",
    planId: "plan:growth",
    activeModuleKeys: ["inventory"],
    memberLimit: 25,
  };
}

function buildTenantSettings(displayName = "Acme") {
  return {
    id: "cfg_01",
    tenantId: "507f191e810c19729de860ea",
    singletonKey: "tenant_settings",
    branding: {
      displayName,
      supportEmail: "support@acme.dev",
      supportUrl: "https://acme.dev/support",
    },
    localization: {
      defaultTimezone: "America/Santiago",
      defaultCurrency: "USD",
      defaultLanguage: "es",
    },
    contact: {
      primaryEmail: "hello@acme.dev",
      phone: "+56 9 1111 2222",
      websiteUrl: "https://acme.dev",
    },
    billing: {
      billingEmail: "billing@acme.dev",
      legalName: "Acme SPA",
      taxId: "76.123.456-7",
    },
  };
}

function buildTenantSettingsEffective(displayName = "Acme") {
  return {
    tenantId: "507f191e810c19729de860ea",
    branding: {
      displayName,
      supportEmail: "support@acme.dev",
      supportUrl: "https://acme.dev/support",
    },
    localization: {
      defaultTimezone: "America/Santiago",
      defaultCurrency: "USD",
      defaultLanguage: "es",
    },
    contact: {
      primaryEmail: "hello@acme.dev",
      phone: "+56 9 1111 2222",
      websiteUrl: "https://acme.dev",
    },
    billing: {
      billingEmail: "billing@acme.dev",
      legalName: "Acme SPA",
      taxId: "76.123.456-7",
    },
    runtime: {
      planId: "plan:growth",
      activeModuleKeys: ["inventory"],
      enabledModuleKeys: ["inventory", "crm", "hr"],
      featureFlagKeys: ["inventory:base", "crm:base", "hr:base"],
    },
  };
}

test("tenant settings page loads singleton data and saves changes", async ({ page }) => {
  let currentDisplayName = "Acme";
  let capturedPayload: Record<string, unknown> | null = null;

  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildRefreshSuccess()),
    });
  });

  await page.route("**/api/v1/tenant/mine", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              tenant: buildTenantSummary(),
              membership: {
                id: "mem_01",
                tenantId: "507f191e810c19729de860ea",
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-tenant-active",
      }),
    });
  });

  await page.route("**/api/v1/tenant/settings/effective", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          settings: buildTenantSettingsEffective(currentDisplayName),
        },
        traceId: "trace-e2e-settings-effective",
      }),
    });
  });

  await page.route("**/api/v1/tenant/settings", async (route) => {
    if (route.request().method() === "PATCH") {
      capturedPayload = route.request().postDataJSON() as Record<string, unknown>;
      currentDisplayName = "Acme Labs";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            settings: buildTenantSettings(currentDisplayName),
          },
          traceId: "trace-e2e-settings-update",
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
          settings: buildTenantSettings(currentDisplayName),
        },
        traceId: "trace-e2e-settings-read",
      }),
    });
  });

  await page.goto("/app/settings/tenant");

  await expect(
    page.getByRole("heading", { level: 1, name: "Configuracion del tenant" }),
  ).toBeVisible();
  await expect(page.getByLabel("Display Name")).toHaveValue("Acme");
  await expect(page.getByRole("heading", { level: 3, name: "Runtime efectivo" })).toBeVisible();
  await expect(page.getByText("plan:growth")).toBeVisible();

  await page.getByLabel("Display Name").fill("Acme Labs");
  await page.getByRole("button", { name: "Guardar tenant settings" }).click();

  await expect(page.getByText("Tenant settings actualizados correctamente.")).toBeVisible();
  await expect(page.getByLabel("Display Name")).toHaveValue("Acme Labs");
  expect(capturedPayload).toMatchObject({
    branding: {
      displayName: "Acme Labs",
    },
    localization: {
      defaultCurrency: "USD",
    },
  });
});

test("effective settings page renders runtime and resolved values", async ({ page }) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildRefreshSuccess()),
    });
  });

  await page.route("**/api/v1/tenant/mine", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              tenant: buildTenantSummary(),
              membership: {
                id: "mem_01",
                tenantId: "507f191e810c19729de860ea",
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-tenant-active",
      }),
    });
  });

  await page.route("**/api/v1/tenant/settings/effective", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          settings: buildTenantSettingsEffective(),
        },
        traceId: "trace-e2e-settings-effective",
      }),
    });
  });

  await page.goto("/app/settings/tenant/effective");

  await expect(
    page.getByRole("heading", { level: 1, name: "Vista efectiva del tenant" }),
  ).toBeVisible();
  await expect(page.getByText("Inventory Analytics")).toBeVisible();
  await expect(page.getByText("CRM Base")).toBeVisible();
  await expect(page.getByText("America/Santiago")).toBeVisible();
  await expect(page.getByText("Acme SPA")).toBeVisible();
});
