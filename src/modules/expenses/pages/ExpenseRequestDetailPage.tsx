"use client";

import Link from "next/link";
import { type ComponentType, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Hash,
  Inbox,
  Pencil,
  UserRound,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { ApiRequestError } from "@/lib/api/client";
import { getRequest } from "@/lib/api/expenses.client";
import { ExpenseRequestFormDrawer } from "@/modules/expenses/components/requests/ExpenseRequestFormDrawer";
import { ExpenseAttachmentsPanel } from "@/modules/expenses/components/attachments/ExpenseAttachmentsPanel";
import { ExpenseWorkflowActions } from "@/modules/expenses/components/workflow/ExpenseWorkflowActions";
import {
  ExpenseStatusBadge,
  ExpenseWorkflowStateCard,
  formatExpenseAmount,
  formatExpenseDate,
} from "@/modules/expenses/components/workflow/ExpenseWorkflowStateCard";
import { useExpensesStore } from "@/modules/expenses/state/expenses.store";
import { useTenantStore } from "@/store/tenant-store";

export function ExpenseRequestDetailPage({
  tenantId,
  requestId,
}: {
  tenantId: string;
  requestId: string;
}) {
  const setSelectedRequestId = useExpensesStore((state) => state.setSelectedRequestId);
  const resetWorkflowDraft = useExpensesStore((state) => state.resetWorkflowDraft);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  useEffect(() => {
    setSelectedRequestId(requestId);
    resetWorkflowDraft();

    return () => {
      setSelectedRequestId(null);
      resetWorkflowDraft();
    };
  }, [requestId, resetWorkflowDraft, setSelectedRequestId]);

  const requestQuery = useQuery({
    queryKey: ["tenant", tenantId, "expenses", "requests", requestId],
    enabled: requestId.length > 0,
    queryFn: async () => getRequest(tenantId, requestId),
  });

  if (requestQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando detalle de la solicitud..."
        hint="Sincronizando el estado operativo y el workflow de la solicitud."
      />
    );
  }

  if (requestQuery.error) {
    const error = requestQuery.error;

    if (error instanceof ApiRequestError && (error.status === 404 || error.code === "GEN_NOT_FOUND")) {
      return (
        <EmptyDetailState
          title="No encontramos la solicitud"
          description="La solicitud pedida no existe o ya no esta disponible en este tenant."
        />
      );
    }

    return <InlineDetailError message={resolveExpenseDetailErrorMessage(error)} />;
  }

  const request = requestQuery.data;

  if (!request) {
    return (
      <EmptyDetailState
        title="No encontramos la solicitud"
        description="La solicitud pedida no devolvio datos validos."
      />
    );
  }

  const canUpdateOwn = hasTenantPermission(
    activeMembership?.roleKey ?? "tenant:member",
    TENANT_PERMISSION_KEYS.EXPENSES_REQUEST_UPDATE_OWN,
  );
  const canEditRequest = canUpdateOwn && (request.status === "draft" || request.status === "returned");

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Link
            href="/app/expenses"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" />
            Volver a la cola
          </Link>
          <div className="space-y-1">
            <p className="label-kicker text-primary/90">Detalle de solicitud</p>
            <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
              {request.title}
            </h3>
            <p className="max-w-3xl text-sm dashboard-text-muted">
              Revisa los datos principales, el estado actual y ejecuta el workflow desde esta
              vista.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEditRequest ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary/30"
              onClick={() => setEditDrawerOpen(true)}
            >
              <Pencil className="size-4" />
              Editar
            </button>
          ) : null}
          <ExpenseStatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          <article className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/80 bg-background/72 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {request.requestNumber}
              </span>
              <span className="rounded-full border border-border/80 bg-background/72 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {request.categoryKey}
              </span>
              <span className="rounded-full border border-border/80 bg-background/72 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {request.currency}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <RequestInfoCard
                label="Monto"
                value={formatExpenseAmount(request.amount, request.currency)}
                icon={Hash}
              />
              <RequestInfoCard
                label="Fecha de gasto"
                value={formatExpenseDate(request.expenseDate)}
                icon={CalendarDays}
              />
              <RequestInfoCard label="Solicitante" value={request.requesterUserId} icon={UserRound} />
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-border/80 bg-background/72 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card/90 text-primary">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Descripcion</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.description ?? "Sin descripcion"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <RequestInfoCard label="Creada" value={formatExpenseDate(request.createdAt)} icon={CalendarDays} />
              <RequestInfoCard
                label="Actualizada"
                value={formatExpenseDate(request.updatedAt)}
                icon={CalendarDays}
              />
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
            <div className="flex items-center gap-2">
              <Inbox className="size-4 text-primary" />
              <h4 className="text-base font-semibold tracking-tight text-foreground">Metadata</h4>
            </div>

            {Object.keys(request.metadata).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Esta solicitud no expone metadata adicional.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {Object.entries(request.metadata).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-border/80 bg-background/72 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {key}
                    </p>
                    <p className="mt-2 break-words text-sm font-medium text-foreground">
                      {renderMetadataValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>

        <div className="space-y-4">
          <ExpenseWorkflowStateCard request={request} />
          <ExpenseWorkflowActions tenantId={tenantId} request={request} />
          <ExpenseAttachmentsPanel
            tenantId={tenantId}
            requests={[request]}
            selectedRequestId={request.id}
            onSelectedRequestIdChange={() => {}}
          />
        </div>
      </div>

      {canEditRequest ? (
        <ExpenseRequestFormDrawer
          open={editDrawerOpen}
          mode="update"
          tenantId={tenantId}
          initialData={{
            requestId: request.id,
            title: request.title,
            categoryKey: request.categoryKey,
            amount: request.amount,
            currency: request.currency,
            expenseDate: request.expenseDate,
            description: request.description,
          }}
          onOpenChange={setEditDrawerOpen}
          onCompleted={() => {
            setEditDrawerOpen(false);
            void requestQuery.refetch();
          }}
        />
      ) : null}
    </section>
  );
}

function resolveExpenseDetailErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return "No fue posible cargar el detalle de la solicitud.";
}

function renderMetadataValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function RequestInfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className="rounded-2xl border border-border/80 bg-background/72 p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg border border-border/80 bg-card/90 text-primary">
          <Icon className="size-4" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{value}</p>
    </article>
  );
}

function InlineDetailError({ message }: { message: string }) {
  return (
    <article className="surface-card rounded-[1.5rem] border border-red-300/80 bg-red-100/70 p-5 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
      <h3 className="text-base font-semibold tracking-tight">No se pudo cargar el detalle</h3>
      <p className="mt-2 max-w-2xl text-sm">{message}</p>
    </article>
  );
}

function EmptyDetailState({ title, description }: { title: string; description: string }) {
  return (
    <article className="surface-card rounded-[1.5rem] border border-border/90 bg-card/96 p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-background/75 text-primary">
          <Inbox className="size-5" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Detalle no disponible
          </p>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          <Link
            href="/app/expenses"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" />
            Volver a la cola
          </Link>
        </div>
      </div>
    </article>
  );
}
