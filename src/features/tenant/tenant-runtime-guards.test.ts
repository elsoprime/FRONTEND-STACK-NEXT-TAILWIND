import { describe, expect, it } from "vitest";
import {
  hasActiveTenantModule,
  hasEnabledTenantModule,
  hasTenantFeatureFlag,
  hasTenantRuntime,
  resolveTenantModuleState,
} from "@/features/tenant/tenant-runtime-guards";

const runtime = {
  planId: "plan:growth",
  activeModuleKeys: ["inventory"],
  enabledModuleKeys: ["inventory", "crm", "hr"],
  featureFlagKeys: ["inventory:base", "crm:base"],
};

describe("tenant-runtime-guards", () => {
  it("detects when runtime exists", () => {
    expect(hasTenantRuntime(runtime)).toBe(true);
    expect(hasTenantRuntime(null)).toBe(false);
  });

  it("resolves active and enabled modules", () => {
    expect(hasActiveTenantModule(runtime, "inventory")).toBe(true);
    expect(hasEnabledTenantModule(runtime, "crm")).toBe(true);
    expect(hasEnabledTenantModule(runtime, "billing")).toBe(false);
  });

  it("detects feature flags", () => {
    expect(hasTenantFeatureFlag(runtime, "inventory:base")).toBe(true);
    expect(hasTenantFeatureFlag(runtime, "hr:base")).toBe(false);
  });

  it("resolves module state in priority order", () => {
    expect(resolveTenantModuleState(runtime, "inventory")).toBe("active");
    expect(resolveTenantModuleState(runtime, "crm")).toBe("enabled");
    expect(resolveTenantModuleState(runtime, "billing")).toBe("disabled");
  });
  it("handles incomplete runtime payloads without crashing", () => {
    const incompleteRuntime = { planId: "plan:starter" } as unknown as typeof runtime;

    expect(hasActiveTenantModule(incompleteRuntime, "inventory")).toBe(false);
    expect(hasEnabledTenantModule(incompleteRuntime, "crm")).toBe(false);
    expect(hasTenantFeatureFlag(incompleteRuntime, "inventory:base")).toBe(false);
    expect(resolveTenantModuleState(incompleteRuntime, "inventory")).toBe("disabled");
  });
});
