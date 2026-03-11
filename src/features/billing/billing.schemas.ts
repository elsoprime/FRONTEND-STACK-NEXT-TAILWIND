import { z } from "zod";

export const billingPlanSchema = z
  .object({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    rank: z.number().int(),
    allowedModuleKeys: z.array(z.string()),
    featureFlagKeys: z.array(z.string()),
    memberLimit: z.number().int().nullable(),
  })
  .passthrough();

export type BillingPlan = z.infer<typeof billingPlanSchema>;

export const billingPlansDataSchema = z
  .object({
    items: z.array(billingPlanSchema),
  })
  .passthrough();

export type BillingPlansData = z.infer<typeof billingPlansDataSchema>;

export const billingCheckoutSessionSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    planId: z.string(),
    provider: z.enum(["simulated", "stripe"]),
    providerSessionId: z.string(),
    status: z.enum(["pending", "paid", "activated", "failed", "canceled"]),
    checkoutUrl: z.string().url(),
    createdAt: z.string(),
    expiresAt: z.string(),
    activatedAt: z.string().nullable(),
  })
  .passthrough();

export type BillingCheckoutSession = z.infer<typeof billingCheckoutSessionSchema>;

export const createCheckoutSessionInputSchema = z.object({
  planId: z.string().trim().min(1),
  provider: z.enum(["simulated", "stripe"]).default("simulated"),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionInputSchema>;

export const checkoutSessionDataSchema = z
  .object({
    checkoutSession: billingCheckoutSessionSchema,
  })
  .passthrough();

export type CheckoutSessionData = z.infer<typeof checkoutSessionDataSchema>;

export const tenantSubscriptionSchema = z
  .object({
    planId: z.string().nullable(),
    activeModuleKeys: z.array(z.string()),
    status: z.enum(["activated", "canceled"]),
  })
  .passthrough();

export type TenantSubscription = z.infer<typeof tenantSubscriptionSchema>;

export const tenantSubscriptionDataSchema = z
  .object({
    tenant: z
      .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.string(),
        ownerUserId: z.string(),
        planId: z.string().nullable(),
        activeModuleKeys: z.array(z.string()),
        memberLimit: z.number().nullable(),
      })
      .passthrough(),
    subscription: tenantSubscriptionSchema,
  })
  .passthrough();

export type TenantSubscriptionData = z.infer<typeof tenantSubscriptionDataSchema>;

export const assignTenantSubscriptionInputSchema = z.object({
  planId: z.string().trim().min(1),
});

export type AssignTenantSubscriptionInput = z.infer<typeof assignTenantSubscriptionInputSchema>;
