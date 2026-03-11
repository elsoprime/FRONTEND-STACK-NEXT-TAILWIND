import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";

export type TenantModuleState = "active" | "enabled" | "disabled";

export function hasTenantRuntime(
  runtime: TenantRuntime | null | undefined,
): runtime is TenantRuntime {
  return Boolean(runtime);
}

export function hasActiveTenantModule(
  runtime: TenantRuntime | null | undefined,
  moduleKey: string,
): boolean {
  return runtime?.activeModuleKeys?.includes(moduleKey) ?? false;
}

export function hasEnabledTenantModule(
  runtime: TenantRuntime | null | undefined,
  moduleKey: string,
): boolean {
  return runtime?.enabledModuleKeys?.includes(moduleKey) ?? false;
}

export function hasTenantFeatureFlag(
  runtime: TenantRuntime | null | undefined,
  featureFlagKey: string,
): boolean {
  return runtime?.featureFlagKeys?.includes(featureFlagKey) ?? false;
}

export function resolveTenantModuleState(
  runtime: TenantRuntime | null | undefined,
  moduleKey: string,
): TenantModuleState {
  if (hasActiveTenantModule(runtime, moduleKey)) {
    return "active";
  }

  if (hasEnabledTenantModule(runtime, moduleKey)) {
    return "enabled";
  }

  return "disabled";
}
