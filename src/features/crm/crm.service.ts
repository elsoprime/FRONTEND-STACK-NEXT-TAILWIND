import { tenantApiRequest } from "@/lib/api/client";
import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import {
  changeCrmOpportunityStageInputSchema,
  createCrmActivityInputSchema,
  createCrmContactInputSchema,
  createCrmOpportunityInputSchema,
  createCrmOrganizationInputSchema,
  crmActivityDataSchema,
  crmActivityListDataSchema,
  crmActivityListEnvelopeSchema,
  crmContactDataSchema,
  crmContactListDataSchema,
  crmContactListEnvelopeSchema,
  crmCountersDataSchema,
  crmIdInputSchema,
  crmOpportunityDataSchema,
  crmOpportunityListDataSchema,
  crmOpportunityListEnvelopeSchema,
  crmOrganizationDataSchema,
  crmOrganizationListDataSchema,
  crmOrganizationListEnvelopeSchema,
  listCrmActivitiesInputSchema,
  listCrmContactsInputSchema,
  listCrmOpportunitiesInputSchema,
  listCrmOrganizationsInputSchema,
  updateCrmContactInputSchema,
  updateCrmOpportunityInputSchema,
  updateCrmOrganizationInputSchema,
  type ChangeCrmOpportunityStageInput,
  type CreateCrmActivityInput,
  type CreateCrmContactInput,
  type CreateCrmOpportunityInput,
  type CreateCrmOrganizationInput,
  type CrmActivityData,
  type CrmActivityListEnvelope,
  type CrmContactData,
  type CrmContactListEnvelope,
  type CrmCountersData,
  type CrmOpportunityData,
  type CrmOpportunityListEnvelope,
  type CrmOrganizationData,
  type CrmOrganizationListEnvelope,
  type ListCrmActivitiesInput,
  type ListCrmContactsInput,
  type ListCrmOpportunitiesInput,
  type ListCrmOrganizationsInput,
  type UpdateCrmContactInput,
  type UpdateCrmOpportunityInput,
  type UpdateCrmOrganizationInput,
} from "@/features/crm/crm.schemas";

const CRM_ENDPOINTS = {
  contacts: "/api/v1/modules/crm/contacts",
  organizations: "/api/v1/modules/crm/organizations",
  opportunities: "/api/v1/modules/crm/opportunities",
  activities: "/api/v1/modules/crm/activities",
  counters: "/api/v1/modules/crm/counters",
} as const;

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
}

function contactByIdPath(contactId: string): string {
  return `${CRM_ENDPOINTS.contacts}/${crmIdInputSchema.parse(contactId)}`;
}

function organizationByIdPath(organizationId: string): string {
  return `${CRM_ENDPOINTS.organizations}/${crmIdInputSchema.parse(organizationId)}`;
}

function opportunityByIdPath(opportunityId: string): string {
  return `${CRM_ENDPOINTS.opportunities}/${crmIdInputSchema.parse(opportunityId)}`;
}

function opportunityStagePath(opportunityId: string): string {
  return `${opportunityByIdPath(opportunityId)}/stage`;
}

export async function listCrmContacts(
  tenantId: string,
  filters: ListCrmContactsInput = {},
): Promise<CrmContactListEnvelope> {
  const parsed = listCrmContactsInputSchema.parse(filters);

  const response = await tenantApiRequest(
    `${CRM_ENDPOINTS.contacts}${buildQueryString({
      page: parsed.page,
      limit: parsed.limit,
      search: parsed.search,
      organizationId: parsed.organizationId,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: crmContactListDataSchema,
    },
  );

  return crmContactListEnvelopeSchema.parse(response);
}

export async function createCrmContact(
  tenantId: string,
  payload: CreateCrmContactInput,
): Promise<ApiSuccessEnvelope<CrmContactData>> {
  return tenantApiRequest(CRM_ENDPOINTS.contacts, {
    method: "POST",
    tenantId,
    body: createCrmContactInputSchema.parse(payload),
    dataSchema: crmContactDataSchema,
  });
}

export async function getCrmContact(
  tenantId: string,
  contactId: string,
): Promise<ApiSuccessEnvelope<CrmContactData>> {
  return tenantApiRequest(contactByIdPath(contactId), {
    method: "GET",
    tenantId,
    dataSchema: crmContactDataSchema,
  });
}

export async function updateCrmContact(
  tenantId: string,
  contactId: string,
  payload: UpdateCrmContactInput,
): Promise<ApiSuccessEnvelope<CrmContactData>> {
  return tenantApiRequest(contactByIdPath(contactId), {
    method: "PATCH",
    tenantId,
    body: updateCrmContactInputSchema.parse(payload),
    dataSchema: crmContactDataSchema,
  });
}

export async function deleteCrmContact(
  tenantId: string,
  contactId: string,
): Promise<ApiSuccessEnvelope<CrmContactData>> {
  return tenantApiRequest(contactByIdPath(contactId), {
    method: "DELETE",
    tenantId,
    dataSchema: crmContactDataSchema,
  });
}

export async function listCrmOrganizations(
  tenantId: string,
  filters: ListCrmOrganizationsInput = {},
): Promise<CrmOrganizationListEnvelope> {
  const parsed = listCrmOrganizationsInputSchema.parse(filters);

  const response = await tenantApiRequest(
    `${CRM_ENDPOINTS.organizations}${buildQueryString({
      page: parsed.page,
      limit: parsed.limit,
      search: parsed.search,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: crmOrganizationListDataSchema,
    },
  );

  return crmOrganizationListEnvelopeSchema.parse(response);
}

export async function createCrmOrganization(
  tenantId: string,
  payload: CreateCrmOrganizationInput,
): Promise<ApiSuccessEnvelope<CrmOrganizationData>> {
  return tenantApiRequest(CRM_ENDPOINTS.organizations, {
    method: "POST",
    tenantId,
    body: createCrmOrganizationInputSchema.parse(payload),
    dataSchema: crmOrganizationDataSchema,
  });
}

export async function getCrmOrganization(
  tenantId: string,
  organizationId: string,
): Promise<ApiSuccessEnvelope<CrmOrganizationData>> {
  return tenantApiRequest(organizationByIdPath(organizationId), {
    method: "GET",
    tenantId,
    dataSchema: crmOrganizationDataSchema,
  });
}

export async function updateCrmOrganization(
  tenantId: string,
  organizationId: string,
  payload: UpdateCrmOrganizationInput,
): Promise<ApiSuccessEnvelope<CrmOrganizationData>> {
  return tenantApiRequest(organizationByIdPath(organizationId), {
    method: "PATCH",
    tenantId,
    body: updateCrmOrganizationInputSchema.parse(payload),
    dataSchema: crmOrganizationDataSchema,
  });
}

export async function deleteCrmOrganization(
  tenantId: string,
  organizationId: string,
): Promise<ApiSuccessEnvelope<CrmOrganizationData>> {
  return tenantApiRequest(organizationByIdPath(organizationId), {
    method: "DELETE",
    tenantId,
    dataSchema: crmOrganizationDataSchema,
  });
}

export async function listCrmOpportunities(
  tenantId: string,
  filters: ListCrmOpportunitiesInput = {},
): Promise<CrmOpportunityListEnvelope> {
  const parsed = listCrmOpportunitiesInputSchema.parse(filters);

  const response = await tenantApiRequest(
    `${CRM_ENDPOINTS.opportunities}${buildQueryString({
      page: parsed.page,
      limit: parsed.limit,
      search: parsed.search,
      stage: parsed.stage,
      contactId: parsed.contactId,
      organizationId: parsed.organizationId,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: crmOpportunityListDataSchema,
    },
  );

  return crmOpportunityListEnvelopeSchema.parse(response);
}

export async function createCrmOpportunity(
  tenantId: string,
  payload: CreateCrmOpportunityInput,
): Promise<ApiSuccessEnvelope<CrmOpportunityData>> {
  return tenantApiRequest(CRM_ENDPOINTS.opportunities, {
    method: "POST",
    tenantId,
    body: createCrmOpportunityInputSchema.parse(payload),
    dataSchema: crmOpportunityDataSchema,
  });
}

export async function getCrmOpportunity(
  tenantId: string,
  opportunityId: string,
): Promise<ApiSuccessEnvelope<CrmOpportunityData>> {
  return tenantApiRequest(opportunityByIdPath(opportunityId), {
    method: "GET",
    tenantId,
    dataSchema: crmOpportunityDataSchema,
  });
}

export async function updateCrmOpportunity(
  tenantId: string,
  opportunityId: string,
  payload: UpdateCrmOpportunityInput,
): Promise<ApiSuccessEnvelope<CrmOpportunityData>> {
  return tenantApiRequest(opportunityByIdPath(opportunityId), {
    method: "PATCH",
    tenantId,
    body: updateCrmOpportunityInputSchema.parse(payload),
    dataSchema: crmOpportunityDataSchema,
  });
}

export async function deleteCrmOpportunity(
  tenantId: string,
  opportunityId: string,
): Promise<ApiSuccessEnvelope<CrmOpportunityData>> {
  return tenantApiRequest(opportunityByIdPath(opportunityId), {
    method: "DELETE",
    tenantId,
    dataSchema: crmOpportunityDataSchema,
  });
}

export async function changeCrmOpportunityStage(
  tenantId: string,
  opportunityId: string,
  payload: ChangeCrmOpportunityStageInput,
): Promise<ApiSuccessEnvelope<CrmOpportunityData>> {
  return tenantApiRequest(opportunityStagePath(opportunityId), {
    method: "PATCH",
    tenantId,
    body: changeCrmOpportunityStageInputSchema.parse(payload),
    dataSchema: crmOpportunityDataSchema,
  });
}

export async function listCrmActivities(
  tenantId: string,
  filters: ListCrmActivitiesInput = {},
): Promise<CrmActivityListEnvelope> {
  const parsed = listCrmActivitiesInputSchema.parse(filters);

  const response = await tenantApiRequest(
    `${CRM_ENDPOINTS.activities}${buildQueryString({
      page: parsed.page,
      limit: parsed.limit,
      search: parsed.search,
      contactId: parsed.contactId,
      organizationId: parsed.organizationId,
      opportunityId: parsed.opportunityId,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: crmActivityListDataSchema,
    },
  );

  return crmActivityListEnvelopeSchema.parse(response);
}

export async function createCrmActivity(
  tenantId: string,
  payload: CreateCrmActivityInput,
): Promise<ApiSuccessEnvelope<CrmActivityData>> {
  return tenantApiRequest(CRM_ENDPOINTS.activities, {
    method: "POST",
    tenantId,
    body: createCrmActivityInputSchema.parse(payload),
    dataSchema: crmActivityDataSchema,
  });
}

export async function getCrmCounters(
  tenantId: string,
): Promise<ApiSuccessEnvelope<CrmCountersData>> {
  return tenantApiRequest(CRM_ENDPOINTS.counters, {
    method: "GET",
    tenantId,
    dataSchema: crmCountersDataSchema,
  });
}
