import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";
import {
  mapExpenseAttachment,
  mapExpenseAttachmentList,
  mapExpenseCategory,
  mapExpenseCategoryList,
  mapExpenseBulkOperationResult,
  mapExpenseDashboard,
  mapExpenseExportRows,
  mapExpenseRequest,
  mapExpenseRequestList,
  mapExpenseSummary,
  mapExpenseSettings,
  mapExpenseUploadPresign,
  toBulkApproveExpenseRequestsBody,
  toBulkExportExpenseRequestsBody,
  toBulkMarkPaidExpenseRequestsBody,
  toBulkRejectExpenseRequestsBody,
  toCancelExpenseRequestBody,
  toCreateExpenseAttachmentBody,
  toCreateExpenseRequestBody,
  toCreateExpenseCategoryBody,
  toCreateExpenseUploadPresignBody,
  toMarkPaidExpenseRequestBody,
  toRejectExpenseRequestBody,
  toReviewExpenseRequestBody,
  toUpdateExpenseRequestBody,
  toUpdateExpenseCategoryBody,
  toUpdateExpenseSettingsBody,
} from "@/lib/api/expenses.mappers";
import type {
  BulkApproveExpenseRequestsInput,
  BulkExportExpenseRequestsInput,
  BulkMarkPaidExpenseRequestsInput,
  BulkRejectExpenseRequestsInput,
  CancelExpenseRequestInput,
  CreateExpenseAttachmentInput,
  CreateExpenseRequestInput,
  CreateExpenseCategoryInput,
  CreateExpenseUploadPresignInput,
  ExpenseAttachment,
  ExpenseAttachmentListResult,
  ExpenseCategory,
  ExpenseCategoryListQuery,
  ExpenseCategoryListResult,
  ExpenseBulkOperationResult,
  ExpenseDashboard,
  ExpenseDashboardQuery,
  ExpenseExportRow,
  ExpenseRequest,
  ExpenseRequestListQuery,
  ExpenseRequestListResult,
  ExpenseSummary,
  ExpenseSettings,
  ExpenseUploadPresign,
  MarkPaidExpenseRequestInput,
  RejectExpenseRequestInput,
  ReviewExpenseRequestInput,
  UpdateExpenseRequestInput,
  UpdateExpenseCategoryInput,
  UpdateExpenseSettingsInput,
} from "@/lib/api/expenses.types";

const EXPENSES_BASE = "/api/v1/modules/expenses";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asRecord(value: unknown, errorMessage: string): UnknownRecord {
  if (!isRecord(value)) {
    throw new Error(errorMessage);
  }
  return value;
}

function getEnvelopeData(response: ApiSuccessEnvelope<unknown>): UnknownRecord {
  return asRecord(response.data, "Unexpected expenses response data envelope");
}

function getEnvelopePagination(response: ApiSuccessEnvelope<unknown>): UnknownRecord {
  const root = response as unknown as UnknownRecord;
  return isRecord(root.pagination) ? root.pagination : {};
}

function buildRequestListQuery(params: ExpenseRequestListQuery = {}): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.status !== undefined) searchParams.set("status", params.status);
  if (params.categoryKey !== undefined) searchParams.set("categoryKey", params.categoryKey);
  if (params.search !== undefined) searchParams.set("search", params.search);

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
}
function buildCategoryListQuery(params: ExpenseCategoryListQuery = {}): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.search !== undefined) searchParams.set("search", params.search);
  if (params.includeInactive !== undefined) {
    searchParams.set("includeInactive", params.includeInactive ? "true" : "false");
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
}

function buildDashboardQuery(params: ExpenseDashboardQuery = {}): string {
  const searchParams = new URLSearchParams();

  if (params.dateWindowDays !== undefined) searchParams.set("dateWindowDays", String(params.dateWindowDays));
  if (params.status !== undefined) searchParams.set("status", params.status);
  if (params.categoryKey !== undefined) searchParams.set("categoryKey", params.categoryKey);

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function listQueue(
  tenantId: string,
  params: Pick<ExpenseRequestListQuery, "page" | "limit" | "status" | "search"> = {},
): Promise<ExpenseRequestListResult> {
  const response = await apiRequest(`${EXPENSES_BASE}/queue${buildRequestListQuery(params)}`, { tenantId });
  const data = getEnvelopeData(response);
  return mapExpenseRequestList({
    items: data.items,
    pagination: getEnvelopePagination(response),
  });
}

export async function getCounters(tenantId: string): Promise<ExpenseSummary["counters"]> {
  const response = await apiRequest(`${EXPENSES_BASE}/counters`, { tenantId });
  const data = getEnvelopeData(response);
  return mapExpenseSummary({
    counters: data.counters,
    totalRequestedAmount: 0,
    totalApprovedAmount: 0,
    totalPaidAmount: 0,
  }).counters;
}

export async function getSummary(tenantId: string): Promise<ExpenseSummary> {
  const response = await apiRequest(`${EXPENSES_BASE}/reports/summary`, { tenantId });
  const data = getEnvelopeData(response);
  return mapExpenseSummary(data.summary);
}

export async function getDashboard(
  tenantId: string,
  params: ExpenseDashboardQuery = {},
): Promise<ExpenseDashboard> {
  const response = await apiRequest(`${EXPENSES_BASE}/reports/dashboard${buildDashboardQuery(params)}`, {
    tenantId,
  });
  const data = getEnvelopeData(response);
  return mapExpenseDashboard(data.dashboard);
}

export async function listRequests(
  tenantId: string,
  params: ExpenseRequestListQuery = {},
): Promise<ExpenseRequestListResult> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests${buildRequestListQuery(params)}`, { tenantId });
  const data = getEnvelopeData(response);
  return mapExpenseRequestList({
    items: data.items,
    pagination: getEnvelopePagination(response),
  });
}

export async function getRequest(tenantId: string, requestId: string): Promise<ExpenseRequest> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}`, { tenantId });
  const data = getEnvelopeData(response);
  return mapExpenseRequest(data.request);
}

export async function createRequest(tenantId: string, input: CreateExpenseRequestInput): Promise<ExpenseRequest> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests`, {
    method: "POST",
    tenantId,
    body: toCreateExpenseRequestBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseRequest(data.request);
}

export async function updateRequest(
  tenantId: string,
  requestId: string,
  input: UpdateExpenseRequestInput,
): Promise<ExpenseRequest> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}`, {
    method: "PATCH",
    tenantId,
    body: toUpdateExpenseRequestBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseRequest(data.request);
}

export async function submitRequest(tenantId: string, requestId: string): Promise<ExpenseRequest> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}/submit`, {
    method: "POST",
    tenantId,
  });
  const data = getEnvelopeData(response);
  return mapExpenseRequest(data.request);
}

export async function reviewRequest(
  tenantId: string,
  requestId: string,
  input: ReviewExpenseRequestInput,
): Promise<ExpenseRequest> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}/review`, {
    method: "POST",
    tenantId,
    body: toReviewExpenseRequestBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseRequest(data.request);
}

export async function approveRequest(tenantId: string, requestId: string): Promise<ExpenseRequest> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}/approve`, {
    method: "POST",
    tenantId,
  });
  const data = getEnvelopeData(response);
  return mapExpenseRequest(data.request);
}

export async function rejectRequest(
  tenantId: string,
  requestId: string,
  input: RejectExpenseRequestInput,
): Promise<ExpenseRequest> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}/reject`, {
    method: "POST",
    tenantId,
    body: toRejectExpenseRequestBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseRequest(data.request);
}

export async function cancelRequest(
  tenantId: string,
  requestId: string,
  input: CancelExpenseRequestInput = {},
): Promise<ExpenseRequest> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}/cancel`, {
    method: "POST",
    tenantId,
    body: toCancelExpenseRequestBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseRequest(data.request);
}

export async function markPaidRequest(
  tenantId: string,
  requestId: string,
  input: MarkPaidExpenseRequestInput = {},
): Promise<ExpenseRequest> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}/mark-paid`, {
    method: "POST",
    tenantId,
    body: toMarkPaidExpenseRequestBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseRequest(data.request);
}

export async function createUploadPresign(
  tenantId: string,
  input: CreateExpenseUploadPresignInput,
): Promise<ExpenseUploadPresign> {
  const response = await apiRequest(`${EXPENSES_BASE}/uploads/presign`, {
    method: "POST",
    tenantId,
    body: toCreateExpenseUploadPresignBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseUploadPresign(data.upload);
}

export async function createAttachment(
  tenantId: string,
  requestId: string,
  input: CreateExpenseAttachmentInput,
): Promise<ExpenseAttachment> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}/attachments`, {
    method: "POST",
    tenantId,
    body: toCreateExpenseAttachmentBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseAttachment(data.attachment);
}

export async function listAttachments(tenantId: string, requestId: string): Promise<ExpenseAttachmentListResult> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}/attachments`, { tenantId });
  const data = getEnvelopeData(response);
  return mapExpenseAttachmentList({ items: data.items });
}

export async function deleteAttachment(
  tenantId: string,
  requestId: string,
  attachmentId: string,
): Promise<ExpenseAttachment> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/${requestId}/attachments/${attachmentId}`, {
    method: "DELETE",
    tenantId,
  });
  const data = getEnvelopeData(response);
  return mapExpenseAttachment(data.attachment);
}

export async function bulkApprove(
  tenantId: string,
  input: BulkApproveExpenseRequestsInput,
): Promise<ExpenseBulkOperationResult> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/bulk/approve`, {
    method: "POST",
    tenantId,
    body: toBulkApproveExpenseRequestsBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseBulkOperationResult(data.result);
}

export async function bulkReject(
  tenantId: string,
  input: BulkRejectExpenseRequestsInput,
): Promise<ExpenseBulkOperationResult> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/bulk/reject`, {
    method: "POST",
    tenantId,
    body: toBulkRejectExpenseRequestsBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseBulkOperationResult(data.result);
}

export async function bulkMarkPaid(
  tenantId: string,
  input: BulkMarkPaidExpenseRequestsInput,
): Promise<ExpenseBulkOperationResult> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/bulk/mark-paid`, {
    method: "POST",
    tenantId,
    body: toBulkMarkPaidExpenseRequestsBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseBulkOperationResult(data.result);
}

export async function bulkExport(
  tenantId: string,
  input: BulkExportExpenseRequestsInput,
): Promise<ExpenseExportRow[]> {
  const response = await apiRequest(`${EXPENSES_BASE}/requests/bulk/export`, {
    method: "POST",
    tenantId,
    body: toBulkExportExpenseRequestsBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseExportRows(data.rows);
}

export async function exportRequestsCsv(tenantId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${EXPENSES_BASE}/exports/requests.csv`, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    throw new Error(`CSV export failed with status ${response.status}`);
  }

  return response.text();
}

export async function listCategories(
  tenantId: string,
  params: ExpenseCategoryListQuery = {},
): Promise<ExpenseCategoryListResult> {
  const response = await apiRequest(`${EXPENSES_BASE}/categories${buildCategoryListQuery(params)}`, {
    tenantId,
  });
  const data = getEnvelopeData(response);
  return mapExpenseCategoryList({
    items: data.items,
    pagination: getEnvelopePagination(response),
  });
}

export async function createCategory(
  tenantId: string,
  input: CreateExpenseCategoryInput,
): Promise<ExpenseCategory> {
  const response = await apiRequest(`${EXPENSES_BASE}/categories`, {
    method: "POST",
    tenantId,
    body: toCreateExpenseCategoryBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseCategory(data.category);
}

export async function createCategoriesBulkGuided(
  tenantId: string,
  inputs: CreateExpenseCategoryInput[],
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ key: string; success: boolean; message?: string }>;
}> {
  let succeeded = 0;
  let failed = 0;
  const results: Array<{ key: string; success: boolean; message?: string }> = [];

  for (const input of inputs) {
    try {
      await createCategory(tenantId, input);
      succeeded += 1;
      results.push({ key: input.key, success: true });
    } catch (error) {
      failed += 1;
      results.push({
        key: input.key,
        success: false,
        message: error instanceof Error ? error.message : "Fallo de creacion",
      });
    }
  }

  return {
    processed: inputs.length,
    succeeded,
    failed,
    results,
  };
}

export async function updateCategory(
  tenantId: string,
  categoryId: string,
  input: UpdateExpenseCategoryInput,
): Promise<ExpenseCategory> {
  const response = await apiRequest(`${EXPENSES_BASE}/categories/${categoryId}`, {
    method: "PATCH",
    tenantId,
    body: toUpdateExpenseCategoryBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseCategory(data.category);
}

export async function getSettings(tenantId: string): Promise<ExpenseSettings> {
  const response = await apiRequest(`${EXPENSES_BASE}/settings`, { tenantId });
  const data = getEnvelopeData(response);
  return mapExpenseSettings(data.settings);
}

export async function updateSettings(
  tenantId: string,
  input: UpdateExpenseSettingsInput,
): Promise<ExpenseSettings> {
  const response = await apiRequest(`${EXPENSES_BASE}/settings`, {
    method: "PUT",
    tenantId,
    body: toUpdateExpenseSettingsBody(input),
  });
  const data = getEnvelopeData(response);
  return mapExpenseSettings(data.settings);
}


