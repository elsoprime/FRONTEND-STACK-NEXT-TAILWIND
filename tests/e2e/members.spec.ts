import { expect, test } from "@playwright/test";
import { attachTenantDashboardMocks } from "./helpers/dashboard-mocks";
import { setCsrfCookie } from "./helpers/csrf";

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

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
    traceId: "trace-e2e-refresh-members",
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
    activeModuleKeys: ["inventory", "crm"],
    memberLimit: 25,
  };
}

function buildTenantMembership(roleKey = "tenant:owner") {
  return {
    id: "mem_01",
    tenantId: "507f191e810c19729de860ea",
    userId: "usr_owner_01",
    roleKey,
    status: "active",
  };
}

test("members workspace lista memberships y ejecuta update/delete", async ({ page }) => {
  let updatePayload: Record<string, unknown> | null = null;
  let deleteCount = 0;
  let memberRole = "tenant:member";
  let memberStatus = "active";
  const listRequests: string[] = [];

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
              membership: buildTenantMembership(),
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-members-tenant-active",
      }),
    });
  });

  await page.route("**/api/v1/tenant/memberships?*", async (route) => {
    const url = new URL(route.request().url());
    listRequests.push(url.search);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              membershipId: "membership_owner",
              userId: "usr_owner_01",
              fullName: "Owner Acme",
              email: "owner@acme.dev",
              roleKey: "tenant:owner",
              status: "active",
              joinedAt: "2026-03-10T06:08:18.767Z",
              createdAt: "2026-03-10T06:08:18.767Z",
              isEffectiveOwner: true,
            },
            {
              membershipId: "membership_member",
              userId: "usr_member_02",
              fullName: "Esteban Soto",
              email: "esteban.soto@dev.cl",
              roleKey: memberRole,
              status: memberStatus,
              joinedAt: "2026-03-11T08:30:00.000Z",
              createdAt: "2026-03-11T08:30:00.000Z",
              isEffectiveOwner: false,
            },
          ],
          page: 1,
          limit: 5,
          total: 2,
          totalPages: 1,
        },
        traceId: "trace-e2e-members-list",
      }),
    });
  });

  await page.route("**/api/v1/tenant/memberships/membership_member", async (route) => {
    if (route.request().method() === "PATCH") {
      updatePayload = route.request().postDataJSON() as Record<string, unknown>;
      memberRole = "tenant:admin";
      memberStatus = "suspended";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            membership: {
              membershipId: "membership_member",
              userId: "usr_member_02",
              fullName: "Esteban Soto",
              email: "esteban.soto@dev.cl",
              roleKey: memberRole,
              status: memberStatus,
              joinedAt: "2026-03-11T08:30:00.000Z",
              createdAt: "2026-03-11T08:30:00.000Z",
              isEffectiveOwner: false,
            },
          },
          traceId: "trace-e2e-members-update",
        }),
      });
      return;
    }

    if (route.request().method() === "DELETE") {
      deleteCount += 1;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            membership: {
              membershipId: "membership_member",
              userId: "usr_member_02",
              fullName: "Esteban Soto",
              email: "esteban.soto@dev.cl",
              roleKey: memberRole,
              status: memberStatus,
              joinedAt: "2026-03-11T08:30:00.000Z",
              createdAt: "2026-03-11T08:30:00.000Z",
              isEffectiveOwner: false,
            },
          },
          traceId: "trace-e2e-members-delete",
        }),
      });
      return;
    }

    await route.fallback();
  });

  attachTenantDashboardMocks(page);
  await page.goto("/app/members?tab=team");

  await expect(page.getByRole("heading", { level: 1, name: "Miembros y acceso" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Miembros de acceso del tenant" }),
  ).toBeVisible();
  await expect(page.locator("tbody tr").nth(1).getByText("Esteban Soto")).toBeVisible();

  await page.getByPlaceholder("Buscar por nombre o email").fill("Esteban");
  await page.locator("select").nth(0).selectOption("tenant:member");
  await page.locator("select").nth(1).selectOption("active");

  await expect.poll(() => listRequests.at(-1) ?? "").toContain("search=Esteban");
  await expect.poll(() => listRequests.at(-1) ?? "").toContain("roleKey=tenant%3Amember");
  await expect.poll(() => listRequests.at(-1) ?? "").toContain("status=active");

  await page.locator("tbody tr").nth(1).locator("select").nth(0).selectOption("tenant:admin");
  await page.locator("tbody tr").nth(1).locator("select").nth(1).selectOption("suspended");
  await page.locator("tbody tr").nth(1).getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByText("Membresia actualizada para Esteban Soto.")).toBeVisible();
  expect(updatePayload).toMatchObject({
    roleKey: "tenant:admin",
    status: "suspended",
  });

  await page.locator("tbody tr").nth(1).getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText("Membresia removida: Esteban Soto.")).toBeVisible();
  expect(deleteCount).toBe(1);

  await expect(page.locator("tbody tr").nth(0).getByText("Owner Acme")).toBeVisible();
  await expect(
    page.locator("tbody tr").nth(0).getByRole("button", { name: "Guardar" }),
  ).toBeDisabled();
  await expect(
    page.locator("tbody tr").nth(0).getByRole("button", { name: "Remover" }),
  ).toBeDisabled();
});
