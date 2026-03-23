import type {
  BulkApproveExpenseRequestsInput,
  BulkExportExpenseRequestsInput,
  BulkMarkPaidExpenseRequestsInput,
  BulkRejectExpenseRequestsInput,
  CancelExpenseRequestInput,
  CreateExpenseAttachmentInput,
  CreateExpenseCategoryInput,
  CreateExpenseRequestInput,
  CreateExpenseUploadPresignInput,
  ExpenseAttachment,
  ExpenseAttachmentListResult,
  ExpenseBulkOperationItemResult,
  ExpenseBulkOperationResult,
  ExpenseCategory,
  ExpenseCategoryListResult,
  ExpenseDashboard,
  ExpenseDashboardAlert,
  ExpenseDashboardAvailableCategory,
  ExpenseDashboardCategoryBreakdown,
  ExpenseDashboardCurrencyTotals,
  ExpenseDashboardKpis,
  ExpenseDashboardTrendPoint,
  ExpenseExportRow,
  ExpenseRequest,
  ExpenseRequestListResult,
  ExpenseSettings,
  ExpenseSummary,
  ExpenseUploadPresign,
  MarkPaidExpenseRequestInput,
  RejectExpenseRequestInput,
  ReviewExpenseRequestInput,
  UpdateExpenseCategoryInput,
  UpdateExpenseRequestInput,
  UpdateExpenseSettingsInput,
} from "@/lib/api/expenses.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveLegacyTaxonomy(metadata: Record<string, unknown>): {
  categoryId: string | null;
  subcategoryId: string | null;
  subcategoryKey: string | null;
} {
  const raw = metadata.taxonomy;
  if (!isRecord(raw)) {
    return { categoryId: null, subcategoryId: null, subcategoryKey: null };
  }

  return {
    categoryId: toNullableString(raw.categoryId),
    subcategoryId: toNullableString(raw.subcategoryId),
    subcategoryKey: toNullableString(raw.subcategoryKey),
  };
}

export function mapExpenseRequest(value: unknown): ExpenseRequest {
  if (!isRecord(value)) {
    throw new Error("Invalid expense request payload");
  }

  const metadata = isRecord(value.metadata) ? value.metadata : {};
  const taxonomy = resolveLegacyTaxonomy(metadata);

  return {
    id: String(value.id),
    tenantId: String(value.tenantId),
    requestNumber: String(value.requestNumber),
    requesterUserId: String(value.requesterUserId),
    submittedByUserId: toNullableString(value.submittedByUserId),
    reviewedByUserId: toNullableString(value.reviewedByUserId),
    approvedByUserId: toNullableString(value.approvedByUserId),
    rejectedByUserId: toNullableString(value.rejectedByUserId),
    canceledByUserId: toNullableString(value.canceledByUserId),
    paidByUserId: toNullableString(value.paidByUserId),
    title: String(value.title),
    description: value.description === null || typeof value.description === "string" ? value.description : null,
    categoryKey: String(value.categoryKey),
    categoryId: toNullableString(value.categoryId) ?? taxonomy.categoryId,
    subcategoryId: toNullableString(value.subcategoryId) ?? taxonomy.subcategoryId,
    subcategoryKey: toNullableString(value.subcategoryKey) ?? taxonomy.subcategoryKey,
    amount: Number(value.amount),
    currency: String(value.currency),
    expenseDate: String(value.expenseDate),
    status: String(value.status) as ExpenseRequest["status"],
    submittedAt: value.submittedAt === null || typeof value.submittedAt === "string" ? value.submittedAt : null,
    approvedAt: value.approvedAt === null || typeof value.approvedAt === "string" ? value.approvedAt : null,
    paidAt: value.paidAt === null || typeof value.paidAt === "string" ? value.paidAt : null,
    canceledAt: value.canceledAt === null || typeof value.canceledAt === "string" ? value.canceledAt : null,
    rejectionReasonCode:
      value.rejectionReasonCode === null || typeof value.rejectionReasonCode === "string"
        ? value.rejectionReasonCode
        : null,
    paymentReference:
      value.paymentReference === null || typeof value.paymentReference === "string"
        ? value.paymentReference
        : null,
    metadata,
    createdAt: String(value.createdAt),
    updatedAt: String(value.updatedAt),
  };
}

export function mapExpenseAttachment(value: unknown): ExpenseAttachment {
  if (!isRecord(value)) {
    throw new Error("Invalid expense attachment payload");
  }

  return {
    id: String(value.id),
    tenantId: String(value.tenantId),
    expenseRequestId: String(value.expenseRequestId),
    storageProvider: String(value.storageProvider),
    objectKey: String(value.objectKey),
    originalFilename: String(value.originalFilename),
    mimeType: String(value.mimeType),
    sizeBytes: Number(value.sizeBytes),
    checksumSha256: String(value.checksumSha256),
    uploadedByUserId: String(value.uploadedByUserId),
    isActive: Boolean(value.isActive),
    createdAt: String(value.createdAt),
    updatedAt: String(value.updatedAt),
  };
}

export function mapExpenseUploadPresign(value: unknown): ExpenseUploadPresign {
  if (!isRecord(value)) {
    throw new Error("Invalid expense upload presign payload");
  }

  return {
    storageProvider: String(value.storageProvider),
    objectKey: String(value.objectKey),
    uploadUrl: String(value.uploadUrl),
    method: "PUT",
    requiredHeaders: isRecord(value.requiredHeaders)
      ? Object.fromEntries(Object.entries(value.requiredHeaders).map(([key, raw]) => [key, String(raw)]))
      : {},
    expiresInSeconds: Number(value.expiresInSeconds),
  };
}

export function mapExpenseBulkOperationItemResult(value: unknown): ExpenseBulkOperationItemResult {
  if (!isRecord(value)) {
    throw new Error("Invalid expense bulk result item payload");
  }

  return {
    id: String(value.id),
    success: Boolean(value.success),
    code: typeof value.code === "string" ? value.code : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
  };
}

export function mapExpenseBulkOperationResult(value: unknown): ExpenseBulkOperationResult {
  if (!isRecord(value)) {
    throw new Error("Invalid expense bulk result payload");
  }

  return {
    processed: Number(value.processed),
    succeeded: Number(value.succeeded),
    failed: Number(value.failed),
    results: Array.isArray(value.results) ? value.results.map(mapExpenseBulkOperationItemResult) : [],
  };
}

export function mapExpenseSummary(value: unknown): ExpenseSummary {
  if (!isRecord(value) || !isRecord(value.counters)) {
    throw new Error("Invalid expense summary payload");
  }

  return {
    counters: {
      total: Number(value.counters.total),
      draft: Number(value.counters.draft),
      submitted: Number(value.counters.submitted),
      returned: Number(value.counters.returned),
      approved: Number(value.counters.approved),
      rejected: Number(value.counters.rejected),
      paid: Number(value.counters.paid),
      canceled: Number(value.counters.canceled),
    },
    totalRequestedAmount: Number(value.totalRequestedAmount),
    totalApprovedAmount: Number(value.totalApprovedAmount),
    totalPaidAmount: Number(value.totalPaidAmount),
  };
}

function mapExpenseDashboardKpis(value: unknown): ExpenseDashboardKpis {
  if (!isRecord(value)) {
    throw new Error("Invalid expense dashboard KPI payload");
  }

  return {
    totalRequests: Number(value.totalRequests),
    pendingRequests: Number(value.pendingRequests),
    approvedRequests: Number(value.approvedRequests),
    rejectedRequests: Number(value.rejectedRequests),
    totalAmount: Number(value.totalAmount),
    pendingAmount: Number(value.pendingAmount),
  };
}

function mapExpenseDashboardTrendPoint(value: unknown): ExpenseDashboardTrendPoint {
  if (!isRecord(value)) {
    throw new Error("Invalid expense dashboard trend payload");
  }

  return {
    day: String(value.day),
    requested: Number(value.requested),
    approved: Number(value.approved),
    rejected: Number(value.rejected),
  };
}

function mapExpenseDashboardCategoryBreakdown(value: unknown): ExpenseDashboardCategoryBreakdown {
  if (!isRecord(value)) {
    throw new Error("Invalid expense dashboard category payload");
  }

  return {
    categoryKey: String(value.categoryKey),
    label: String(value.label),
    totalAmount: Number(value.totalAmount),
    requests: Number(value.requests),
  };
}

function mapExpenseDashboardAlert(value: unknown): ExpenseDashboardAlert {
  if (!isRecord(value)) {
    throw new Error("Invalid expense dashboard alert payload");
  }

  return {
    id: String(value.id),
    severity: String(value.severity) as ExpenseDashboardAlert["severity"],
    title: String(value.title),
    description: String(value.description),
  };
}

function mapExpenseDashboardAvailableCategory(value: unknown): ExpenseDashboardAvailableCategory {
  if (!isRecord(value)) {
    throw new Error("Invalid expense dashboard available category payload");
  }

  return {
    key: String(value.key),
    name: String(value.name),
  };
}

function mapExpenseDashboardCurrencyTotals(value: unknown): ExpenseDashboardCurrencyTotals {
  if (!isRecord(value)) {
    throw new Error("Invalid expense dashboard currency totals payload");
  }

  return {
    currency: String(value.currency),
    requestCount: Number(value.requestCount),
    totalAmount: Number(value.totalAmount),
    pendingAmount: Number(value.pendingAmount),
    approvedAmount: Number(value.approvedAmount),
    paidAmount: Number(value.paidAmount),
  };
}

export function mapExpenseDashboard(value: unknown): ExpenseDashboard {
  if (!isRecord(value) || !isRecord(value.filters)) {
    throw new Error("Invalid expense dashboard payload");
  }

  return {
    filters: {
      dateWindowDays: Number(value.filters.dateWindowDays) as ExpenseDashboard["filters"]["dateWindowDays"],
      status:
        value.filters.status === null || typeof value.filters.status === "string"
          ? (value.filters.status as ExpenseDashboard["filters"]["status"])
          : null,
      categoryKey:
        value.filters.categoryKey === null || typeof value.filters.categoryKey === "string"
          ? value.filters.categoryKey
          : null,
    },
    primaryCurrency:
      value.primaryCurrency === null || typeof value.primaryCurrency === "string" ? value.primaryCurrency : null,
    hasMixedCurrencies: Boolean(value.hasMixedCurrencies),
    totalsByCurrency: Array.isArray(value.totalsByCurrency)
      ? value.totalsByCurrency.map(mapExpenseDashboardCurrencyTotals)
      : [],
    availableCategories: Array.isArray(value.availableCategories)
      ? value.availableCategories.map(mapExpenseDashboardAvailableCategory)
      : [],
    kpis: mapExpenseDashboardKpis(value.kpis),
    trends: Array.isArray(value.trends) ? value.trends.map(mapExpenseDashboardTrendPoint) : [],
    categories: Array.isArray(value.categories)
      ? value.categories.map(mapExpenseDashboardCategoryBreakdown)
      : [],
    alerts: Array.isArray(value.alerts) ? value.alerts.map(mapExpenseDashboardAlert) : [],
  };
}

export function mapExpenseRequestList(value: unknown): ExpenseRequestListResult {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.pagination)) {
    throw new Error("Invalid expense request list payload");
  }

  return {
    items: value.items.map(mapExpenseRequest),
    pagination: {
      page: Number(value.pagination.page),
      limit: Number(value.pagination.limit),
      total: Number(value.pagination.total),
      totalPages: Number(value.pagination.totalPages),
    },
  };
}

export function mapExpenseAttachmentList(value: unknown): ExpenseAttachmentListResult {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("Invalid expense attachment list payload");
  }

  return {
    items: value.items.map(mapExpenseAttachment),
  };
}

export function toCreateExpenseRequestBody(input: CreateExpenseRequestInput) {
  return input;
}

export function toUpdateExpenseRequestBody(input: UpdateExpenseRequestInput) {
  return input;
}

export function toReviewExpenseRequestBody(input: ReviewExpenseRequestInput) {
  return input;
}

export function toRejectExpenseRequestBody(input: RejectExpenseRequestInput) {
  return input;
}

export function toCancelExpenseRequestBody(input: CancelExpenseRequestInput) {
  return input;
}

export function toMarkPaidExpenseRequestBody(input: MarkPaidExpenseRequestInput) {
  return input;
}

export function toCreateExpenseUploadPresignBody(input: CreateExpenseUploadPresignInput) {
  return input;
}

export function toCreateExpenseAttachmentBody(input: CreateExpenseAttachmentInput) {
  return input;
}

export function toBulkApproveExpenseRequestsBody(input: BulkApproveExpenseRequestsInput) {
  return input;
}

export function toBulkRejectExpenseRequestsBody(input: BulkRejectExpenseRequestsInput) {
  return input;
}

export function toBulkMarkPaidExpenseRequestsBody(input: BulkMarkPaidExpenseRequestsInput) {
  return input;
}

export function toBulkExportExpenseRequestsBody(input: BulkExportExpenseRequestsInput) {
  return input;
}

export function mapExpenseExportRows(value: unknown): ExpenseExportRow[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid expense export rows payload");
  }

  return value.map((row) => {
    if (!isRecord(row)) {
      throw new Error("Invalid expense export row payload");
    }

    return {
      id: String(row.id),
      requestNumber: String(row.requestNumber),
      status: String(row.status) as ExpenseExportRow["status"],
      categoryKey: String(row.categoryKey),
      amount: Number(row.amount),
      currency: String(row.currency),
      expenseDate: String(row.expenseDate),
    };
  });
}

export function mapExpenseCategory(value: unknown): ExpenseCategory {
  if (!isRecord(value)) {
    throw new Error("Invalid expense category payload");
  }

  return {
    id: String(value.id),
    tenantId: String(value.tenantId),
    key: String(value.key),
    name: String(value.name),
    requiresAttachment: Boolean(value.requiresAttachment),
    isActive: Boolean(value.isActive),
    monthlyLimit:
      value.monthlyLimit === null || value.monthlyLimit === undefined ? null : Number(value.monthlyLimit),
    createdAt: String(value.createdAt),
    updatedAt: String(value.updatedAt),
  };
}

export function mapExpenseCategoryList(value: unknown): ExpenseCategoryListResult {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.pagination)) {
    throw new Error("Invalid expense category list payload");
  }

  return {
    items: value.items.map(mapExpenseCategory),
    pagination: {
      page: Number(value.pagination.page),
      limit: Number(value.pagination.limit),
      total: Number(value.pagination.total),
      totalPages: Number(value.pagination.totalPages),
    },
  };
}

export function mapExpenseSettings(value: unknown): ExpenseSettings {
  if (!isRecord(value) || !Array.isArray(value.allowedCurrencies)) {
    throw new Error("Invalid expense settings payload");
  }

  return {
    tenantId: String(value.tenantId),
    allowedCurrencies: value.allowedCurrencies.map((currency) => String(currency)),
    maxAmountWithoutReview: Number(value.maxAmountWithoutReview),
    approvalMode: String(value.approvalMode) as ExpenseSettings["approvalMode"],
    bulkMaxItemsPerOperation: Number(value.bulkMaxItemsPerOperation),
    exportsEnabled: Boolean(value.exportsEnabled),
    createdAt: String(value.createdAt),
    updatedAt: String(value.updatedAt),
  };
}

export function toCreateExpenseCategoryBody(input: CreateExpenseCategoryInput) {
  return input;
}

export function toUpdateExpenseCategoryBody(input: UpdateExpenseCategoryInput) {
  return input;
}

export function toUpdateExpenseSettingsBody(input: UpdateExpenseSettingsInput) {
  return input;
}
