"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCheck, FilterX } from "lucide-react";
import { InventoryPaginationControls } from "@/components/modules/inventory/inventory-pagination-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InventoryCell,
  InventoryDataTable,
  InventoryRow,
  inventorySelectClassName,
} from "@/components/ui/inventory-records-shell";
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
  const hasFilters = queueFilters.status !== "all" || queueFilters.search.trim().length > 0;

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

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card/96 shadow-sm">
      <div className="border-b border-border/70 bg-linear-to-r from-background via-background to-muted/35 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit rounded-lg border border-primary/20 bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">
              Queue operativa
            </span>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Solicitudes de gasto
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Tabla principal del modulo para revisar solicitudes, aplicar seleccion masiva y abrir el detalle sin salir del flujo.
              </p>
            </div>
          </div>

          <div className="min-w-[180px] rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Total visible
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {String(pagination?.total ?? items.length)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              value={queueFilters.search}
              onChange={(event) => setQueueSearchFilter(event.target.value)}
              placeholder="Buscar por numero, titulo o categoria"
              className="h-10 w-full rounded-md bg-background/85 lg:max-w-sm"
            />
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <select
                value={queueFilters.status}
                onChange={(event) =>
                  setQueueStatusFilter(event.target.value as ExpenseRequestStatus | "all")
                }
                className={cn(inventorySelectClassName, "lg:max-w-[220px]")}
              >
                {QUEUE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="toolbar"
                onClick={clearFilters}
                disabled={!hasFilters}
              >
                <FilterX className="size-4" />
                Limpiar filtros
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="toolbar" onClick={selectAllVisible} disabled={items.length === 0}>
              <CheckCheck className="size-4" />
              Seleccionar visibles
            </Button>
            <Button type="button" variant="toolbar" onClick={clearSelection} disabled={selectedRequestIds.length === 0}>
              Limpiar seleccion
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b border-border/70 px-5 py-4 sm:px-6">
        <ExpenseBulkActionsPanel
          tenantId={tenantId}
          requests={items}
          selectedRequestIds={selectedRequestIds}
          onCompleted={() => {
            setSelectedRequestIds([]);
            void queueQuery.refetch();
          }}
        />
      </div>

      <div className="px-3 py-3 sm:px-4">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <InventoryDataTable
            hasRows={items.length > 0}
            empty={
              hasFilters
                ? "Sin resultados para los filtros aplicados."
                : "No hay solicitudes registradas."
            }
            columns={
              <>
                <InventoryCell header className="w-[72px] text-center">
                  Bulk
                </InventoryCell>
                <InventoryCell header>Solicitud</InventoryCell>
                <InventoryCell header>Estado</InventoryCell>
                <InventoryCell header className="text-right">
                  Monto
                </InventoryCell>
                <InventoryCell header>Fecha</InventoryCell>
                <InventoryCell header className="text-right">
                  Accion
                </InventoryCell>
              </>
            }
          >
            {items.map((request) => {
              const checked = selectedRequestIds.includes(request.id);

              return (
                <InventoryRow key={request.id}>
                  <InventoryCell className="text-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelection(request.id)}
                      aria-label={`Seleccionar solicitud ${request.requestNumber}`}
                    />
                  </InventoryCell>
                  <InventoryCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{request.requestNumber}</p>
                      <p className="text-xs text-muted-foreground">{request.title}</p>
                      <p className="text-xs text-muted-foreground">{request.categoryKey}</p>
                    </div>
                  </InventoryCell>
                  <InventoryCell>
                    <ExpenseStatusBadge status={request.status} />
                  </InventoryCell>
                  <InventoryCell className="text-right">
                    <span className="font-semibold text-foreground">
                      {formatExpenseAmount(request.amount, request.currency)}
                    </span>
                  </InventoryCell>
                  <InventoryCell>
                    <span className="text-sm text-foreground/85">
                      {formatExpenseDate(request.expenseDate)}
                    </span>
                  </InventoryCell>
                  <InventoryCell className="text-right">
                    <Link
                      href={`/app/expenses/${request.id}`}
                      onClick={() => setSelectedRequestId(request.id)}
                      className="inline-flex items-center justify-center rounded-md border border-border/80 bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-background/90"
                    >
                      Abrir
                    </Link>
                  </InventoryCell>
                </InventoryRow>
              );
            })}
          </InventoryDataTable>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="border-t border-border/70 px-5 py-4 sm:px-6">
          <InventoryPaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={(nextPage) => startTransition(() => setQueuePage(nextPage))}
          />
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
          <CheckCheck className="size-4" />
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
