import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import {
  assignTenantSubscription,
  cancelTenantSubscription,
  createCheckoutSession,
  getBillingPlans,
} from "@/features/billing/billing.service";

const TENANT_ID = "507f191e810c19729de860ea";

describe("billing.service", () => {
  it("lists available billing plans", async () => {
    server.use(
      http.get("*/api/v1/billing/plans", () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                key: "plan:starter",
                name: "Starter",
                description: "Plan inicial",
                rank: 10,
                allowedModuleKeys: ["inventory"],
                featureFlagKeys: ["inventory:base"],
                memberLimit: 5,
              },
            ],
          },
          traceId: "trace-billing-plans",
        }),
      ),
    );

    const response = await getBillingPlans();

    expect(response.traceId).toBe("trace-billing-plans");
    expect(response.data.items).toHaveLength(1);
    expect(response.data.items[0]?.key).toBe("plan:starter");
  });

  it("creates checkout session with tenant header", async () => {
    let payload: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/billing/checkout/session", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json(
          {
            success: true,
            data: {
              checkoutSession: {
                id: "507f191e810c19729de860aa",
                tenantId: TENANT_ID,
                planId: "plan:starter",
                provider: "simulated",
                providerSessionId: "provider_01",
                status: "pending",
                checkoutUrl: "http://localhost:3000/app/settings/billing?session=provider_01",
                createdAt: "2026-03-11T00:00:00.000Z",
                expiresAt: "2026-03-11T01:00:00.000Z",
                activatedAt: null,
              },
            },
            traceId: "trace-checkout-create",
          },
          { status: 201 },
        );
      }),
    );

    const response = await createCheckoutSession(TENANT_ID, {
      planId: "plan:starter",
      provider: "simulated",
    });

    expect(payload).toEqual({
      planId: "plan:starter",
      provider: "simulated",
    });
    expect(response.data.checkoutSession.status).toBe("pending");
  });

  it("assigns tenant subscription with tenant header", async () => {
    let payload: Record<string, unknown> | null = null;

    server.use(
      http.patch("*/api/v1/tenant/subscription", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            tenant: {
              id: TENANT_ID,
              name: "Acme",
              slug: "acme",
              status: "active",
              ownerUserId: "507f191e810c19729de860ff",
              planId: "plan:growth",
              activeModuleKeys: ["inventory", "crm"],
              memberLimit: 50,
            },
            subscription: {
              planId: "plan:growth",
              activeModuleKeys: ["inventory", "crm"],
              status: "activated",
            },
          },
          traceId: "trace-subscription-assign",
        });
      }),
    );

    const response = await assignTenantSubscription(TENANT_ID, {
      planId: "plan:growth",
      checkoutSessionId: "507f191e810c19729de860aa",
    });

    expect(payload).toEqual({ planId: "plan:growth", checkoutSessionId: "507f191e810c19729de860aa" });
    expect(response.data.subscription.status).toBe("activated");
  });

  it("cancels tenant subscription with tenant header", async () => {
    server.use(
      http.delete("*/api/v1/tenant/subscription", ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            tenant: {
              id: TENANT_ID,
              name: "Acme",
              slug: "acme",
              status: "active",
              ownerUserId: "507f191e810c19729de860ff",
              planId: null,
              activeModuleKeys: [],
              memberLimit: null,
            },
            subscription: {
              planId: null,
              activeModuleKeys: [],
              status: "canceled",
            },
          },
          traceId: "trace-subscription-cancel",
        });
      }),
    );

    const response = await cancelTenantSubscription(TENANT_ID);

    expect(response.data.subscription.status).toBe("canceled");
    expect(response.data.tenant.planId).toBeNull();
  });
});

