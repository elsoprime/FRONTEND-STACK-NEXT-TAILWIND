import { z } from "zod";

export const tenantViewSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    status: z.enum(["active", "suspended"]).or(z.string()),
    ownerUserId: z.string(),
    planId: z.string().nullable(),
    activeModuleKeys: z.array(z.string()),
    memberLimit: z.number().int().nullable(),
  })
  .passthrough();

export type TenantView = z.infer<typeof tenantViewSchema>;
export type TenantSummary = TenantView;

export const membershipViewSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    userId: z.string(),
    roleKey: z.enum(["tenant:owner", "tenant:member"]).or(z.string()),
    status: z.enum(["active", "suspended"]).or(z.string()),
  })
  .passthrough();

export type MembershipView = z.infer<typeof membershipViewSchema>;

export const tenantInvitationSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    email: z.string().email(),
    roleKey: z.enum(["tenant:owner", "tenant:member"]).or(z.string()),
    status: z.enum(["pending", "accepted", "revoked", "expired"]).or(z.string()),
    expiresAt: z.string(),
  })
  .passthrough();

export type TenantInvitation = z.infer<typeof tenantInvitationSchema>;

export const tenantMembershipSummarySchema = z
  .object({
    tenant: tenantViewSchema,
    membership: membershipViewSchema,
    isActive: z.boolean(),
  })
  .passthrough();

export type TenantMembershipSummary = z.infer<typeof tenantMembershipSummarySchema>;

export const tenantMineDataSchema = z
  .object({
    items: z.array(tenantMembershipSummarySchema),
  })
  .passthrough();

export type TenantMineData = z.infer<typeof tenantMineDataSchema>;

export const createTenantDataSchema = z
  .object({
    tenant: tenantViewSchema,
    membership: membershipViewSchema,
  })
  .passthrough();

export type CreateTenantData = z.infer<typeof createTenantDataSchema>;

export const switchTenantDataSchema = z
  .object({
    tenant: tenantViewSchema,
    membership: membershipViewSchema,
    accessToken: z.string().optional(),
  })
  .passthrough();

export type SwitchTenantData = z.infer<typeof switchTenantDataSchema>;

export const tenantInvitationDataSchema = z
  .object({
    invitation: tenantInvitationSchema,
  })
  .passthrough();

export type TenantInvitationData = z.infer<typeof tenantInvitationDataSchema>;

export const acceptTenantInvitationDataSchema = z
  .object({
    tenant: tenantViewSchema,
    membership: membershipViewSchema,
  })
  .passthrough();

export type AcceptTenantInvitationData = z.infer<typeof acceptTenantInvitationDataSchema>;

export const transferTenantOwnershipDataSchema = z
  .object({
    tenant: tenantViewSchema,
    membership: membershipViewSchema,
  })
  .passthrough();

export type TransferTenantOwnershipData = z.infer<typeof transferTenantOwnershipDataSchema>;

export function normalizeTenantMine(data: TenantMineData): TenantSummary[] {
  return data.items.map((item) => item.tenant);
}
