import { apiRequest } from "@/lib/api/client";
import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import {
  platformSettingsDataSchema,
  updatePlatformSettingsInputSchema,
  type PlatformSettingsData,
  type UpdatePlatformSettingsInput,
} from "@/features/platform-settings/platform-settings.schemas";

const PLATFORM_SETTINGS_ENDPOINT = "/api/v1/platform/settings";

export async function getPlatformSettings(): Promise<ApiSuccessEnvelope<PlatformSettingsData>> {
  return apiRequest(PLATFORM_SETTINGS_ENDPOINT, {
    method: "GET",
    dataSchema: platformSettingsDataSchema,
  });
}

export async function updatePlatformSettings(
  payload: UpdatePlatformSettingsInput,
): Promise<ApiSuccessEnvelope<PlatformSettingsData>> {
  return apiRequest(PLATFORM_SETTINGS_ENDPOINT, {
    method: "PATCH",
    body: updatePlatformSettingsInputSchema.parse(payload),
    dataSchema: platformSettingsDataSchema,
  });
}
