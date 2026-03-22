"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Download, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { resolveExpensesErrorMessage } from "@/features/expenses/error-code-map";
import {
  downloadExpenseBulkExportCsv,
  toExpenseBulkFeedbackItems,
  toExpenseBulkFeedbackStatus,
  toExpenseBulkSummary,
} from "@/modules/expenses/components/bulk/expense-bulk-utils";
import { ExpenseActionFeedback } from "@/modules/expenses/components/shared/ExpenseActionFeedback";

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
      map.set(request.id, `${request.requestNumber} - ${request.title}`);
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
    <section className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/8 text-primary">
              Bulk actions
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/80 bg-background/80">
              {selectedRequestIds.length} seleccionadas
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Ejecuta aprobacion, rechazo, pago o exportacion sobre la seleccion actual sin abandonar la queue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="toolbar"
            disabled={isPending || selectedRequestIds.length === 0}
            onClick={() => runBulkMutation.mutate("approve")}
          >
            <ShieldCheck className="size-4" />
            Aprobar
          </Button>
          <Button
            type="button"
            variant="toolbar"
            disabled={isPending || selectedRequestIds.length === 0}
            onClick={() => setConfirmReject(true)}
          >
            <XCircle className="size-4" />
            Rechazar
          </Button>
          <Button
            type="button"
            variant="toolbar"
            disabled={isPending || selectedRequestIds.length === 0}
            onClick={() => runBulkMutation.mutate("markPaid")}
          >
            <CheckCheck className="size-4" />
            Marcar pagadas
          </Button>
          <Button
            type="button"
            variant="toolbar"
            disabled={isPending || selectedRequestIds.length === 0}
            onClick={() => exportMutation.mutate()}
          >
            <Download className="size-4" />
            Exportar
          </Button>
        </div>
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
        cancelLabel="Cancelar"
        onConfirm={() => {
          setConfirmReject(false);
          runBulkMutation.mutate("reject");
        }}
        onCancel={() => setConfirmReject(false)}
        onOpenChange={setConfirmReject}
      />
    </section>
  );
}

