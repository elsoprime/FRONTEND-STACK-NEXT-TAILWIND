import { downloadCsv } from "@/lib/export-csv";
import type { ExpenseBulkOperationResult, ExpenseExportRow } from "@/lib/api/expenses.types";
import type { ExpenseActionFeedbackItem, ExpenseActionFeedbackStatus } from "@/modules/expenses/components/shared/ExpenseActionFeedback";

export function toExpenseBulkFeedbackStatus(result: ExpenseBulkOperationResult): ExpenseActionFeedbackStatus {
  if (result.failed === 0) {
    return "success";
  }

  if (result.succeeded > 0) {
    return "partial";
  }

  return "error";
}

export function toExpenseBulkFeedbackItems(
  result: ExpenseBulkOperationResult,
  labelsById?: Map<string, string>,
): ExpenseActionFeedbackItem[] {
  return result.results.map((item) => ({
    id: item.id,
    label: labelsById?.get(item.id),
    success: item.success,
    code: item.code,
    message: item.message,
  }));
}

export function toExpenseBulkSummary(result: ExpenseBulkOperationResult) {
  return {
    processed: result.processed,
    succeeded: result.succeeded,
    failed: result.failed,
  };
}

export function downloadExpenseBulkExportCsv(rows: ExpenseExportRow[]): void {
  downloadCsv(
    "expenses-bulk-export.csv",
    [
      { label: "Solicitud", value: (row) => row.requestNumber },
      { label: "Estado", value: (row) => row.status },
      { label: "Categoria", value: (row) => row.categoryKey },
      { label: "Monto", value: (row) => row.amount },
      { label: "Moneda", value: (row) => row.currency },
      { label: "Fecha", value: (row) => row.expenseDate },
    ],
    rows,
  );
}

