import { expect, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";

const TENANT_ID = "507f191e810c19729de860ea";

const PLANS = [
  {
    key: "plan:starter",
    name: "Starter",
    description: "Starter plan",
    rank: 1,
    allowedModuleKeys: ["inventory"],
    featureFlagKeys: [],
    memberLimit: 10,
  },
  {
    key: "plan:growth",
    name: "Growth",
    description: "Growth plan",
    rank: 2,
    allowedModuleKeys: ["inventory", "crm", "hr"],
    featureFlagKeys: ["crm:base", "hr:base"],
    memberLimit: 50,
  },
];

function modulesForPlan(planId: string | null): string[] {
  if (planId === "plan:growth") {
    return ["inventory", "crm", "hr"];
  }

  if (planId === "plan:starter") {
    return ["inventory"];
  }

  return [];
}

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

test("billing cycle: activate -> cancel -> require new checkout -> reactivate", async ({
  page,
}) => {
  let runtimePlanId: string | null = "plan:starter";
  let checkoutSeq = 0;
  let latestCheckoutSessionId: string | null = null;
  let latestCheckoutPlanId: string | null = null;

  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
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
        traceId: "trace-refresh-ok",
      }),
    });
  });

  await page.route("**/api/v1/tenant/mine", async (route) => {
    const activeModuleKeys = modulesForPlan(runtimePlanId);

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
                planId: runtimePlanId,
                activeModuleKeys,
                memberLimit: 50,
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
        traceId: "trace-tenant-mine",
      }),
    });
  });

  await page.route("**/api/v1/tenant/settings/effective", async (route) => {
    const activeModuleKeys = modulesForPlan(runtimePlanId);

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
              legalName: "Acme Corp",
              taxId: "123456789",
            },
            runtime: {
              planId: runtimePlanId,
              activeModuleKeys,
              enabledModuleKeys: activeModuleKeys,
              featureFlagKeys: activeModuleKeys,
            },
          },
        },
        traceId: "trace-runtime-effective",
      }),
    });
  });

  await page.route("**/api/v1/billing/plans", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { items: PLANS },
        traceId: "trace-billing-plans",
      }),
    });
  });

  await page.route("**/api/v1/billing/checkout/session", async (route) => {
    const payload = route.request().postDataJSON() as { planId: string; provider: string };
    checkoutSeq += 1;
    latestCheckoutSessionId =
      checkoutSeq === 1 ? "507f191e810c19729de860aa" : "507f191e810c19729de860ab";
    latestCheckoutPlanId = payload.planId;

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          checkoutSession: {
            id: latestCheckoutSessionId,
            tenantId: TENANT_ID,
            planId: payload.planId,
            provider: "simulated",
            providerSessionId: `provider_${checkoutSeq}`,
            status: "pending",
            checkoutUrl: `http://localhost:3000/app/settings/billing?session=provider_${checkoutSeq}`,
            createdAt: "2026-03-13T00:00:00.000Z",
            expiresAt: "2026-03-13T01:00:00.000Z",
            activatedAt: null,
          },
        },
        traceId: "trace-checkout",
      }),
    });
  });

  await page.route("**/api/dev/billing/simulate-paid", async (route) => {
    runtimePlanId = latestCheckoutPlanId;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          traceId: "trace-simulated-paid",
          upstreamStatus: 200,
          upstreamBody: {
            success: true,
            traceId: "trace-webhook-paid",
          },
        },
      }),
    });
  });
  await page.route("**/api/v1/tenant/subscription", async (route) => {
    if (route.request().method() === "DELETE") {
      runtimePlanId = null;
      latestCheckoutSessionId = null;
      latestCheckoutPlanId = null;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            tenant: {
              id: TENANT_ID,
              name: "Acme",
              slug: "acme",
              status: "active",
              ownerUserId: "usr_owner_01",
              planId: null,
              activeModuleKeys: [],
              memberLimit: 50,
            },
            subscription: {
              planId: null,
              activeModuleKeys: [],
              status: "canceled",
            },
          },
          traceId: "trace-subscription-cancel",
        }),
      });

      return;
    }

    const payload = route.request().postDataJSON() as { planId: string; checkoutSessionId: string };

    if (
      payload.checkoutSessionId !== latestCheckoutSessionId ||
      payload.planId !== latestCheckoutPlanId
    ) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "GEN_VALIDATION_ERROR",
            message: "Checkout session invalida",
          },
          traceId: "trace-subscription-invalid",
        }),
      });
      return;
    }

    runtimePlanId = payload.planId;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tenant: {
            id: TENANT_ID,
            name: "Acme",
            slug: "acme",
            status: "active",
            ownerUserId: "usr_owner_01",
            planId: runtimePlanId,
            activeModuleKeys: modulesForPlan(runtimePlanId),
            memberLimit: 50,
          },
          subscription: {
            planId: runtimePlanId,
            activeModuleKeys: modulesForPlan(runtimePlanId),
            status: "activated",
          },
        },
        traceId: "trace-subscription-activate",
      }),
    });
  });

  await page.goto("/app/settings/billing");

  const activateButton = page.getByRole("button", { name: "Confirmar pago y activar plan" });
  const checkoutButton = page.getByRole("button", { name: "Iniciar checkout" });
  const cancelButton = page.getByRole("button", { name: "Cancelar suscripcion" });

  await expect(checkoutButton).toBeVisible();
  await cancelButton.click();
  await expect(
    page.getByRole("heading", { name: "Confirmar cancelacion de suscripcion" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Si, cancelar suscripcion" }).click();
  await expect(
    page.getByText("Suscripcion cancelada. El runtime efectivo se actualizo para este tenant."),
  ).toBeVisible();
  await expect(activateButton).toBeDisabled();

  await checkoutButton.click();
  await expect(
    page.getByText(
      "Checkout creado. Completa el pago en la URL, luego confirma la activacion del plan.",
    ),
  ).toBeVisible();
  await expect(activateButton).toBeEnabled();

  await activateButton.click();
  await expect(page.getByRole("heading", { name: "Confirmar pago simulado" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar y activar" }).click();
  await expect(page.getByText(/Pago confirmado y plan Starter activo en runtime\./)).toBeVisible();

  await cancelButton.click();
  await expect(
    page.getByRole("heading", { name: "Confirmar cancelacion de suscripcion" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Si, cancelar suscripcion" }).click();
  await expect(activateButton).toBeDisabled();

  await checkoutButton.click();
  await expect(activateButton).toBeEnabled();
  await activateButton.click();
  await expect(page.getByRole("heading", { name: "Confirmar pago simulado" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar y activar" }).click();
  await expect(page.getByText(/Pago confirmado y plan Starter activo en runtime\./)).toBeVisible();
});

test("dashboard blocks module actions when subscription is not active", async ({ page }) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
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
        traceId: "trace-refresh-ok",
      }),
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
              tenant: {
                id: TENANT_ID,
                name: "Acme",
                slug: "acme",
                status: "active",
                ownerUserId: "usr_owner_01",
                planId: null,
                activeModuleKeys: [],
                memberLimit: 50,
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
        traceId: "trace-tenant-mine",
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
              legalName: "Acme Corp",
              taxId: "123456789",
            },
            runtime: {
              planId: null,
              activeModuleKeys: [],
              enabledModuleKeys: [],
              featureFlagKeys: [],
            },
          },
        },
        traceId: "trace-runtime-effective",
      }),
    });
  });

  await page.route("**/api/v1/billing/plans", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { items: PLANS },
        traceId: "trace-billing-plans",
      }),
    });
  });

  await page.route("**/api/v1/audit**", async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "TENANT_SUBSCRIPTION_PAYMENT_REQUIRED",
          message: "Subscription payment required",
        },
        traceId: "trace-audit-blocked",
      }),
    });
  });

  await page.goto("/app");

  await expect(page.getByRole("button", { name: "Alertas de stock" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Eventos de auditoria" })).toBeDisabled();
});

test("effective settings shows billing CTA when subscription payment is required", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
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
        traceId: "trace-refresh-ok",
      }),
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
              tenant: {
                id: TENANT_ID,
                name: "Acme",
                slug: "acme",
                status: "active",
                ownerUserId: "usr_owner_01",
                planId: null,
                activeModuleKeys: [],
                memberLimit: 50,
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
        traceId: "trace-tenant-mine",
      }),
    });
  });

  await page.route("**/api/v1/tenant/settings/effective", async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "TENANT_SUBSCRIPTION_PAYMENT_REQUIRED",
          message: "Subscription payment required",
        },
        traceId: "trace-effective-payment-required",
      }),
    });
  });

  await page.goto("/app/settings/tenant/effective");

  await expect(page.getByText("Suscripcion con pago pendiente")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir a Billing" })).toHaveAttribute(
    "href",
    "/app/settings/billing",
  );
});

test("billing page disables cancel action when subscription is pending", async ({ page }) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
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
        traceId: "trace-refresh-ok",
      }),
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
              tenant: {
                id: TENANT_ID,
                name: "Acme",
                slug: "acme",
                status: "active",
                ownerUserId: "usr_owner_01",
                planId: "plan:starter",
                activeModuleKeys: ["inventory"],
                memberLimit: 50,
                subscriptionStatus: "pending",
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
        traceId: "trace-tenant-mine",
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
          settings: {
            tenantId: TENANT_ID,
            branding: { displayName: "Acme", supportEmail: null, supportUrl: null },
            localization: { defaultTimezone: "UTC", defaultCurrency: "USD", defaultLanguage: "es" },
            contact: { primaryEmail: null, phone: null, websiteUrl: null },
            billing: { billingEmail: null, legalName: null, taxId: null },
            runtime: {
              planId: "plan:starter",
              activeModuleKeys: ["inventory"],
              enabledModuleKeys: ["inventory"],
              featureFlagKeys: ["inventory:base"],
            },
          },
        },
        traceId: "trace-runtime",
      }),
    });
  });

  await page.route("**/api/v1/billing/plans", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { items: PLANS },
        traceId: "trace-billing-plans",
      }),
    });
  });

  await page.goto("/app/settings/billing");

  const cancelButton = page.getByRole("button", { name: "Cancelar suscripcion" });
  await expect(cancelButton).toBeDisabled();
  await expect(
    page.getByText("No disponible mientras la suscripcion este pendiente o desactivada."),
  ).toBeVisible();
});

test("billing page blocks checkout/verify when selected plan is already active and shows canonical plans", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
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
        traceId: "trace-refresh-ok",
      }),
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
              tenant: {
                id: TENANT_ID,
                name: "Acme",
                slug: "acme",
                status: "active",
                ownerUserId: "usr_owner_01",
                planId: "plan:starter",
                activeModuleKeys: ["inventory"],
                memberLimit: 50,
                subscriptionStatus: "active",
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
        traceId: "trace-tenant-mine",
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
          settings: {
            tenantId: TENANT_ID,
            branding: { displayName: "Acme", supportEmail: null, supportUrl: null },
            localization: { defaultTimezone: "UTC", defaultCurrency: "USD", defaultLanguage: "es" },
            contact: { primaryEmail: null, phone: null, websiteUrl: null },
            billing: { billingEmail: null, legalName: null, taxId: null },
            runtime: {
              planId: "plan:starter",
              activeModuleKeys: ["inventory"],
              enabledModuleKeys: ["inventory"],
              featureFlagKeys: ["inventory:base"],
            },
          },
        },
        traceId: "trace-runtime",
      }),
    });
  });

  await page.route("**/api/v1/billing/plans", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              key: "plan:starter",
              name: "Starter",
              description: "Starter plan",
              rank: 1,
              allowedModuleKeys: ["inventory"],
              featureFlagKeys: [],
              memberLimit: 10,
            },
            {
              key: "plan:growth",
              name: "Growth",
              description: "Growth plan",
              rank: 2,
              allowedModuleKeys: ["inventory", "crm", "hr"],
              featureFlagKeys: ["crm:base", "hr:base"],
              memberLimit: 50,
            },
          ],
        },
        traceId: "trace-billing-plans",
      }),
    });
  });

  await page.goto("/app/settings/billing");

  await expect(page.getByRole("button", { name: "Iniciar checkout" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Verificar activacion" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Enterprise" })).toBeVisible();
  await expect(page.getByText("No disponible").first()).toBeVisible();
});
