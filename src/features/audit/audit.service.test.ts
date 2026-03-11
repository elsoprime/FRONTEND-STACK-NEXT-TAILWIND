import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { listTenantAuditLogs } from "@/features/audit/audit.service";
import { server } from "@/mocks/server";

const AUDIT_PATH = "*/api/v1/audit";
const TENANT_ID = "507f191e810c19729de860ea";

describe("audit.service", () => {
  it("lists tenant audit logs with tenant header and filters", async () => {
    let capturedUrl = "";

    server.use(
      http.get(AUDIT_PATH, ({ request }) => {
        capturedUrl = request.url;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                id: "audit_01",
                scope: "tenant",
                traceId: "trace-audit-item-01",
                actor: {
                  kind: "user",
                  userId: "507f191e810c19729de860ff",
                  scope: ["tenant"],
                },
                tenant: {
                  tenantId: TENANT_ID,
                  isOwner: true,
                },
                action: "tenant.settings.update",
                resource: {
                  type: "tenant_settings",
                  id: "cfg_01",
                },
                severity: "info",
                changes: {
                  fields: ["branding.displayName"],
                },
                createdAt: "2026-03-10T18:00:00.000Z",
              },
            ],
          },
          pagination: {
            page: 2,
            limit: 10,
            total: 25,
            totalPages: 3,
          },
          traceId: "trace-audit-list-ok",
        });
      }),
    );

    const result = await listTenantAuditLogs(TENANT_ID, {
      page: 2,
      limit: 10,
      severity: "info",
      actorKind: "user",
      action: "tenant.settings.update",
      resourceType: "tenant_settings",
      from: "2026-03-01T00:00:00.000Z",
      to: "2026-03-31T23:59:59.000Z",
    });

    expect(capturedUrl.length).toBeGreaterThan(0);
    const parsedUrl = new URL(capturedUrl);

    expect(parsedUrl.searchParams.get("page")).toBe("2");
    expect(parsedUrl.searchParams.get("limit")).toBe("10");
    expect(parsedUrl.searchParams.get("severity")).toBe("info");
    expect(parsedUrl.searchParams.get("actorKind")).toBe("user");
    expect(parsedUrl.searchParams.get("action")).toBe("tenant.settings.update");
    expect(parsedUrl.searchParams.get("resourceType")).toBe("tenant_settings");
    expect(parsedUrl.searchParams.get("from")).toBe("2026-03-01T00:00:00.000Z");
    expect(parsedUrl.searchParams.get("to")).toBe("2026-03-31T23:59:59.000Z");

    expect(result.data.items).toHaveLength(1);
    expect(result.pagination.total).toBe(25);
    expect(result.traceId).toBe("trace-audit-list-ok");
  });
});
