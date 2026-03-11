import { z } from "zod";

const objectIdRegex = /^[a-f0-9]{24}$/i;

export const crmPaginationSchema = z
  .object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .passthrough();

export type CrmPagination = z.infer<typeof crmPaginationSchema>;

export const crmOpportunityStageSchema = z.enum([
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);

export type CrmOpportunityStage = z.infer<typeof crmOpportunityStageSchema>;

export const crmContactSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    organizationId: z.string().nullable(),
    isActive: z.boolean(),
  })
  .passthrough();

export type CrmContact = z.infer<typeof crmContactSchema>;

export const crmOrganizationSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    domain: z.string().nullable(),
    industry: z.string().nullable(),
    isActive: z.boolean(),
  })
  .passthrough();

export type CrmOrganization = z.infer<typeof crmOrganizationSchema>;

export const crmOpportunitySchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    stage: crmOpportunityStageSchema,
    amount: z.number().nullable(),
    currency: z.string().nullable(),
    contactId: z.string().nullable(),
    organizationId: z.string().nullable(),
    expectedCloseDate: z.string().nullable(),
    isActive: z.boolean(),
  })
  .passthrough();

export type CrmOpportunity = z.infer<typeof crmOpportunitySchema>;

export const crmActivitySchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    type: z.string(),
    note: z.string(),
    contactId: z.string().nullable(),
    organizationId: z.string().nullable(),
    opportunityId: z.string().nullable(),
    occurredAt: z.string(),
  })
  .passthrough();

export type CrmActivity = z.infer<typeof crmActivitySchema>;

export const crmCountersSchema = z
  .object({
    tenantId: z.string(),
    contactsActive: z.number().int().min(0),
    organizationsActive: z.number().int().min(0),
    opportunitiesOpen: z.number().int().min(0),
    opportunitiesWon: z.number().int().min(0),
    opportunitiesLost: z.number().int().min(0),
  })
  .passthrough();

export type CrmCounters = z.infer<typeof crmCountersSchema>;

export const crmContactDataSchema = z.object({ contact: crmContactSchema }).passthrough();
export const crmOrganizationDataSchema = z
  .object({ organization: crmOrganizationSchema })
  .passthrough();
export const crmOpportunityDataSchema = z
  .object({ opportunity: crmOpportunitySchema })
  .passthrough();
export const crmActivityDataSchema = z.object({ activity: crmActivitySchema }).passthrough();
export const crmCountersDataSchema = z.object({ counters: crmCountersSchema }).passthrough();

export type CrmContactData = z.infer<typeof crmContactDataSchema>;
export type CrmOrganizationData = z.infer<typeof crmOrganizationDataSchema>;
export type CrmOpportunityData = z.infer<typeof crmOpportunityDataSchema>;
export type CrmActivityData = z.infer<typeof crmActivityDataSchema>;
export type CrmCountersData = z.infer<typeof crmCountersDataSchema>;

export const crmContactListDataSchema = z.object({ items: z.array(crmContactSchema) }).passthrough();
export const crmOrganizationListDataSchema = z
  .object({ items: z.array(crmOrganizationSchema) })
  .passthrough();
export const crmOpportunityListDataSchema = z
  .object({ items: z.array(crmOpportunitySchema) })
  .passthrough();
export const crmActivityListDataSchema = z
  .object({ items: z.array(crmActivitySchema) })
  .passthrough();

export const crmContactListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: crmContactListDataSchema,
  pagination: crmPaginationSchema,
  traceId: z.string(),
});

export const crmOrganizationListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: crmOrganizationListDataSchema,
  pagination: crmPaginationSchema,
  traceId: z.string(),
});

export const crmOpportunityListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: crmOpportunityListDataSchema,
  pagination: crmPaginationSchema,
  traceId: z.string(),
});

export const crmActivityListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: crmActivityListDataSchema,
  pagination: crmPaginationSchema,
  traceId: z.string(),
});

export type CrmContactListEnvelope = z.infer<typeof crmContactListEnvelopeSchema>;
export type CrmOrganizationListEnvelope = z.infer<typeof crmOrganizationListEnvelopeSchema>;
export type CrmOpportunityListEnvelope = z.infer<typeof crmOpportunityListEnvelopeSchema>;
export type CrmActivityListEnvelope = z.infer<typeof crmActivityListEnvelopeSchema>;

const nullableEmailSchema = z.string().email().nullable();
const nullableObjectIdSchema = z.string().regex(objectIdRegex).nullable();

export const createCrmContactInputSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  email: nullableEmailSchema.optional(),
  phone: z.string().trim().min(1).max(40).nullable().optional(),
  organizationId: nullableObjectIdSchema.optional(),
});

export const updateCrmContactInputSchema = z
  .object({
    firstName: z.string().trim().min(1).max(120).optional(),
    lastName: z.string().trim().min(1).max(120).optional(),
    email: nullableEmailSchema.optional(),
    phone: z.string().trim().min(1).max(40).nullable().optional(),
    organizationId: nullableObjectIdSchema.optional(),
  })
  .refine(
    (v) =>
      v.firstName !== undefined ||
      v.lastName !== undefined ||
      v.email !== undefined ||
      v.phone !== undefined ||
      v.organizationId !== undefined,
    { message: "Debes enviar al menos un campo para actualizar el contacto." },
  );

export const createCrmOrganizationInputSchema = z.object({
  name: z.string().trim().min(1).max(180),
  domain: z.string().trim().min(1).max(200).nullable().optional(),
  industry: z.string().trim().min(1).max(120).nullable().optional(),
});

export const updateCrmOrganizationInputSchema = z
  .object({
    name: z.string().trim().min(1).max(180).optional(),
    domain: z.string().trim().min(1).max(200).nullable().optional(),
    industry: z.string().trim().min(1).max(120).nullable().optional(),
  })
  .refine((v) => v.name !== undefined || v.domain !== undefined || v.industry !== undefined, {
    message: "Debes enviar al menos un campo para actualizar la organizacion.",
  });

export const createCrmOpportunityInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1000).nullable().optional(),
  amount: z.number().min(0).nullable().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
  contactId: nullableObjectIdSchema.optional(),
  organizationId: nullableObjectIdSchema.optional(),
  expectedCloseDate: z.string().datetime({ offset: true }).nullable().optional(),
});

export const updateCrmOpportunityInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(1000).nullable().optional(),
    amount: z.number().min(0).nullable().optional(),
    currency: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
    contactId: nullableObjectIdSchema.optional(),
    organizationId: nullableObjectIdSchema.optional(),
    expectedCloseDate: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.amount !== undefined ||
      v.currency !== undefined ||
      v.contactId !== undefined ||
      v.organizationId !== undefined ||
      v.expectedCloseDate !== undefined,
    { message: "Debes enviar al menos un campo para actualizar la oportunidad." },
  );

export const changeCrmOpportunityStageInputSchema = z.object({
  stage: crmOpportunityStageSchema,
});

export const createCrmActivityInputSchema = z
  .object({
    type: z.string().trim().min(1).max(100),
    note: z.string().trim().min(1).max(1200),
    contactId: nullableObjectIdSchema.optional(),
    organizationId: nullableObjectIdSchema.optional(),
    opportunityId: nullableObjectIdSchema.optional(),
    occurredAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (v) =>
      (v.contactId !== undefined && v.contactId !== null) ||
      (v.organizationId !== undefined && v.organizationId !== null) ||
      (v.opportunityId !== undefined && v.opportunityId !== null),
    {
      message: "Debes asociar la actividad a contactId, organizationId u opportunityId.",
      path: ["contactId"],
    },
  );

export const crmIdInputSchema = z.string().trim().regex(objectIdRegex, "ID invalido");

export const listCrmContactsInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
  organizationId: z.string().trim().regex(objectIdRegex).optional(),
});

export const listCrmOrganizationsInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
});

export const listCrmOpportunitiesInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
  stage: crmOpportunityStageSchema.optional(),
  contactId: z.string().trim().regex(objectIdRegex).optional(),
  organizationId: z.string().trim().regex(objectIdRegex).optional(),
});

export const listCrmActivitiesInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
  contactId: z.string().trim().regex(objectIdRegex).optional(),
  organizationId: z.string().trim().regex(objectIdRegex).optional(),
  opportunityId: z.string().trim().regex(objectIdRegex).optional(),
});

export type CreateCrmContactInput = z.infer<typeof createCrmContactInputSchema>;
export type UpdateCrmContactInput = z.infer<typeof updateCrmContactInputSchema>;
export type CreateCrmOrganizationInput = z.infer<typeof createCrmOrganizationInputSchema>;
export type UpdateCrmOrganizationInput = z.infer<typeof updateCrmOrganizationInputSchema>;
export type CreateCrmOpportunityInput = z.infer<typeof createCrmOpportunityInputSchema>;
export type UpdateCrmOpportunityInput = z.infer<typeof updateCrmOpportunityInputSchema>;
export type ChangeCrmOpportunityStageInput = z.infer<typeof changeCrmOpportunityStageInputSchema>;
export type CreateCrmActivityInput = z.infer<typeof createCrmActivityInputSchema>;
export type ListCrmContactsInput = z.infer<typeof listCrmContactsInputSchema>;
export type ListCrmOrganizationsInput = z.infer<typeof listCrmOrganizationsInputSchema>;
export type ListCrmOpportunitiesInput = z.infer<typeof listCrmOpportunitiesInputSchema>;
export type ListCrmActivitiesInput = z.infer<typeof listCrmActivitiesInputSchema>;
