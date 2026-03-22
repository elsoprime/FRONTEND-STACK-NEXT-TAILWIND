import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/features/platform-settings/platform-settings.service";
import { server } from "@/mocks/server";

const PLATFORM_SETTINGS_PATH = "*/api/v1/platform/settings";

function buildSecurity() {
  return {
    allowUserRegistration: true,
    requireEmailVerification: true,
    requireTwoFactorForPrivilegedUsers: true,
    passwordPolicy: {
      minLength: 14,
      preventReuseCount: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialChar: true,
    },
    sessionPolicy: {
      browserSessionTtlMinutes: 720,
      idleTimeoutMinutes: 30,
    },
    riskControls: {
      allowRecoveryCodes: true,
      enforceVerifiedEmailForPrivilegedAccess: true,
    },
  };
}

describe("platform-settings.service", () => {
  it("reads platform settings singleton with expanded security", async () => {
    server.use(
      http.get(PLATFORM_SETTINGS_PATH, ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBeNull();

        return HttpResponse.json({
          success: true,
          data: {
            settings: {
              id: "cfg_platform_01",
              singletonKey: "platform_settings",
              branding: {
                applicationName: "SaaS Core Engine",
                supportEmail: "support@saas.dev",
                supportUrl: "https://saas.dev/support",
              },
              localization: {
                defaultTimezone: "America/Santiago",
                defaultCurrency: "USD",
                defaultLanguage: "es",
              },
              security: buildSecurity(),
              operations: {
                maintenanceMode: false,
              },
              modules: {
                disabledModuleKeys: [],
              },
              featureFlags: {
                disabledFeatureFlagKeys: [],
              },
            },
          },
          traceId: "trace-platform-settings-read",
        });
      }),
    );

    const result = await getPlatformSettings();

    expect(result.success).toBe(true);
    expect(result.data.settings.security.requireTwoFactorForPrivilegedUsers).toBe(true);
    expect(result.data.settings.security.passwordPolicy.minLength).toBe(14);
    expect(result.traceId).toBe("trace-platform-settings-read");
  });

  it("updates platform settings singleton with nested security policy", async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    server.use(
      http.patch(PLATFORM_SETTINGS_PATH, async ({ request }) => {
        capturedPayload = (await request.json()) as Record<string, unknown>;
        expect(request.headers.get("X-Tenant-Id")).toBeNull();

        return HttpResponse.json({
          success: true,
          data: {
            settings: {
              id: "cfg_platform_01",
              singletonKey: "platform_settings",
              branding: {
                applicationName: "SaaS Core Engine",
                supportEmail: "support@saas.dev",
                supportUrl: "https://saas.dev/support",
              },
              localization: {
                defaultTimezone: "America/Santiago",
                defaultCurrency: "USD",
                defaultLanguage: "es",
              },
              security: {
                ...buildSecurity(),
                requireTwoFactorForPrivilegedUsers: false,
                passwordPolicy: {
                  ...buildSecurity().passwordPolicy,
                  minLength: 12,
                  requireSpecialChar: false,
                },
                sessionPolicy: {
                  browserSessionTtlMinutes: 1440,
                  idleTimeoutMinutes: null,
                },
              },
              operations: {
                maintenanceMode: true,
              },
              modules: {
                disabledModuleKeys: ["inventory"],
              },
              featureFlags: {
                disabledFeatureFlagKeys: ["crm:new-pipeline"],
              },
            },
          },
          traceId: "trace-platform-settings-update",
        });
      }),
    );

    const result = await updatePlatformSettings({
      security: {
        requireTwoFactorForPrivilegedUsers: false,
        passwordPolicy: {
          minLength: 12,
          requireSpecialChar: false,
        },
        sessionPolicy: {
          browserSessionTtlMinutes: 1440,
          idleTimeoutMinutes: null,
        },
      },
      operations: {
        maintenanceMode: true,
      },
      modules: {
        disabledModuleKeys: ["inventory"],
      },
      featureFlags: {
        disabledFeatureFlagKeys: ["crm:new-pipeline"],
      },
    });

    expect(capturedPayload).toEqual({
      security: {
        requireTwoFactorForPrivilegedUsers: false,
        passwordPolicy: {
          minLength: 12,
          requireSpecialChar: false,
        },
        sessionPolicy: {
          browserSessionTtlMinutes: 1440,
          idleTimeoutMinutes: null,
        },
      },
      operations: {
        maintenanceMode: true,
      },
      modules: {
        disabledModuleKeys: ["inventory"],
      },
      featureFlags: {
        disabledFeatureFlagKeys: ["crm:new-pipeline"],
      },
    });
    expect(result.data.settings.security.sessionPolicy.idleTimeoutMinutes).toBeNull();
    expect(result.traceId).toBe("trace-platform-settings-update");
  });
});
