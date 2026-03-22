import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  acceptTenantInvitation,
  createTenant,
  createTenantInvitation,
  deleteTenantMembership,
  getMyTenantsNormalized,
  listTenantMemberships,
  revokeTenantInvitation,
  switchActiveTenant,
  transferTenantOwnership,
  updateTenantMembership,
} from "@/features/tenant/tenant.service";
import { server } from "@/mocks/server";

const TENANT_ID = "507f191e810c19729de860ea";
const INVITATION_ID = "507f191e810c19729de860eb";
const TARGET_USER_ID = "507f191e810c19729de860ec";
const MEMBERSHIP_ID = "507f191e810c19729de860ed";

describe("tenant.service", () => {
  it("creates tenant with trimmed payload", async () => {
    let requestBody: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/tenant", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(
          {
            success: true,
            data: {
              tenant: {
                id: TENANT_ID,
                name: "Acme Workspace",
                slug: "acme-workspace",
                status: "active",
                ownerUserId: "507f191e810c19729de860f1",
                planId: "plan:starter",
                activeModuleKeys: [],
                memberLimit: null,
              },
              membership: {
                id: "507f191e810c19729de860f2",
                tenantId: TENANT_ID,
                userId: "507f191e810c19729de860f1",
                roleKey: "tenant:owner",
                status: "active",
              },
            },
            traceId: "trace-tenant-create-ok",
          },
          { status: 201 },
        );
      }),
    );

    const response = await createTenant({
      name: "  Acme Workspace  ",
      slug: "acme-workspace",
    });

    expect(requestBody).toEqual({
      name: "Acme Workspace",
      slug: "acme-workspace",
    });
    expect(response.success).toBe(true);
    expect(response.traceId).toBe("trace-tenant-create-ok");
  });

  it("switches active tenant without tenant header", async () => {
    let requestBody: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/tenant/switch", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBeNull();

        return HttpResponse.json({
          success: true,
          data: {
            tenant: {
              id: TENANT_ID,
              name: "Acme Workspace",
              slug: "acme-workspace",
              status: "active",
              ownerUserId: "507f191e810c19729de860f1",
              planId: "plan:starter",
              activeModuleKeys: [],
              memberLimit: null,
            },
            membership: {
              id: "507f191e810c19729de860f2",
              tenantId: TENANT_ID,
              userId: "507f191e810c19729de860f1",
              roleKey: "tenant:owner",
              status: "active",
            },
          },
          traceId: "trace-tenant-switch-ok",
        });
      }),
    );

    const response = await switchActiveTenant({ tenantId: TENANT_ID });

    expect(requestBody).toEqual({ tenantId: TENANT_ID });
    expect(response.traceId).toBe("trace-tenant-switch-ok");
  });

  it("lists tenant memberships with tenant header and query params", async () => {
    server.use(
      http.get("*/api/v1/tenant/memberships", ({ request }) => {
        const url = new URL(request.url);
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);
        expect(url.searchParams.get("page")).toBe("2");
        expect(url.searchParams.get("limit")).toBe("5");
        expect(url.searchParams.get("search")).toBe("ana");
        expect(url.searchParams.get("roleKey")).toBe("tenant:admin");
        expect(url.searchParams.get("status")).toBe("active");

        return HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                membershipId: MEMBERSHIP_ID,
                userId: TARGET_USER_ID,
                fullName: "Ana Admin",
                email: "ana@acme.dev",
                roleKey: "tenant:admin",
                status: "active",
                joinedAt: "2026-03-20T10:00:00.000Z",
                createdAt: "2026-03-19T10:00:00.000Z",
                isEffectiveOwner: false,
              },
            ],
            page: 2,
            limit: 5,
            total: 6,
            totalPages: 2,
          },
          traceId: "trace-memberships-list-ok",
        });
      }),
    );

    const response = await listTenantMemberships(TENANT_ID, {
      page: 2,
      limit: 5,
      search: "ana",
      roleKey: "tenant:admin",
      status: "active",
    });

    expect(response.data.items[0]?.fullName).toBe("Ana Admin");
    expect(response.traceId).toBe("trace-memberships-list-ok");
  });

  it("updates tenant membership with tenant header", async () => {
    let requestBody: Record<string, unknown> | null = null;

    server.use(
      http.patch(`*/api/v1/tenant/memberships/${MEMBERSHIP_ID}`, async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            membership: {
              membershipId: MEMBERSHIP_ID,
              userId: TARGET_USER_ID,
              fullName: "Ana Admin",
              email: "ana@acme.dev",
              roleKey: "tenant:member",
              status: "suspended",
              joinedAt: "2026-03-20T10:00:00.000Z",
              createdAt: "2026-03-19T10:00:00.000Z",
              isEffectiveOwner: false,
            },
          },
          traceId: "trace-membership-update-ok",
        });
      }),
    );

    const response = await updateTenantMembership(TENANT_ID, MEMBERSHIP_ID, {
      roleKey: "tenant:member",
      status: "suspended",
    });

    expect(requestBody).toEqual({ roleKey: "tenant:member", status: "suspended" });
    expect(response.data.membership.status).toBe("suspended");
  });

  it("deletes tenant membership with tenant header", async () => {
    server.use(
      http.delete(`*/api/v1/tenant/memberships/${MEMBERSHIP_ID}`, ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            membership: {
              membershipId: MEMBERSHIP_ID,
              userId: TARGET_USER_ID,
              fullName: "Ana Admin",
              email: "ana@acme.dev",
              roleKey: "tenant:member",
              status: "suspended",
              joinedAt: "2026-03-20T10:00:00.000Z",
              createdAt: "2026-03-19T10:00:00.000Z",
              isEffectiveOwner: false,
            },
          },
          traceId: "trace-membership-delete-ok",
        });
      }),
    );

    const response = await deleteTenantMembership(TENANT_ID, MEMBERSHIP_ID);

    expect(response.data.membership.membershipId).toBe(MEMBERSHIP_ID);
    expect(response.traceId).toBe("trace-membership-delete-ok");
  });

  it("creates tenant invitation with tenant header", async () => {
    let requestBody: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/tenant/invitations", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json(
          {
            success: true,
            data: {
              invitation: {
                id: INVITATION_ID,
                tenantId: TENANT_ID,
                email: "member@acme.dev",
                roleKey: "tenant:member",
                status: "pending",
                expiresAt: "2026-12-31T23:59:59.000Z",
              },
            },
            traceId: "trace-invitation-create-ok",
          },
          { status: 201 },
        );
      }),
    );

    const response = await createTenantInvitation(TENANT_ID, {
      email: "member@acme.dev",
      roleKey: "tenant:member",
    });

    expect(requestBody).toEqual({
      email: "member@acme.dev",
      roleKey: "tenant:member",
    });
    expect(response.data.invitation.status).toBe("pending");
    expect(response.traceId).toBe("trace-invitation-create-ok");
  });

  it("accepts tenant invitation without tenant header", async () => {
    let requestBody: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/tenant/invitations/accept", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBeNull();

        return HttpResponse.json({
          success: true,
          data: {
            tenant: {
              id: TENANT_ID,
              name: "Acme Workspace",
              slug: "acme-workspace",
              status: "active",
              ownerUserId: "507f191e810c19729de860f1",
              planId: "plan:starter",
              activeModuleKeys: [],
              memberLimit: null,
            },
            membership: {
              id: "507f191e810c19729de860f2",
              tenantId: TENANT_ID,
              userId: "507f191e810c19729de860f1",
              roleKey: "tenant:member",
              status: "active",
            },
          },
          traceId: "trace-invitation-accept-ok",
        });
      }),
    );

    const response = await acceptTenantInvitation({ token: "invite_token_123" });

    expect(requestBody).toEqual({ token: "invite_token_123" });
    expect(response.data.membership.roleKey).toBe("tenant:member");
    expect(response.traceId).toBe("trace-invitation-accept-ok");
  });

  it("revokes tenant invitation with tenant header", async () => {
    let requestBody: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/tenant/invitations/revoke", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            invitation: {
              id: INVITATION_ID,
              tenantId: TENANT_ID,
              email: "member@acme.dev",
              roleKey: "tenant:member",
              status: "revoked",
              expiresAt: "2026-12-31T23:59:59.000Z",
            },
          },
          traceId: "trace-invitation-revoke-ok",
        });
      }),
    );

    const response = await revokeTenantInvitation(TENANT_ID, {
      invitationId: INVITATION_ID,
    });

    expect(requestBody).toEqual({ invitationId: INVITATION_ID });
    expect(response.data.invitation.status).toBe("revoked");
    expect(response.traceId).toBe("trace-invitation-revoke-ok");
  });

  it("transfers tenant ownership with tenant header", async () => {
    let requestBody: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/tenant/transfer-ownership", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            tenant: {
              id: TENANT_ID,
              name: "Acme Workspace",
              slug: "acme-workspace",
              status: "active",
              ownerUserId: TARGET_USER_ID,
              planId: "plan:starter",
              activeModuleKeys: [],
              memberLimit: null,
            },
            membership: {
              id: "507f191e810c19729de860f2",
              tenantId: TENANT_ID,
              userId: "507f191e810c19729de860f1",
              roleKey: "tenant:member",
              status: "active",
            },
          },
          traceId: "trace-transfer-ownership-ok",
        });
      }),
    );

    const response = await transferTenantOwnership(TENANT_ID, {
      targetUserId: TARGET_USER_ID,
    });

    expect(requestBody).toEqual({ targetUserId: TARGET_USER_ID });
    expect(response.data.tenant.ownerUserId).toBe(TARGET_USER_ID);
    expect(response.traceId).toBe("trace-transfer-ownership-ok");
  });

  it("normalizes tenants from tenant/mine summaries", async () => {
    server.use(
      http.get("*/api/v1/tenant/mine", () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                tenant: {
                  id: TENANT_ID,
                  name: "Acme Workspace",
                  slug: "acme-workspace",
                  status: "active",
                  ownerUserId: "507f191e810c19729de860f1",
                  planId: "plan:starter",
                  activeModuleKeys: [],
                  memberLimit: null,
                },
                membership: {
                  id: "507f191e810c19729de860f2",
                  tenantId: TENANT_ID,
                  userId: "507f191e810c19729de860f1",
                  roleKey: "tenant:owner",
                  status: "active",
                },
                isActive: true,
              },
            ],
          },
          traceId: "trace-tenant-mine-normalized",
        }),
      ),
    );

    const result = await getMyTenantsNormalized();

    expect(result.tenants).toHaveLength(1);
    expect(result.tenants[0]?.id).toBe(TENANT_ID);
    expect(result.traceId).toBe("trace-tenant-mine-normalized");
  });
});
