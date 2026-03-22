"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Download, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecisionDialog } from "@/components/ui/decision-dialog";
import { ApiRequestError } from "@/lib/api/client";
import {
  bulkApprove,
  bulkExport,
  bulkMarkPaid,
  bulkReject,
} from "@/lib/api/expenses.client";
import type { ExpenseRequest } from "@/lib/api/expenses.types";
import {
  downloadExpenseBulkExportCsv,
  toExpenseBulkFeedbackItems,
  toExpenseBulkFeedbackStatus,
  toExpenseBulkSummary,
} from "@/modules/expenses/components/bulk/expense-bulk-utils";
import { ExpenseActionFeedback } from "@/modules/expenses/components/shared/ExpenseActionFeedback";
import { resolveExpensesErrorMessage } from "@/features/expenses/error-code-map";

type Props = {
  tenantId: string;
  requests: ExpenseRequest[];
  selectedRequestIds: string[];
  onCompleted?: () => void;
};

type FeedbackState = {
  status: "idle" | "success" | "partial" | "error";
  title: string;
  description?: string;
  traceId?: string | null;
  counts?: { processed: number; succeeded: number; failed: number };
  items?: ReturnType<typeof toExpenseBulkFeedbackItems>;
};

function selectedIdsOrThrow(selectedRequestIds: string[]): string[] {
  if (selectedRequestIds.length === 0) {
    throw new Error("Selecciona al menos una solicitud para ejecutar acciones bulk.");
  }

  return selectedRequestIds;
}

export function ExpenseBulkActionsPanel({
  tenantId,
  requests,
  selectedRequestIds,
  onCompleted,
}: Props) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const queryClient = useQueryClient();

  const labelsById = useMemo(() => {
    const map = new Map<string, string>();
    for (const request of requests) {
      map.set(request.id, `${request.requestNumber} · ${request.title}`);
    }
    return map;
  }, [requests]);

  const runBulkMutation = useMutation({
    mutationFn: async (action: "approve" | "reject" | "markPaid") => {
      const requestIds = selectedIdsOrThrow(selectedRequestIds);

      if (action === "approve") {
        return { action, result: await bulkApprove(tenantId, { requestIds }) };
      }

      if (action === "reject") {
        return {
          action,
          result: await bulkReject(tenantId, {
            requestIds,
            reasonCode: "bulk_rejected",
            comment: "Rechazo masivo desde interfaz",
          }),
        };
      }

      return {
        action,
        result: await bulkMarkPaid(tenantId, {
          requestIds,
          paymentReference: "bulk-ui",
        }),
      };
    },
    onSuccess: async ({ action, result }) => {
      const status = toExpenseBulkFeedbackStatus(result);
      setFeedback({
        status,
        title:
          action === "approve"
            ? "Aprobacion masiva completada"
            : action === "reject"
              ? "Rechazo masivo completado"
              : "Marcacion de pago masiva completada",
        description:
          status === "success"
            ? "Todas las solicitudes seleccionadas se procesaron correctamente."
            : "La operacion termino con resultados mixtos.",
        counts: toExpenseBulkSummary(result),
        items: toExpenseBulkFeedbackItems(result, labelsById),
      });

      await queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "expenses"] });
      onCompleted?.();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setFeedback({
          status: "error",
          title: "No se pudo ejecutar la accion masiva",
          description: resolveExpensesErrorMessage(error.code, error.message),
          traceId: error.traceId ?? null,
        });
        return;
      }

      setFeedback({
        status: "error",
        title: "No se pudo ejecutar la accion masiva",
        description: error instanceof Error ? error.message : "Error no controlado",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const requestIds = selectedIdsOrThrow(selectedRequestIds);
      return bulkExport(tenantId, { requestIds });
    },
    onSuccess: (rows) => {
      downloadExpenseBulkExportCsv(rows);
      setFeedback({
        status: "success",
        title: "Exportacion generada",
        description: `Se exportaron ${rows.length} filas en CSV.`,
      });
    },
    onError: (error: unknown) => {
      setFeedback({
        status: "error",
        title: "No se pudo exportar",
        description: error instanceof Error ? error.message : "Error no controlado",
      });
    },
  });

  const isPending = runBulkMutation.isPending || exportMutation.isPending;

  return (
    <section className="space-y-3 rounded-2xl border border-border/80 bg-background/70 p-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Bulk actions</p>
        <p className="text-sm text-foreground">
          {selectedRequestIds.length} seleccionadas
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          disabled={isPending || selectedRequestIds.length === 0}
          onClick={() => runBulkMutation.mutate("approve")}
        >
          <ShieldCheck className="size-4" /> Aprobar
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending || selectedRequestIds.length === 0}
          onClick={() => setConfirmReject(true)}
        >
          <XCircle className="size-4" /> Rechazar
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || selectedRequestIds.length === 0}
          onClick={() => runBulkMutation.mutate("markPaid")}
        >
          <CheckCheck className="size-4" /> Marcar pagadas
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || selectedRequestIds.length === 0}
          onClick={() => exportMutation.mutate()}
        >
          <Download className="size-4" /> Exportar
        </Button>
      </div>

      {feedback ? (
        <ExpenseActionFeedback
          title={feedback.title}
          description={feedback.description}
          status={feedback.status}
          traceId={feedback.traceId}
          counts={feedback.counts}
          items={feedback.items}
        />
      ) : null}

      <DecisionDialog
        open={confirmReject}
        title="Confirmar rechazo masivo"
        description="Se rechazaran las solicitudes seleccionadas. Esta accion quedara auditada."
        confirmLabel="Rechazar solicitudes"
        cancelLabel="Cancelar"        onConfirm={() => {
          setConfirmReject(false);
          runBulkMutation.mutate("reject");
        }}
        onCancel={() => setConfirmReject(false)}
        onOpenChange={setConfirmReject}
      />
    </section>
  );
}



