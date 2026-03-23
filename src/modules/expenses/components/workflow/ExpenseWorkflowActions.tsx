"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  CornerDownLeft,
  HandCoins,
  Send,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecisionDialog } from "@/components/ui/decision-dialog";
import { Input } from "@/components/ui/input";
import { ApiRequestError } from "@/lib/api/client";
import {
  approveRequest,
  cancelRequest,
  markPaidRequest,
  rejectRequest,
  reviewRequest,
  submitRequest,
} from "@/lib/api/expenses.client";
import { type ExpenseRequest } from "@/lib/api/expenses.types";
import { cn } from "@/lib/utils";
import { useExpensesStore } from "@/modules/expenses/state/expenses.store";
import { getExpenseStatusMeta } from "./ExpenseWorkflowStateCard";

type WorkflowAction = "submit" | "review" | "approve" | "reject" | "cancel" | "markPaid";

const WORKFLOW_ACTIONS_BY_STATUS: Record<ExpenseRequest["status"], readonly WorkflowAction[]> = {
  draft: ["submit", "cancel"],
  submitted: ["review", "approve", "reject", "cancel"],
  returned: ["submit", "cancel"],
  approved: ["markPaid"],
  rejected: [],
  paid: [],
  canceled: [],
} as const;

export function ExpenseWorkflowActions({
  tenantId,
  request,
}: {
  tenantId: string;
  request: ExpenseRequest;
}) {
  const queryClient = useQueryClient();
  const draft = useExpensesStore((state) => state.workflowDraft);
  const updateWorkflowDraft = useExpensesStore((state) => state.updateWorkflowDraft);
  const resetWorkflowDraft = useExpensesStore((state) => state.resetWorkflowDraft);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [decisionAction, setDecisionAction] = useState<WorkflowAction | null>(null);

  const mutation = useMutation({
    mutationFn: async (action: WorkflowAction) => {
      switch (action) {
        case "submit":
          return submitRequest(tenantId, request.id);
        case "review": {
          const comment = draft.reviewComment.trim();
          if (!comment) {
            throw new Error("Debes ingresar un comentario para devolver la solicitud.");
          }
          return reviewRequest(tenantId, request.id, { comment });
        }
        case "approve":
          return approveRequest(tenantId, request.id);
        case "reject": {
          const reasonCode = draft.rejectionReasonCode.trim();
          if (!reasonCode) {
            throw new Error("Debes indicar un codigo de rechazo.");
          }

          const comment = draft.rejectionComment.trim();
          return rejectRequest(tenantId, request.id, {
            reasonCode,
            comment: comment.length > 0 ? comment : undefined,
          });
        }
        case "cancel": {
          const reason = draft.cancelReason.trim();
          return cancelRequest(tenantId, request.id, {
            reason: reason.length > 0 ? reason : undefined,
          });
        }
        case "markPaid": {
          const paymentReference = draft.paymentReference.trim();
          return markPaidRequest(tenantId, request.id, {
            paymentReference: paymentReference.length > 0 ? paymentReference : undefined,
          });
        }
      }
    },
    onSuccess: async (_request, action) => {
      const feedbackByAction: Record<WorkflowAction, string> = {
        submit: "Solicitud enviada. Ahora la veras en la pestaña Aprobaciones.",
        review: "Solicitud devuelta al solicitante para correccion.",
        approve: "Solicitud aprobada. Ahora la veras en la pestaña Pagos.",
        reject: "Solicitud rechazada y cerrada en el workflow.",
        cancel: "Solicitud cancelada correctamente.",
        markPaid: "Solicitud marcada como pagada y conciliada.",
      };

      setFeedbackMessage(feedbackByAction[action]);
      resetWorkflowDraft();
      await queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "expenses"] });
    },
    onError: (error: unknown) => {
      setFeedbackMessage(
        error instanceof ApiRequestError || error instanceof Error
          ? error.message
          : "No fue posible ejecutar la accion de workflow.",
      );
    },
  });

  const availableActions = WORKFLOW_ACTIONS_BY_STATUS[request.status];
  const statusMeta = getExpenseStatusMeta(request.status);

  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Acciones workflow
          </p>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Operacion disponible para {statusMeta.label.toLowerCase()}
          </h3>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Las acciones se limitan al estado actual de la solicitud y al contrato del cliente API
            existente.
          </p>
        </div>
        <div className="rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          Workflow
        </div>
      </div>

      {availableActions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-border/80 bg-background/72 p-4 text-sm text-muted-foreground">
          No hay acciones disponibles para este estado.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {availableActions.includes("submit") ? (
            <WorkflowActionBlock
              title="Enviar a revision"
              description="Mueve la solicitud desde borrador o devuelta hacia la cola operativa."
              icon={Send}
              buttonLabel={mutation.isPending ? "Enviando..." : "Enviar solicitud"}
              buttonVariant="primary"
              onAction={() => setDecisionAction("submit")}
              disabled={mutation.isPending}
            />
          ) : null}

          {availableActions.includes("review") ? (
            <WorkflowActionBlock
              title="Devolver con comentario"
              description="La solicitud vuelve al solicitante para correccion."
              icon={CornerDownLeft}
              buttonLabel={mutation.isPending ? "Devolviendo..." : "Devolver solicitud"}
              buttonVariant="outline"
              onAction={() => setDecisionAction("review")}
              disabled={mutation.isPending || draft.reviewComment.trim().length === 0}
            >
              <textarea
                className={TEXTAREA_CLASSNAME}
                placeholder="Escribe el comentario de devolucion"
                value={draft.reviewComment}
                onChange={(event) => updateWorkflowDraft({ reviewComment: event.target.value })}
              />
            </WorkflowActionBlock>
          ) : null}

          {availableActions.includes("approve") ? (
            <WorkflowActionBlock
              title="Aprobar solicitud"
              description="Confirma la aprobacion operativa de la solicitud actual."
              icon={CheckCircle2}
              buttonLabel={mutation.isPending ? "Aprobando..." : "Aprobar solicitud"}
              buttonVariant="secondary"
              onAction={() => setDecisionAction("approve")}
              disabled={mutation.isPending}
            />
          ) : null}

          {availableActions.includes("reject") ? (
            <WorkflowActionBlock
              title="Rechazar solicitud"
              description="Registra el motivo de rechazo y el comentario opcional."
              icon={TriangleAlert}
              buttonLabel={mutation.isPending ? "Rechazando..." : "Rechazar solicitud"}
              buttonVariant="destructive"
              onAction={() => setDecisionAction("reject")}
              disabled={mutation.isPending || draft.rejectionReasonCode.trim().length === 0}
            >
              <div className="space-y-3">
                <Input
                  value={draft.rejectionReasonCode}
                  onChange={(event) =>
                    updateWorkflowDraft({ rejectionReasonCode: event.target.value })
                  }
                  placeholder="Codigo de rechazo"
                />
                <textarea
                  className={TEXTAREA_CLASSNAME}
                  placeholder="Comentario opcional para el rechazo"
                  value={draft.rejectionComment}
                  onChange={(event) =>
                    updateWorkflowDraft({ rejectionComment: event.target.value })
                  }
                />
              </div>
            </WorkflowActionBlock>
          ) : null}

          {availableActions.includes("cancel") ? (
            <WorkflowActionBlock
              title="Cancelar solicitud"
              description="Cierra la solicitud antes de que continue su flujo."
              icon={Ban}
              buttonLabel={mutation.isPending ? "Cancelando..." : "Cancelar solicitud"}
              buttonVariant="outline"
              onAction={() => setDecisionAction("cancel")}
              disabled={mutation.isPending}
            >
              <textarea
                className={TEXTAREA_CLASSNAME}
                placeholder="Motivo opcional de cancelacion"
                value={draft.cancelReason}
                onChange={(event) => updateWorkflowDraft({ cancelReason: event.target.value })}
              />
            </WorkflowActionBlock>
          ) : null}

          {availableActions.includes("markPaid") ? (
            <WorkflowActionBlock
              title="Marcar como pagada"
              description="Registra la conciliacion del pago asociado."
              icon={HandCoins}
              buttonLabel={mutation.isPending ? "Marcando..." : "Marcar pagada"}
              buttonVariant="primary"
              onAction={() => setDecisionAction("markPaid")}
              disabled={mutation.isPending}
            >
              <Input
                value={draft.paymentReference}
                onChange={(event) => updateWorkflowDraft({ paymentReference: event.target.value })}
                placeholder="Referencia de pago opcional"
              />
            </WorkflowActionBlock>
          ) : null}
        </div>
      )}

      {feedbackMessage ? (
        <div
          className={cn(
            "mt-4 rounded-2xl border px-4 py-3 text-sm",
            mutation.isError
              ? "border-red-300/80 bg-red-100/70 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200"
              : "border-emerald-300/40 bg-emerald-100/70 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100",
          )}
        >
          {feedbackMessage}
        </div>
      ) : null}

      <DecisionDialog
        open={decisionAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDecisionAction(null);
          }
        }}
        title={resolveDecisionTitle(decisionAction)}
        description={resolveDecisionDescription(decisionAction)}
        confirmLabel={resolveDecisionConfirmLabel(decisionAction)}
        busyLabel="Procesando accion..."
        tone={decisionAction === "reject" || decisionAction === "cancel" ? "danger" : "default"}
        loading={mutation.isPending}
        onConfirm={async () => {
          if (!decisionAction) {
            return;
          }
          await mutation.mutateAsync(decisionAction);
          setDecisionAction(null);
        }}
        onCancel={() => setDecisionAction(null)}
      >
        {resolveDecisionHint(decisionAction)}
      </DecisionDialog>
    </article>
  );
}

const TEXTAREA_CLASSNAME =
  "min-h-24 w-full rounded-xl border border-border/80 bg-background/75 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/35";

type WorkflowActionBlockProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  buttonLabel: string;
  buttonVariant: "primary" | "secondary" | "outline" | "destructive";
  onAction: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
};

function WorkflowActionBlock({
  title,
  description,
  icon: Icon,
  buttonLabel,
  buttonVariant,
  onAction,
  disabled = false,
  children,
}: WorkflowActionBlockProps) {
  return (
    <section className="rounded-2xl border border-border/80 bg-background/70 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card/90 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant={buttonVariant} disabled={disabled} onClick={onAction}>
          {buttonLabel}
        </Button>
      </div>
    </section>
  );
}

function resolveDecisionTitle(action: WorkflowAction | null): string {
  switch (action) {
    case "submit":
      return "Confirmar envio de solicitud";
    case "review":
      return "Confirmar devolucion de solicitud";
    case "approve":
      return "Confirmar aprobacion de solicitud";
    case "reject":
      return "Confirmar rechazo de solicitud";
    case "cancel":
      return "Confirmar cancelacion de solicitud";
    case "markPaid":
      return "Confirmar marcacion de pago";
    default:
      return "Confirmar accion";
  }
}

function resolveDecisionDescription(action: WorkflowAction | null): string {
  switch (action) {
    case "submit":
      return "La solicitud pasara a la cola de aprobaciones del modulo.";
    case "review":
      return "La solicitud volvera al solicitante con el comentario registrado.";
    case "approve":
      return "La solicitud cambiara a aprobada y se movera a la pestaña Pagos.";
    case "reject":
      return "La solicitud se cerrara con estado rechazada.";
    case "cancel":
      return "La solicitud se cerrara con estado cancelada.";
    case "markPaid":
      return "La solicitud pasara a estado pagada con referencia de conciliacion.";
    default:
      return "Confirma para ejecutar la accion seleccionada.";
  }
}

function resolveDecisionConfirmLabel(action: WorkflowAction | null): string {
  switch (action) {
    case "submit":
      return "Si, enviar";
    case "review":
      return "Si, devolver";
    case "approve":
      return "Si, aprobar";
    case "reject":
      return "Si, rechazar";
    case "cancel":
      return "Si, cancelar";
    case "markPaid":
      return "Si, marcar pagada";
    default:
      return "Confirmar";
  }
}

function resolveDecisionHint(action: WorkflowAction | null): string {
  switch (action) {
    case "approve":
      return "Despues de aprobar, no la veras en Aprobaciones; quedara disponible en Pagos.";
    case "review":
      return "Asegurate de que el comentario sea claro para la correccion del solicitante.";
    case "reject":
      return "Esta accion debe respaldarse con un codigo de rechazo valido.";
    default:
      return "La accion quedara registrada en auditoria.";
  }
}
