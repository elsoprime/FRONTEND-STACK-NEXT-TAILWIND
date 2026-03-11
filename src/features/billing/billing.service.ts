import { apiRequest } from "@/lib/api/client";
import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import {
  assignTenantSubscriptionInputSchema,
  billingPlansDataSchema,
  checkoutSessionDataSchema,
  createCheckoutSessionInputSchema,
  tenantSubscriptionDataSchema,
  type AssignTenantSubscriptionInput,
  type BillingPlansData,
  type CheckoutSessionData,
  type CreateCheckoutSessionInput,
  type TenantSubscriptionData,
} from "@/features/billing/billing.schemas";

const BILLING_ENDPOINTS = {
  plans: "/api/v1/billing/plans",
  checkoutSession: "/api/v1/billing/checkout/session",
  tenantSubscription: "/api/v1/tenant/subscription",
} as const;

export async function getBillingPlans(): Promise<ApiSuccessEnvelope<BillingPlansData>> {
  return apiRequest(BILLING_ENDPOINTS.plans, {
    method: "GET",
    dataSchema: billingPlansDataSchema,
  });
}

export async function createCheckoutSession(
  tenantId: string,
  payload: CreateCheckoutSessionInput,
): Promise<ApiSuccessEnvelope<CheckoutSessionData>> {
  return apiRequest(BILLING_ENDPOINTS.checkoutSession, {
    method: "POST",
    tenantId,
    body: createCheckoutSessionInputSchema.parse(payload),
    dataSchema: checkoutSessionDataSchema,
  });
}

export async function assignTenantSubscription(
  tenantId: string,
  payload: AssignTenantSubscriptionInput,
): Promise<ApiSuccessEnvelope<TenantSubscriptionData>> {
  return apiRequest(BILLING_ENDPOINTS.tenantSubscription, {
    method: "PATCH",
    tenantId,
    body: assignTenantSubscriptionInputSchema.parse(payload),
    dataSchema: tenantSubscriptionDataSchema,
  });
}

export async function cancelTenantSubscription(
  tenantId: string,
): Promise<ApiSuccessEnvelope<TenantSubscriptionData>> {
  return apiRequest(BILLING_ENDPOINTS.tenantSubscription, {
    method: "DELETE",
    tenantId,
    dataSchema: tenantSubscriptionDataSchema,
  });
}
