import { expect, Page, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";

const TENANT_ID = "507f191e810c19729de860ea";
const REQUEST_ID = "507f191e810c19729de860f1";

type ExpenseAttachmentFixture = {
  id: string;
  tenantId: string;
  expenseRequestId: string;
  storageProvider: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  uploadedByUserId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

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

test("approves request and uploads attachment from detail view", async ({ page }) => {
  attachBaseExpensesAuthMocks(page);

  let requestStatus: "submitted" | "approved" = "submitted";
  const attachments: ExpenseAttachmentFixture[] = [];

  page.route("**/api/v1/modules/expenses/queue**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: REQUEST_ID,
              tenantId: TENANT_ID,
              requestNumber: "EXP-001",
              requesterUserId: "usr_owner_01",
              title: "Taxi aeropuerto",
              description: "Traslado cliente",
              categoryKey: "transport",
              amount: 120,
              currency: "USD",
              expenseDate: "2026-03-21T10:00:00.000Z",
              status: requestStatus,
              submittedAt: "2026-03-21T10:10:00.000Z",
              approvedAt: requestStatus === "approved" ? "2026-03-21T10:20:00.000Z" : null,
              paidAt: null,
              canceledAt: null,
              rejectionReasonCode: null,
              paymentReference: null,
              metadata: {},
              createdAt: "2026-03-21T10:00:00.000Z",
              updatedAt: "2026-03-21T10:00:00.000Z",
            },
          ],
        },
        pagination: {
          page: 1,
          limit: 8,
          total: 1,
          totalPages: 1,
        },
        traceId: "trace-expenses-queue",
      }),
    });
  });

  page.route(`**/api/v1/modules/expenses/requests/${REQUEST_ID}`, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          request: {
            id: REQUEST_ID,
            tenantId: TENANT_ID,
            requestNumber: "EXP-001",
            requesterUserId: "usr_owner_01",
            title: "Taxi aeropuerto",
            description: "Traslado cliente",
            categoryKey: "transport",
            amount: 120,
            currency: "USD",
            expenseDate: "2026-03-21T10:00:00.000Z",
            status: requestStatus,
            submittedAt: "2026-03-21T10:10:00.000Z",
            approvedAt: requestStatus === "approved" ? "2026-03-21T10:20:00.000Z" : null,
            paidAt: null,
            canceledAt: null,
            rejectionReasonCode: null,
            paymentReference: null,
            metadata: {
              project: "ACME-TRAVEL",
            },
            createdAt: "2026-03-21T10:00:00.000Z",
            updatedAt: "2026-03-21T10:00:00.000Z",
          },
        },
        traceId: "trace-expenses-request-detail",
      }),
    });
  });

  page.route(`**/api/v1/modules/expenses/requests/${REQUEST_ID}/approve`, async (route) => {
    requestStatus = "approved";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          request: {
            id: REQUEST_ID,
            tenantId: TENANT_ID,
            requestNumber: "EXP-001",
            requesterUserId: "usr_owner_01",
            title: "Taxi aeropuerto",
            description: "Traslado cliente",
            categoryKey: "transport",
            amount: 120,
            currency: "USD",
            expenseDate: "2026-03-21T10:00:00.000Z",
            status: "approved",
            submittedAt: "2026-03-21T10:10:00.000Z",
            approvedAt: "2026-03-21T10:20:00.000Z",
            paidAt: null,
            canceledAt: null,
            rejectionReasonCode: null,
            paymentReference: null,
            metadata: {},
            createdAt: "2026-03-21T10:00:00.000Z",
            updatedAt: "2026-03-21T10:20:00.000Z",
          },
        },
        traceId: "trace-expenses-approve",
      }),
    });
  });

  page.route(`**/api/v1/modules/expenses/requests/${REQUEST_ID}/attachments`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            items: attachments,
          },
          traceId: "trace-expenses-attachments-list",
        }),
      });
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    const attachment: ExpenseAttachmentFixture = {
      id: "507f191e810c19729de860f2",
      tenantId: TENANT_ID,
      expenseRequestId: REQUEST_ID,
      storageProvider: String(body.storageProvider),
      objectKey: String(body.objectKey),
      originalFilename: String(body.originalFilename),
      mimeType: String(body.mimeType),
      sizeBytes: Number(body.sizeBytes),
      checksumSha256: String(body.checksumSha256),
      uploadedByUserId: "usr_owner_01",
      isActive: true,
      createdAt: "2026-03-21T10:21:00.000Z",
      updatedAt: "2026-03-21T10:21:00.000Z",
    };
    attachments.push(attachment);

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { attachment },
        traceId: "trace-expenses-attachment-create",
      }),
    });
  });

  page.route("**/api/v1/modules/expenses/uploads/presign", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          upload: {
            storageProvider: "s3",
            objectKey: "expenses/EXP-001/invoice.pdf",
            uploadUrl: "https://uploads.acme.dev/expenses/EXP-001/invoice.pdf",
            method: "PUT",
            requiredHeaders: {},
            expiresInSeconds: 600,
          },
        },
        traceId: "trace-expenses-presign",
      }),
    });
  });

  page.route("https://uploads.acme.dev/**", async (route) => {
    await route.fulfill({
      status: 200,
      body: "",
    });
  });

  await page.goto("/app/expenses");
  await expect(page.getByRole("heading", { name: "Solicitudes de gasto" })).toBeVisible();
  await page.getByRole("link", { name: "Abrir" }).first().click();

  await expect(page.getByRole("heading", { name: "Taxi aeropuerto" })).toBeVisible();
  await page.getByRole("button", { name: "Aprobar solicitud" }).click();
  await page.getByRole("button", { name: "Si, aprobar" }).click();
  await expect(
    page.getByText("Solicitud aprobada. Ahora la veras en la pestaña Pagos."),
  ).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "invoice.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("fake-pdf-content"),
  });

  await expect(page.getByText("Adjunto registrado")).toBeVisible();
  await expect(page.getByText("invoice.pdf").first()).toBeVisible();
});





