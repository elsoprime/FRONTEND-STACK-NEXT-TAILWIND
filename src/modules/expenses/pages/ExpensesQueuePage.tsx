"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Inbox, RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ApiRequestError } from "@/lib/api/client";
import { listQueue } from "@/lib/api/expenses.client";
import type { ExpenseRequestStatus } from "@/lib/api/expenses.types";
import { cn } from "@/lib/utils";
import { ExpenseBulkActionsPanel } from "@/modules/expenses/components/bulk/ExpenseBulkActionsPanel";
import {
  ExpenseStatusBadge,
  formatExpenseAmount,
  formatExpenseDate,
} from "@/modules/expenses/components/workflow/ExpenseWorkflowStateCard";
import { useExpensesStore } from "@/modules/expenses/state/expenses.store";

const QUEUE_STATUS_OPTIONS: ReadonlyArray<{ value: ExpenseRequestStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "submitted", label: "Submitted" },
  { value: "returned", label: "Returned" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "canceled", label: "Canceled" },
  { value: "draft", label: "Draft" },
];

export function ExpensesQueuePage({ tenantId }: { tenantId: string }) {
  const queuePage = useExpensesStore((state) => state.queuePage);
  const queueLimit = useExpensesStore((state) => state.queueLimit);
  const queueFilters = useExpensesStore((state) => state.queueFilters);
  const setQueuePage = useExpensesStore((state) => state.setQueuePage);
  const setQueueStatusFilter = useExpensesStore((state) => state.setQueueStatusFilter);
  const setQueueSearchFilter = useExpensesStore((state) => state.setQueueSearchFilter);
  const resetQueueFilters = useExpensesStore((state) => state.resetQueueFilters);
  const setSelectedRequestId = useExpensesStore((state) => state.setSelectedRequestId);

  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const deferredSearch = useDeferredValue(queueFilters.search.trim());

  useEffect(() => {
    setSelectedRequestId(null);
  }, [setSelectedRequestId]);

  const queueQuery = useQuery({
    queryKey: [
      "tenant",
      tenantId,
      "expenses",
      "queue",
      queuePage,
      queueLimit,
      queueFilters.status,
      deferredSearch,
    ],
    queryFn: async () =>
      listQueue(tenantId, {
        page: queuePage,
        limit: queueLimit,
        status: queueFilters.status === "all" ? undefined : queueFilters.status,
        search: deferredSearch.length > 0 ? deferredSearch : undefined,
      }),
  });

  if (queueQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando cola de gastos..."
        hint="Sincronizando solicitudes disponibles para el tenant activo."
      />
    );
  }

  if (queueQuery.error) {
    return (
      <ExpensesInlineError
        message={resolveExpensesQueueErrorMessage(queueQuery.error)}
        onRetry={() => void queueQuery.refetch()}
      />
    );
  }

  const items = queueQuery.data?.items ?? [];
  const pagination = queueQuery.data?.pagination;

  const toggleSelection = (requestId: string) => {
    setSelectedRequestIds((current) =>
      current.includes(requestId)
        ? current.filter((id) => id !== requestId)
        : [...current, requestId],
    );
  };

  const selectAllVisible = () => {
    setSelectedRequestIds(items.map((item) => item.id));
  };

  const clearSelection = () => {
    setSelectedRequestIds([]);
  };

  const clearFilters = () => {
    resetQueueFilters();
    setSelectedRequestIds([]);
  };

  const hasFilters = queueFilters.status !== "all" || queueFilters.search.trim().length > 0;

  if (items.length === 0) {
    return (
      <section className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-6">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            Estado
            <select
              value={queueFilters.status}
              onChange={(event) => setQueueStatusFilter(event.target.value as ExpenseRequestStatus | "all")}
              className="rounded-md border border-border/80 bg-background/70 px-2 py-1 text-sm text-foreground"
            >
              {QUEUE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="relative inline-flex items-center">
            <Search className="pointer-events-none absolute left-2 size-4 text-muted-foreground" />
            <input
              value={queueFilters.search}
              onChange={(event) => setQueueSearchFilter(event.target.value)}
              placeholder="Buscar por numero, titulo o categoria"
              className="w-72 rounded-md border border-border/80 bg-background/70 py-1 pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </label>
          {hasFilters ? (
            <Button type="button" variant="outline" onClick={clearFilters}>
              <X className="size-4" />
              Limpiar filtros
            </Button>
          ) : null}
        </header>

        <div className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-background/75 text-primary">
            <Inbox className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Cola vacia
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              No hay solicitudes con los filtros actuales
            </h3>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Ajusta filtros o espera nuevas solicitudes en estado operativo para continuar el flujo.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="label-kicker text-primary/90">Queue operativa</p>
          <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
            Solicitudes de gasto
          </h3>
          <p className="max-w-2xl text-sm dashboard-text-muted">
            Revisa solicitudes disponibles, entra al detalle y ejecuta acciones de workflow desde
            una sola superficie.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={selectAllVisible}>
            Seleccionar visibles
          </Button>
          <Button type="button" variant="outline" onClick={clearSelection}>
            Limpiar seleccion
          </Button>
          {pagination ? (
            <div className="rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              {pagination.total} solicitudes
            </div>
          ) : null}
        </div>
      </header>

      <section className="surface-card rounded-[1.25rem] border-border/90 bg-card/96 p-4">
        <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            Estado
            <select
              value={queueFilters.status}
              onChange={(event) => setQueueStatusFilter(event.target.value as ExpenseRequestStatus | "all")}
              className="rounded-md border border-border/80 bg-background/70 px-2 py-1 text-sm text-foreground"
            >
              {QUEUE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="relative inline-flex items-center">
            <Search className="pointer-events-none absolute left-2 size-4 text-muted-foreground" />
            <input
              value={queueFilters.search}
              onChange={(event) => setQueueSearchFilter(event.target.value)}
              placeholder="Buscar por numero, titulo o categoria"
              className="w-full rounded-md border border-border/80 bg-background/70 py-1 pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </label>

          <Button type="button" variant="outline" onClick={clearFilters} disabled={!hasFilters}>
            <X className="size-4" />
            Reset
          </Button>
        </div>
      </section>

      <ExpenseBulkActionsPanel
        tenantId={tenantId}
        requests={items}
        selectedRequestIds={selectedRequestIds}
        onCompleted={() => {
          setSelectedRequestIds([]);
          void queueQuery.refetch();
        }}
      />

      <div className="grid gap-4">
        {items.map((request) => {
          const checked = selectedRequestIds.includes(request.id);

          return (
            <article
              key={request.id}
              className={cn(
                "surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5 transition-colors",
                checked ? "border-primary/35" : "",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelection(request.id)}
                  />
                  Seleccionar para bulk
                </label>
                <ExpenseStatusBadge status={request.status} />
              </div>

              <Link
                href={`/app/expenses/${request.id}`}
                onClick={() => setSelectedRequestId(request.id)}
                className="group block"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border/80 bg-background/72 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {request.requestNumber}
                      </span>
                      <span className="rounded-full border border-border/80 bg-background/72 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {request.categoryKey}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-semibold tracking-tight text-foreground">
                        {request.title}
                      </h4>
                      <p className="max-w-3xl text-sm text-muted-foreground">
                        {request.description ?? "Sin descripcion"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatExpenseAmount(request.amount, request.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatExpenseDate(request.expenseDate)}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border/80 bg-background/72 p-4">
          <div className="text-sm text-muted-foreground">
            Pagina {pagination.page} de {pagination.totalPages}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={queuePage <= 1}
              onClick={() => startTransition(() => setQueuePage(queuePage - 1))}
            >
              <ArrowLeft className="size-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={queuePage >= pagination.totalPages}
              onClick={() => startTransition(() => setQueuePage(queuePage + 1))}
            >
              Siguiente
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function resolveExpensesQueueErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.code === "GEN_NOT_FOUND") {
      return "No fue posible resolver la cola de gastos para este tenant.";
    }

    return error.message;
  }

  return "No fue posible cargar la cola de gastos.";
}

function ExpensesInlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <article className="surface-card rounded-[1.5rem] border border-red-300/80 bg-red-100/70 p-5 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-red-300/70 bg-red-50/80 dark:border-destructive/45 dark:bg-destructive/20">
          <RotateCcw className="size-4" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold tracking-tight">No se pudo cargar la cola</h3>
          <p className="max-w-2xl text-sm">{message}</p>
        </div>
      </div>

      <div className="mt-4">
        <Button type="button" variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    </article>
  );
}
