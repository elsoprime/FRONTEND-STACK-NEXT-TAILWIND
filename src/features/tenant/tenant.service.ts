import { apiRequest, tenantApiRequest } from "@/lib/api/client";
import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import {
  acceptTenantInvitationDataSchema,
  createTenantDataSchema,
  normalizeTenantMine,
  switchTenantDataSchema,
  tenantInvitationDataSchema,
  tenantMembershipListDataSchema,
  tenantMembershipMutationDataSchema,
  tenantMineDataSchema,
  tenantMembershipSummarySchema,
  transferTenantOwnershipDataSchema,
  type AcceptTenantInvitationData,
  type CreateTenantData,
  type SwitchTenantData,
  type TenantInvitationData,
  type TenantMineData,
  type TenantMembershipListData,
  type TenantMembershipMutationData,
  type TenantMembershipSummary,
  type TenantSummary,
  type TransferTenantOwnershipData,
} from "@/features/tenant/tenant.schemas";
import {
  acceptTenantInvitationInputSchema,
  createTenantInputSchema,
  createTenantInvitationInputSchema,
  listTenantMembershipsInputSchema,
  revokeTenantInvitationInputSchema,
  switchActiveTenantInputSchema,
  transferTenantOwnershipInputSchema,
  updateTenantMembershipInputSchema,
  type AcceptTenantInvitationInput,
  type CreateTenantInput,
  type CreateTenantInvitationInput,
  type ListTenantMembershipsInput,
  type RevokeTenantInvitationInput,
  type SwitchActiveTenantInput,
  type TransferTenantOwnershipInput,
  type UpdateTenantMembershipInput,
} from "@/features/tenant/tenant-context.schemas";

const TENANT_ENDPOINTS = {
  create: "/api/v1/tenant",
  mine: "/api/v1/tenant/mine",
  switch: "/api/v1/tenant/switch",
  memberships: "/api/v1/tenant/memberships",
  invitations: "/api/v1/tenant/invitations",
  acceptInvitation: "/api/v1/tenant/invitations/accept",
  revokeInvitation: "/api/v1/tenant/invitations/revoke",
  transferOwnership: "/api/v1/tenant/transfer-ownership",
} as const;

function buildMembershipsQuery(input: ListTenantMembershipsInput = {}): string {
  const parsed = listTenantMembershipsInputSchema.parse(input);
  const params = new URLSearchParams();

  if (parsed.page !== undefined) {
    params.set("page", String(parsed.page));
  }

  if (parsed.limit !== undefined) {
    params.set("limit", String(parsed.limit));
  }

  if (parsed.search) {
    params.set("search", parsed.search);
  }

  if (parsed.roleKey) {
    params.set("roleKey", parsed.roleKey);
  }

  if (parsed.status) {
    params.set("status", parsed.status);
  }

  const query = params.toString();
  return query.length > 0
    ? `${TENANT_ENDPOINTS.memberships}?${query}`
    : TENANT_ENDPOINTS.memberships;
}

export async function getMyTenants(): Promise<ApiSuccessEnvelope<TenantMineData>> {
  return apiRequest(TENANT_ENDPOINTS.mine, {
    method: "GET",
    dataSchema: tenantMineDataSchema,
  });
}

export async function createTenant(
  payload: CreateTenantInput,
): Promise<ApiSuccessEnvelope<CreateTenantData>> {
  const parsedPayload = createTenantInputSchema.parse(payload);
  const normalizedSlug = parsedPayload.slug?.trim();

  return apiRequest(TENANT_ENDPOINTS.create, {
    method: "POST",
    body: {
      name: parsedPayload.name.trim(),
      ...(normalizedSlug ? { slug: normalizedSlug } : {}),
    },
    dataSchema: createTenantDataSchema,
  });
}

export async function switchActiveTenant(
  payload: SwitchActiveTenantInput,
): Promise<ApiSuccessEnvelope<SwitchTenantData>> {
  return apiRequest(TENANT_ENDPOINTS.switch, {
    method: "POST",
    body: switchActiveTenantInputSchema.parse(payload),
    dataSchema: switchTenantDataSchema,
  });
}

export async function listTenantMemberships(
  tenantId: string,
  input: ListTenantMembershipsInput = {},
): Promise<ApiSuccessEnvelope<TenantMembershipListData>> {
  return tenantApiRequest(buildMembershipsQuery(input), {
    method: "GET",
    tenantId,
    dataSchema: tenantMembershipListDataSchema,
  });
}

export async function updateTenantMembership(
  tenantId: string,
  membershipId: string,
  payload: UpdateTenantMembershipInput,
): Promise<ApiSuccessEnvelope<TenantMembershipMutationData>> {
  return tenantApiRequest(`${TENANT_ENDPOINTS.memberships}/${membershipId}`, {
    method: "PATCH",
    tenantId,
    body: updateTenantMembershipInputSchema.parse(payload),
    dataSchema: tenantMembershipMutationDataSchema,
  });
}

export async function deleteTenantMembership(
  tenantId: string,
  membershipId: string,
): Promise<ApiSuccessEnvelope<TenantMembershipMutationData>> {
  return tenantApiRequest(`${TENANT_ENDPOINTS.memberships}/${membershipId}`, {
    method: "DELETE",
    tenantId,
    dataSchema: tenantMembershipMutationDataSchema,
  });
}

export async function createTenantInvitation(
  tenantId: string,
  payload: CreateTenantInvitationInput,
): Promise<ApiSuccessEnvelope<TenantInvitationData>> {
  return apiRequest(TENANT_ENDPOINTS.invitations, {
    method: "POST",
    tenantId,
    body: createTenantInvitationInputSchema.parse(payload),
    dataSchema: tenantInvitationDataSchema,
  });
}

export async function acceptTenantInvitation(
  payload: AcceptTenantInvitationInput,
): Promise<ApiSuccessEnvelope<AcceptTenantInvitationData>> {
  return apiRequest(TENANT_ENDPOINTS.acceptInvitation, {
    method: "POST",
    body: acceptTenantInvitationInputSchema.parse(payload),
    dataSchema: acceptTenantInvitationDataSchema,
  });
}

export async function revokeTenantInvitation(
  tenantId: string,
  payload: RevokeTenantInvitationInput,
): Promise<ApiSuccessEnvelope<TenantInvitationData>> {
  return apiRequest(TENANT_ENDPOINTS.revokeInvitation, {
    method: "POST",
    tenantId,
    body: revokeTenantInvitationInputSchema.parse(payload),
    dataSchema: tenantInvitationDataSchema,
  });
}

export async function transferTenantOwnership(
  tenantId: string,
  payload: TransferTenantOwnershipInput,
): Promise<ApiSuccessEnvelope<TransferTenantOwnershipData>> {
  return apiRequest(TENANT_ENDPOINTS.transferOwnership, {
    method: "POST",
    tenantId,
    body: transferTenantOwnershipInputSchema.parse(payload),
    dataSchema: transferTenantOwnershipDataSchema,
  });
}

export async function getMyTenantMemberships(): Promise<ApiSuccessEnvelope<TenantMineData>> {
  return getMyTenants();
}

export async function getMyTenantMembershipSummaries(): Promise<{
  items: TenantMembershipSummary[];
  traceId: string;
}> {
  const response = await getMyTenantMemberships();

  return {
    items: response.data.items.map((item) => tenantMembershipSummarySchema.parse(item)),
    traceId: response.traceId,
  };
}

export async function getMyTenantsNormalized(): Promise<{
  tenants: TenantSummary[];
  traceId: string;
}> {
  const response = await getMyTenants();
  return {
    tenants: normalizeTenantMine(response.data),
    traceId: response.traceId,
  };
}
