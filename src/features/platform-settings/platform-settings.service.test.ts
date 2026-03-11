import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/features/platform-settings/platform-settings.service";
import { server } from "@/mocks/server";

const PLATFORM_SETTINGS_PATH = "*/api/v1/platform/settings";

describe("platform-settings.service", () => {
  it("reads platform settings singleton", async () => {
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
              security: {
                allowUserRegistration: true,
                requireEmailVerification: true,
              },
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
    expect(result.data.settings.singletonKey).toBe("platform_settings");
    expect(result.traceId).toBe("trace-platform-settings-read");
  });

  it("updates platform settings singleton", async () => {
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
                allowUserRegistration: true,
                requireEmailVerification: true,
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
    expect(result.data.settings.operations.maintenanceMode).toBe(true);
    expect(result.traceId).toBe("trace-platform-settings-update");
  });
});
