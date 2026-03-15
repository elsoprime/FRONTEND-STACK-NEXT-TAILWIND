import { expect, Page, test } from "@playwright/test";
import { attachTenantDashboardMocks } from "./helpers/dashboard-mocks";

const DEFAULT_TENANT_ID = "507f191e810c19729de860ea";
const DEFAULT_TENANT_NAME = "Acme";

const DEFAULT_MEMBERSHIP = {
  id: "mem_01",
  tenantId: DEFAULT_TENANT_ID,
  userId: "usr_owner_01",
  roleKey: "tenant:owner",
  status: "active",
};

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

test("audit module loads with counts", async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);

  attachAuthAndTenantMocks(page);
  attachTenantDashboardMocks(page);

  await page.goto("/app/audit");

  await expect(page.getByRole("heading", { name: "Auditoria tenant" })).toBeVisible();
  await expect(page.getByText("Eventos registrados")).toBeVisible();
  await expect(page.getByText("Filtros", { exact: true })).toBeVisible();
  await expect(page.getByText(/trace-audit-recent-0/)).toBeVisible();
});

test("audit module quick action navega desde el hero del dashboard", async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);

  attachAuthAndTenantMocks(page);
  attachTenantDashboardMocks(page);

  await page.goto("/app");
  await page.getByRole("button", { name: "Eventos de auditoria" }).click();

  await expect(page).toHaveURL(/\/app\/audit$/);
  await expect(page.getByRole("heading", { name: "Auditoria tenant" })).toBeVisible();
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
        traceId: "trace-e2e-refresh-landing",
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
              tenant: buildTenantSummary(DEFAULT_TENANT_ID, DEFAULT_TENANT_NAME),
              membership: DEFAULT_MEMBERSHIP,
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-tenant-mine",
      }),
    });
  });
}




async function setCsrfCookie(page: Page, baseURL?: string) {
  const origin = (baseURL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  const primaryName = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token";
  const cookieNames = Array.from(new Set([primaryName, "csrf_token", "__csrf"]));
  await page.context().addCookies(
    cookieNames.map((name) => ({ name, value: "csrf-e2e", url: origin })),
  );
  await page.addInitScript((names) => {
    for (const name of names) {
      document.cookie = `${name}=csrf-e2e; path=/`;
    }
  }, cookieNames);
}


