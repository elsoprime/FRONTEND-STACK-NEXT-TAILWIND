import { HttpResponse, http } from "msw";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { setGlobalAuthFailureHandler } from "@/lib/api/auth-failure-handler";
import { ApiRequestError, apiRequest, platformApiRequest, tenantApiRequest } from "@/lib/api/client";

describe("apiRequest", () => {
  it("injects CSRF and tenant headers for tenant-scoped mutating routes", async () => {
    document.cookie = "csrf_token=test-csrf-token";

    server.use(
      http.post("*/api/v1/modules/inventory/items", async ({ request }) => {
        return HttpResponse.json({
          success: true,
          data: {
            csrf: request.headers.get("X-CSRF-Token"),
            tenant: request.headers.get("X-Tenant-Id"),
          },
          traceId: "trace-header-check",
        });
      }),
    );

    const response = await apiRequest("/api/v1/modules/inventory/items", {
      method: "POST",
      body: { sku: "A-100" },
      tenantId: "acme-tenant",
      dataSchema: z.object({
        csrf: z.string(),
        tenant: z.string(),
      }),
    });

    expect(response.success).toBe(true);
    expect(response.data).toEqual({
      csrf: "test-csrf-token",
      tenant: "acme-tenant",
    });
  });

  it("throws TENANT_HEADER_REQUIRED before request when tenant scoped route has no tenantId", async () => {
    await expect(
      apiRequest("/api/v1/modules/inventory/items", {
        method: "GET",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "TENANT_HEADER_REQUIRED",
    });
  });

  it("blocks tenant client from platform scoped paths", async () => {
    await expect(
      tenantApiRequest("/api/v1/platform/settings", {
        method: "GET",
        tenantId: "acme-tenant",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "TENANT_SCOPE_MISMATCH",
    });
  });

  it("blocks platform client from tenant scoped paths", async () => {
    await expect(
      platformApiRequest("/api/v1/modules/inventory/items", {
        method: "GET",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "TENANT_SCOPE_MISMATCH",
    });
  });

  it("blocks platform scoped requests that include tenantId", async () => {
    await expect(
      platformApiRequest("/api/v1/platform/settings", {
        method: "GET",
        tenantId: "acme-tenant",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "TENANT_SCOPE_MISMATCH",
    });
  });

  it("throws AUTH_CSRF_INVALID before request when mutating browser call has no CSRF cookie", async () => {
    document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

    await expect(
      apiRequest("/api/v1/tenant", {
        method: "POST",
        body: { name: "Acme" },
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "AUTH_CSRF_INVALID",
    });
  });

  it("normalizes error.code and traceId on non-success responses", async () => {
    server.use(
      http.get("*/api/v1/platform/settings", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "RBAC_PERMISSION_DENIED",
              message: "Forbidden",
            },
            traceId: "trace-rbac-001",
          },
          { status: 403 },
        );
      }),
    );

    await expect(apiRequest("/api/v1/platform/settings")).rejects.toMatchObject({
      status: 403,
      code: "RBAC_PERMISSION_DENIED",
      traceId: "trace-rbac-001",
    });
  });

  it("preserves backend error code even when envelope has non-strict details shape", async () => {
    server.use(
      http.post("*/api/v1/auth/login/browser", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "AUTH_INVALID_CREDENTIALS",
              message: "Invalid credentials",
              details: {
                email: "not_found",
              },
            },
            traceId: "trace-auth-invalid-001",
          },
          { status: 401 },
        );
      }),
    );

    await expect(
      apiRequest("/api/v1/auth/login/browser", {
        method: "POST",
        body: {
          email: "does-not-exist@acme.dev",
          password: "invalid",
        },
        withCsrf: false,
        allowRefreshRetry: false,
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "AUTH_INVALID_CREDENTIALS",
      traceId: "trace-auth-invalid-001",
      details: {
        email: ["not_found"],
      },
    });
  });

  it("retries once after browser refresh on 401", async () => {
    document.cookie = "csrf_token=refresh-csrf";
    let protectedCalls = 0;
    let refreshCalls = 0;

    server.use(
      http.get("*/api/v1/tenant/mine", () => {
        protectedCalls += 1;

        if (protectedCalls === 1) {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: "AUTH_UNAUTHENTICATED",
                message: "Expired",
              },
              traceId: "trace-auth-401",
            },
            { status: 401 },
          );
        }

        return HttpResponse.json({
          success: true,
          data: {
            tenants: [{ id: "tenant_01" }],
          },
          traceId: "trace-tenant-ok",
        });
      }),
      http.post("*/api/v1/auth/refresh/browser", ({ request }) => {
        refreshCalls += 1;

        expect(request.headers.get("X-CSRF-Token")).toBe("refresh-csrf");

        return HttpResponse.json({
          success: true,
          data: {
            refreshed: true,
          },
          traceId: "trace-refresh-ok",
        });
      }),
    );

    const response = await apiRequest("/api/v1/tenant/mine", {
      method: "GET",
      dataSchema: z.object({
        tenants: z.array(z.object({ id: z.string() })),
      }),
    });

    expect(response.success).toBe(true);
    expect(response.data.tenants).toHaveLength(1);
    expect(protectedCalls).toBe(2);
    expect(refreshCalls).toBe(1);
  });

  it("keeps original 401 error when refresh fails and triggers auth failure callback", async () => {
    let onAuthFailureCalled = false;
    let globalAuthFailureCalled = false;
    const cleanupGlobalHandler = setGlobalAuthFailureHandler(() => {
      globalAuthFailureCalled = true;
    });

    server.use(
      http.get("*/api/v1/tenant/mine", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "AUTH_UNAUTHENTICATED",
              message: "Expired",
            },
            traceId: "trace-auth-expired",
          },
          { status: 401 },
        );
      }),
      http.post("*/api/v1/auth/refresh/browser", () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: "AUTH_INVALID_REFRESH_TOKEN",
              message: "Refresh invalid",
            },
            traceId: "trace-refresh-fail",
          },
          { status: 401 },
        );
      }),
    );

    await expect(
      apiRequest("/api/v1/tenant/mine", {
        method: "GET",
        onAuthFailure: () => {
          onAuthFailureCalled = true;
        },
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        status: 401,
        code: "AUTH_UNAUTHENTICATED",
        traceId: "trace-auth-expired",
      }),
    );

    expect(onAuthFailureCalled).toBe(true);
    expect(globalAuthFailureCalled).toBe(true);
    cleanupGlobalHandler();
  });

  it("throws ApiRequestError instance on invalid success envelope", async () => {
    server.use(
      http.get("*/api/invalid-success", () => {
        return HttpResponse.json(
          {
            ok: true,
          },
          { status: 200 },
        );
      }),
    );

    await expect(apiRequest("/api/invalid-success")).rejects.toBeInstanceOf(ApiRequestError);
  });
});
