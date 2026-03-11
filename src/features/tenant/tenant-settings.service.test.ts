import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import {
  getTenantSettings,
  getTenantSettingsEffective,
  updateTenantSettings,
} from "@/features/tenant/tenant-settings.service";
import {
  toTenantSettingsFormValues,
  toUpdateTenantSettingsInput,
  type UpdateTenantSettingsInput,
} from "@/features/tenant/tenant-settings.schemas";

const tenantId = "507f191e810c19729de860ea";

const tenantSettingsFixture = {
  id: "cfg_01",
  tenantId,
  singletonKey: "tenant_settings" as const,
  branding: {
    displayName: "Acme",
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

const tenantSettingsEffectiveFixture = {
  tenantId,
  branding: {
    displayName: "Acme",
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

describe("tenant-settings.service", () => {
  it("maps tenant settings to form values", () => {
    expect(toTenantSettingsFormValues(tenantSettingsFixture)).toEqual({
      branding: {
        displayName: "Acme",
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
    });
  });

  it("normalizes form values into update payload", () => {
    expect(
      toUpdateTenantSettingsInput({
        branding: {
          displayName: "  Acme  ",
          supportEmail: "SUPPORT@ACME.DEV",
          supportUrl: "",
        },
        localization: {
          defaultTimezone: "  America/Santiago  ",
          defaultCurrency: "usd",
          defaultLanguage: " es ",
        },
        contact: {
          primaryEmail: "",
          phone: "  +56 9 1111 2222 ",
          websiteUrl: "https://acme.dev",
        },
        billing: {
          billingEmail: "billing@acme.dev",
          legalName: "",
          taxId: " 76.123.456-7 ",
        },
      }),
    ).toEqual<UpdateTenantSettingsInput>({
      branding: {
        displayName: "Acme",
        supportEmail: "support@acme.dev",
        supportUrl: null,
      },
      localization: {
        defaultTimezone: "America/Santiago",
        defaultCurrency: "USD",
        defaultLanguage: "es",
      },
      contact: {
        primaryEmail: null,
        phone: "+56 9 1111 2222",
        websiteUrl: "https://acme.dev",
      },
      billing: {
        billingEmail: "billing@acme.dev",
        legalName: null,
        taxId: "76.123.456-7",
      },
    });
  });

  it("reads tenant settings with tenant header", async () => {
    server.use(
      http.get("*/api/v1/tenant/settings", ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(tenantId);

        return HttpResponse.json({
          success: true,
          data: {
            settings: tenantSettingsFixture,
          },
          traceId: "trace-tenant-settings-read",
        });
      }),
    );

    const response = await getTenantSettings(tenantId);

    expect(response.data.settings.singletonKey).toBe("tenant_settings");
    expect(response.traceId).toBe("trace-tenant-settings-read");
  });

  it("reads effective tenant settings and runtime", async () => {
    server.use(
      http.get("*/api/v1/tenant/settings/effective", ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(tenantId);

        return HttpResponse.json({
          success: true,
          data: {
            settings: tenantSettingsEffectiveFixture,
          },
          traceId: "trace-tenant-settings-effective",
        });
      }),
    );

    const response = await getTenantSettingsEffective(tenantId);

    expect(response.data.settings.runtime.enabledModuleKeys).toEqual(["inventory", "crm", "hr"]);
    expect(response.traceId).toBe("trace-tenant-settings-effective");
  });

  it("updates tenant settings with normalized payload", async () => {
    let capturedPayload: UpdateTenantSettingsInput | null = null;

    server.use(
      http.patch("*/api/v1/tenant/settings", async ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(tenantId);
        capturedPayload = (await request.json()) as UpdateTenantSettingsInput;

        return HttpResponse.json({
          success: true,
          data: {
            settings: {
              ...tenantSettingsFixture,
              branding: {
                ...tenantSettingsFixture.branding,
                displayName: "Acme Updated",
              },
            },
          },
          traceId: "trace-tenant-settings-update",
        });
      }),
    );

    const payload = toUpdateTenantSettingsInput({
      branding: {
        displayName: "Acme Updated",
        supportEmail: "support@acme.dev",
        supportUrl: "https://acme.dev/support",
      },
      localization: {
        defaultTimezone: "America/Santiago",
        defaultCurrency: "usd",
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
    });

    const response = await updateTenantSettings(tenantId, payload);

    expect(capturedPayload).toEqual(payload);
    expect(response.data.settings.branding.displayName).toBe("Acme Updated");
    expect(response.traceId).toBe("trace-tenant-settings-update");
  });
});
