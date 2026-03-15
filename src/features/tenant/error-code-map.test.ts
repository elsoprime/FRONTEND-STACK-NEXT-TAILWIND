import { describe, expect, it } from "vitest";
import { resolveBillingErrorMessage } from "@/features/billing/error-code-map";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";

describe("tenant/billing error code mapping", () => {
  it("maps payment-required tenant runtime code to actionable copy", () => {
    expect(resolveTenantErrorMessage("TENANT_SUBSCRIPTION_PAYMENT_REQUIRED")).toContain("Billing");
  });

  it("maps payment-required billing code to actionable copy", () => {
    expect(resolveBillingErrorMessage("TENANT_SUBSCRIPTION_PAYMENT_REQUIRED")).toContain("pago");
  });

  it("keeps dependency bootstrap override when raw message indicates platform settings init", () => {
    const message = resolveTenantErrorMessage(
      "GEN_INTERNAL_ERROR",
      "platform settings must be initialized before resolving effective tenant settings",
    );

    expect(message).toContain("Dependencia abierta");
  });
});
