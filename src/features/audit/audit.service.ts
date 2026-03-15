import { tenantApiRequest } from "@/lib/api/client";
import {
  auditListDataSchema,
  auditListEnvelopeSchema,
  listAuditLogsInputSchema,
  type AuditListEnvelope,
  type ListAuditLogsInput,
} from "@/features/audit/audit.schemas";

const AUDIT_LIST_ENDPOINT = "/api/v1/audit";

function buildAuditListPath(filters: ListAuditLogsInput): string {
  const params = new URLSearchParams();

  if (filters.page !== undefined) {
    params.set("page", String(filters.page));
  }

  if (filters.limit !== undefined) {
    params.set("limit", String(filters.limit));
  }

  if (filters.action) {
    params.set("action", filters.action);
  }

  if (filters.resourceType) {
    params.set("resourceType", filters.resourceType);
  }

  if (filters.severity) {
    params.set("severity", filters.severity);
  }

  if (filters.actorKind) {
    params.set("actorKind", filters.actorKind);
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `${AUDIT_LIST_ENDPOINT}?${queryString}` : AUDIT_LIST_ENDPOINT;
}

export async function listTenantAuditLogs(
  tenantId: string,
  filters: ListAuditLogsInput = {},
): Promise<AuditListEnvelope> {
  const validatedFilters = listAuditLogsInputSchema.parse(filters);

  const response = await tenantApiRequest(buildAuditListPath(validatedFilters), {
    method: "GET",
    tenantId,
    dataSchema: auditListDataSchema,
  });

  return auditListEnvelopeSchema.parse(response);
}
