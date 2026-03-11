import { apiRequest } from "@/lib/api/client";
import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import {
  tenantSettingsDataSchema,
  tenantSettingsEffectiveDataSchema,
  updateTenantSettingsRequestSchema,
  type TenantSettingsData,
  type TenantSettingsEffectiveData,
  type UpdateTenantSettingsInput,
} from "@/features/tenant/tenant-settings.schemas";

const TENANT_SETTINGS_ENDPOINTS = {
  singleton: "/api/v1/tenant/settings",
  effective: "/api/v1/tenant/settings/effective",
} as const;

export async function getTenantSettings(
  tenantId: string,
): Promise<ApiSuccessEnvelope<TenantSettingsData>> {
  return apiRequest(TENANT_SETTINGS_ENDPOINTS.singleton, {
    method: "GET",
    tenantId,
    dataSchema: tenantSettingsDataSchema,
  });
}

export async function updateTenantSettings(
  tenantId: string,
  payload: UpdateTenantSettingsInput,
): Promise<ApiSuccessEnvelope<TenantSettingsData>> {
  return apiRequest(TENANT_SETTINGS_ENDPOINTS.singleton, {
    method: "PATCH",
    tenantId,
    body: updateTenantSettingsRequestSchema.parse(payload),
    dataSchema: tenantSettingsDataSchema,
  });
}

export async function getTenantSettingsEffective(
  tenantId: string,
): Promise<ApiSuccessEnvelope<TenantSettingsEffectiveData>> {
  return apiRequest(TENANT_SETTINGS_ENDPOINTS.effective, {
    method: "GET",
    tenantId,
    dataSchema: tenantSettingsEffectiveDataSchema,
  });
}
