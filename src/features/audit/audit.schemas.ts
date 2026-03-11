import { z } from "zod";

export const auditSeveritySchema = z.enum(["info", "warning", "critical"]);
export const auditActorKindSchema = z.enum(["user", "system", "unknown"]);

const auditActorUserSchema = z
  .object({
    kind: z.literal("user"),
    userId: z.string(),
    sessionId: z.string().optional(),
    scope: z.array(z.string()),
  })
  .passthrough();

const auditActorSystemSchema = z
  .object({
    kind: z.literal("system"),
    systemId: z.string(),
    label: z.string(),
  })
  .passthrough();

const auditActorUnknownSchema = z
  .object({
    kind: z.literal("unknown"),
    reason: z.enum(["http_unauthenticated", "external_unresolved", "internal_unresolved"]),
  })
  .passthrough();

export const auditActorSchema = z.discriminatedUnion("kind", [
  auditActorUserSchema,
  auditActorSystemSchema,
  auditActorUnknownSchema,
]);

export const auditTenantScopeSchema = z
  .object({
    tenantId: z.string(),
    membershipId: z.string().optional(),
    roleKey: z.string().optional(),
    isOwner: z.boolean().optional(),
    effectiveRoleKeys: z.array(z.string()).optional(),
  })
  .passthrough();

export const auditResourceSchema = z
  .object({
    type: z.string(),
    id: z.string().optional(),
    label: z.string().optional(),
  })
  .passthrough();

export const auditChangesSchema = z
  .object({
    before: z.record(z.string(), z.unknown()).nullable().optional(),
    after: z.record(z.string(), z.unknown()).nullable().optional(),
    fields: z.array(z.string()).optional(),
  })
  .passthrough();

export const auditLogSchema = z
  .object({
    id: z.string(),
    scope: z.enum(["platform", "tenant"]),
    traceId: z.string(),
    actor: auditActorSchema,
    tenant: auditTenantScopeSchema.optional(),
    action: z.string(),
    resource: auditResourceSchema,
    severity: auditSeveritySchema,
    changes: auditChangesSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.string(),
  })
  .passthrough();

export type AuditLog = z.infer<typeof auditLogSchema>;

export const auditListDataSchema = z
  .object({
    items: z.array(auditLogSchema),
  })
  .passthrough();

export type AuditListData = z.infer<typeof auditListDataSchema>;

export const auditPaginationSchema = z
  .object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .passthrough();

export type AuditPagination = z.infer<typeof auditPaginationSchema>;

export const auditListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: auditListDataSchema,
  pagination: auditPaginationSchema,
  traceId: z.string(),
});

export type AuditListEnvelope = z.infer<typeof auditListEnvelopeSchema>;

const isoDateTimeStringSchema = z.string().datetime({ offset: true });

export const listAuditLogsInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  action: z.string().trim().min(1).optional(),
  resourceType: z.string().trim().min(1).optional(),
  severity: auditSeveritySchema.optional(),
  actorKind: auditActorKindSchema.optional(),
  from: isoDateTimeStringSchema.optional(),
  to: isoDateTimeStringSchema.optional(),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsInputSchema>;
