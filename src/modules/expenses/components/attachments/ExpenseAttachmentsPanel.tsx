"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DecisionDialog } from "@/components/ui/decision-dialog";
import { ExpenseActionFeedback, type ExpenseActionFeedbackItem } from "@/modules/expenses/components/shared/ExpenseActionFeedback";
import { computeSha256Hex, EXPENSE_ATTACHMENT_ACCEPT, resolveExpenseAttachmentMimeType, validateExpenseAttachmentFile } from "@/modules/expenses/components/attachments/expense-attachment-utils";
import { resolveExpensesErrorMessage } from "@/features/expenses/error-code-map";
import { ApiRequestError, apiRequest } from "@/lib/api/client";
import { listAttachments } from "@/lib/api/expenses.client";
import { mapExpenseAttachment, mapExpenseUploadPresign, toCreateExpenseAttachmentBody, toCreateExpenseUploadPresignBody } from "@/lib/api/expenses.mappers";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";
import type { ExpenseAttachment, ExpenseRequest } from "@/lib/api/expenses.types";

type AttachmentFeedbackState = {
  status: "idle" | "success" | "partial" | "error";
  title: string;
  description?: string;
  traceId?: string | null;
  counts?: { processed: number; succeeded: number; failed: number };
  items?: ExpenseActionFeedbackItem[];
};

type ExpenseAttachmentsPanelProps = {
  tenantId: string;
  requests: ExpenseRequest[];
  selectedRequestId: string | null;
  onSelectedRequestIdChange: (requestId: string) => void;
  className?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getEnvelopeData(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ExpenseAttachmentsPanel({
  tenantId,
  requests,
  selectedRequestId,
  onSelectedRequestIdChange,
  className,
}: ExpenseAttachmentsPanelProps) {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<AttachmentFeedbackState | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<ExpenseAttachment | null>(null);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) ?? requests[0] ?? null,
    [requests, selectedRequestId],
  );

  const attachmentsQuery = useQuery({
    queryKey: selectedRequest ? queryKeys.expenseAttachments(tenantId, selectedRequest.id) : ["tenant", tenantId, "expenses", "requests", "none", "attachments"],
    queryFn: async () => (selectedRequest ? listAttachments(tenantId, selectedRequest.id) : { items: [] as ExpenseAttachment[] }),
    enabled: Boolean(selectedRequest),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedRequest) throw new Error("Selecciona una solicitud antes de adjuntar archivos.");
      const validationMessage = validateExpenseAttachmentFile(file);
      if (validationMessage) throw new Error(validationMessage);

      const mimeType = resolveExpenseAttachmentMimeType(file);
      const checksumSha256 = await computeSha256Hex(file);
      const presignResponse = await apiRequest("/api/v1/modules/expenses/uploads/presign", {
        method: "POST",
        tenantId,
        body: toCreateExpenseUploadPresignBody({
          requestId: selectedRequest.id,
          originalFilename: file.name,
          mimeType,
          sizeBytes: file.size,
        }),
      });
      const presignData = getEnvelopeData(presignResponse.data);
      const upload = mapExpenseUploadPresign(presignData.upload);

      const uploadResponse = await fetch(upload.uploadUrl, {
        method: upload.method,
        headers: upload.requiredHeaders,
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error(`La subida del archivo fallo con estado ${uploadResponse.status}.`);
      }

      const attachmentResponse = await apiRequest(`/api/v1/modules/expenses/requests/${selectedRequest.id}/attachments`, {
        method: "POST",
        tenantId,
        body: toCreateExpenseAttachmentBody({
          storageProvider: upload.storageProvider,
          objectKey: upload.objectKey,
          originalFilename: file.name,
          mimeType,
          sizeBytes: file.size,
          checksumSha256,
        }),
      });
      const attachmentData = getEnvelopeData(attachmentResponse.data);
      const attachment = mapExpenseAttachment(attachmentData.attachment);
      return { traceId: attachmentResponse.traceId, attachment, file };
    },
    onSuccess: async ({ traceId, attachment, file }) => {
      setLastTraceId(traceId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenseAttachments(tenantId, attachment.expenseRequestId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.expensesRequests(tenantId) });
      setFeedback({
        status: "success",
        title: "Adjunto registrado",
        description: `${file.name} se subio y quedo asociado a la solicitud seleccionada.`,
        traceId,
        counts: { processed: 1, succeeded: 1, failed: 0 },
        items: [{ id: attachment.id, label: attachment.originalFilename, success: true, message: `${formatBytes(attachment.sizeBytes)} · ${attachment.mimeType}` }],
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFeedback({
          status: "error",
          title: "No se pudo registrar el adjunto",
          description: resolveExpensesErrorMessage(error.code, error.message),
          traceId: error.traceId ?? null,
          counts: { processed: 1, succeeded: 0, failed: 1 },
        });
        return;
      }

      setFeedback({
        status: "error",
        title: "No se pudo registrar el adjunto",
        description: error instanceof Error ? error.message : resolveExpensesErrorMessage("GEN_INTERNAL_ERROR"),
        counts: { processed: 1, succeeded: 0, failed: 1 },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachment: ExpenseAttachment) => {
      const response = await apiRequest(`/api/v1/modules/expenses/requests/${attachment.expenseRequestId}/attachments/${attachment.id}`, {
        method: "DELETE",
        tenantId,
      });
      const data = getEnvelopeData(response.data);
      return { traceId: response.traceId, attachment: mapExpenseAttachment(data.attachment) };
    },
    onSuccess: async ({ traceId, attachment }) => {
      setLastTraceId(traceId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenseAttachments(tenantId, attachment.expenseRequestId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.expensesRequests(tenantId) });
      setFeedback({
        status: "success",
        title: "Adjunto eliminado",
        description: "El adjunto seleccionado fue desactivado correctamente.",
        traceId,
        counts: { processed: 1, succeeded: 1, failed: 0 },
        items: [{ id: attachment.id, label: attachment.originalFilename, success: true, message: "Eliminado" }],
      });
      setAttachmentToDelete(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFeedback({
          status: "error",
          title: "No se pudo eliminar el adjunto",
          description: resolveExpensesErrorMessage(error.code, error.message),
          traceId: error.traceId ?? null,
          counts: { processed: 1, succeeded: 0, failed: 1 },
        });
      }
    },
  });

  const attachments = attachmentsQuery.data?.items ?? [];
  const totalLabel = selectedRequest ? `${selectedRequest.requestNumber} · ${selectedRequest.title}` : "Selecciona una solicitud";

  return (
    <section className={className}>
      <div className="rounded-[1.5rem] border border-border/85 bg-card/95 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Adjuntos</p>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Presign, upload y registro</h3>
            <p className="max-w-xl text-sm text-muted-foreground">
              Adjunta archivos con validacion cliente de tipo y tamano. El flujo se completa en el backend con metadata de respaldo y trazabilidad por `traceId`.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/8 text-primary">{attachments.length} adjuntos</Badge>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <label className="field-label">Solicitud activa</label>
            <select
              className="h-10 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary/35 focus:ring-3 focus:ring-primary/12"
              value={selectedRequest?.id ?? ""}
              onChange={(event) => onSelectedRequestIdChange(event.target.value)}
            >
              <option value="">Selecciona una solicitud</option>
              {requests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.requestNumber} · {request.title}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contexto</p>
            <p className="mt-1 text-sm text-foreground">{totalLabel}</p>
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

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedRequest || uploadMutation.isPending}
            >
              <FileUp className="size-4" />
              {uploadMutation.isPending ? "Subiendo..." : "Adjuntar archivo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => selectedRequest && void attachmentsQuery.refetch()}
              disabled={!selectedRequest || attachmentsQuery.isFetching}
            >
              <RefreshCw className="size-4" />
              Refrescar
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={EXPENSE_ATTACHMENT_ACCEPT}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void uploadMutation.mutateAsync(file);
              event.target.value = "";
            }}
          />

          <div className="space-y-3">
            {attachmentsQuery.isLoading ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-5 text-sm text-muted-foreground">Cargando adjuntos...</div>
            ) : attachments.length > 0 ? (
              attachments.map((attachment) => (
                <article key={attachment.id} className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-foreground">{attachment.originalFilename}</p>
                      <p className="text-xs text-muted-foreground">{attachment.mimeType} · {formatBytes(attachment.sizeBytes)} · {formatDateTime(attachment.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={attachment.isActive ? "default" : "outline"} className="rounded-full">{attachment.isActive ? "Activo" : "Inactivo"}</Badge>
                      <Button type="button" size="sm" variant="destructive" onClick={() => setAttachmentToDelete(attachment)} disabled={deleteMutation.isPending}>
                        <Trash2 className="size-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 px-4 py-6 text-sm text-muted-foreground">
                {selectedRequest ? "Todavia no hay adjuntos registrados para esta solicitud." : "Selecciona una solicitud para ver adjuntos."}
              </div>
            )}
          </div>
        </div>
      </div>

      <DecisionDialog
        open={Boolean(attachmentToDelete)}
        onOpenChange={(open) => {
          if (!open) setAttachmentToDelete(null);
        }}
        title="Eliminar adjunto"
        description="Esta accion desactivara el adjunto seleccionado."
        tone="danger"
        confirmLabel="Eliminar"
        busyLabel="Eliminando..."
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!attachmentToDelete) return;
          await deleteMutation.mutateAsync(attachmentToDelete);
        }}
      >
        {attachmentToDelete ? `Confirma la eliminacion de ${attachmentToDelete.originalFilename}.` : null}
      </DecisionDialog>
    </section>
  );
}

