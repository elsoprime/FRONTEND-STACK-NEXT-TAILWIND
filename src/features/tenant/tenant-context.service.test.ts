import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  bootstrapTenantShell,
  resolveTenantEntryRoute,
} from "@/features/tenant/tenant-context.service";
import { server } from "@/mocks/server";

const TENANT_MINE_PATH = "*/api/v1/tenant/mine";
const TENANT_SWITCH_PATH = "*/api/v1/tenant/switch";

function buildTenantSummary(id: string, name: string) {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    status: "active",
    ownerUserId: "usr_01",
    planId: "plan:starter",
    activeModuleKeys: [],
    memberLimit: null,
  };
}

describe("tenant-context.service", () => {
  it("resolveTenantEntryRoute sends users without tenants to onboarding", () => {
    expect(resolveTenantEntryRoute(0)).toBe("/app/tenants/create");
  });

  it("resolveTenantEntryRoute sends users with one tenant to app shell", () => {
    expect(resolveTenantEntryRoute(1)).toBe("/app");
  });

  it("resolveTenantEntryRoute sends users with multiple tenants to selector", () => {
    expect(resolveTenantEntryRoute(2)).toBe("/app/tenants/select");
  });

  it("returns no_tenants when tenant/mine is empty", async () => {
    server.use(
      http.get(TENANT_MINE_PATH, () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [],
          },
          traceId: "trace-tenant-empty",
        }),
      ),
    );

    const result = await bootstrapTenantShell();

    expect(result).toEqual({
      status: "no_tenants",
      items: [],
      traceId: "trace-tenant-empty",
    });
  });

  it("auto-switches when exactly one tenant exists and none is active", async () => {
    let switchPayload: { tenantId?: string } | null = null;

    server.use(
      http.get(TENANT_MINE_PATH, () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                tenant: buildTenantSummary("507f191e810c19729de860ea", "Acme"),
                membership: {
                  id: "mem_01",
                  tenantId: "507f191e810c19729de860ea",
                  userId: "usr_01",
                  roleKey: "tenant:owner",
                  status: "active",
                },
                isActive: false,
              },
            ],
          },
          traceId: "trace-tenant-one",
        }),
      ),
      http.post(TENANT_SWITCH_PATH, async ({ request }) => {
        switchPayload = (await request.json()) as { tenantId?: string };

        return HttpResponse.json({
          success: true,
          data: {
            tenant: buildTenantSummary("507f191e810c19729de860ea", "Acme"),
            membership: {
              id: "mem_01",
              tenantId: "507f191e810c19729de860ea",
              userId: "usr_01",
              roleKey: "tenant:owner",
              status: "active",
            },
          },
          traceId: "trace-tenant-switch",
        });
      }),
    );

    const result = await bootstrapTenantShell();

    expect(switchPayload).toEqual({
      tenantId: "507f191e810c19729de860ea",
    });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("Expected ready tenant bootstrap result");
    }
    expect(result.traceId).toBe("trace-tenant-switch");
    expect(result.switched).toBe(true);
  });

  it("returns selection_required when multiple tenants exist and none is active", async () => {
    server.use(
      http.get(TENANT_MINE_PATH, () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                tenant: buildTenantSummary("507f191e810c19729de860ea", "Acme"),
                membership: {
                  id: "mem_01",
                  tenantId: "507f191e810c19729de860ea",
                  userId: "usr_01",
                  roleKey: "tenant:owner",
                  status: "active",
                },
                isActive: false,
              },
              {
                tenant: buildTenantSummary("507f191e810c19729de860eb", "Globex"),
                membership: {
                  id: "mem_02",
                  tenantId: "507f191e810c19729de860eb",
                  userId: "usr_01",
                  roleKey: "tenant:member",
                  status: "active",
                },
                isActive: false,
              },
            ],
          },
          traceId: "trace-tenant-multi",
        }),
      ),
    );

    const result = await bootstrapTenantShell();

    expect(result.status).toBe("selection_required");
    expect(result.items).toHaveLength(2);
    expect(result.traceId).toBe("trace-tenant-multi");
  });
});
