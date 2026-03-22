"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { getCounters, getSummary, listRequests } from "@/lib/api/expenses.client";
import { ExpenseCategoriesManager } from "@/modules/expenses/components/settings/ExpenseCategoriesManager";
import { ExpenseModuleSettingsForm } from "@/modules/expenses/components/settings/ExpenseModuleSettingsForm";
import { formatExpenseAmount } from "@/modules/expenses/components/workflow/ExpenseWorkflowStateCard";
import { ExpenseRequestDetailPage } from "@/modules/expenses/pages/ExpenseRequestDetailPage";
import { ExpensesWorkspacePage } from "@/modules/expenses/pages/ExpensesWorkspacePage";
import { type ExpensesSectionKey } from "@/modules/expenses/routes/expenses.routes";

function RequestsByStatusPanel({
  title,
  description,
  tenantId,
  status,
  emptyLabel,
}: {
  title: string;
  description: string;
  tenantId: string;
  status: "submitted" | "approved";
  emptyLabel: string;
}) {
  const requestsQuery = useQuery({
    queryKey: ["tenant", tenantId, "expenses", "requests", status],
    queryFn: async () => listRequests(tenantId, { page: 1, limit: 5, status }),
  });

  if (requestsQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-0"
        label={`Cargando ${title.toLowerCase()}...`}
        hint="Sincronizando solicitudes del tenant activo."
      />
    );
  }

  if (requestsQuery.isError) {
    return (
      <article className="rounded-2xl border border-red-300/70 bg-red-100/60 p-4 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="mt-2 text-sm">No fue posible cargar esta vista.</p>
      </article>
    );
  }

  const items = requestsQuery.data?.items ?? [];

  return (
    <article className="rounded-2xl border border-border/80 bg-background/72 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((request) => (
            <Link
              key={request.id}
              href={`/app/expenses/${request.id}`}
              className="flex items-center justify-between rounded-xl border border-border/80 bg-card/90 px-3 py-2 text-sm hover:border-primary/30"
            >
              <span className="font-medium text-foreground">{request.requestNumber}</span>
              <span className="text-muted-foreground">
                {formatExpenseAmount(request.amount, request.currency)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

function ReportsWorkspace({ tenantId }: { tenantId: string }) {
  const summaryQuery = useQuery({
    queryKey: ["tenant", tenantId, "expenses", "reports", "summary"],
    queryFn: async () => getSummary(tenantId),
  });
  const countersQuery = useQuery({
    queryKey: ["tenant", tenantId, "expenses", "counters"],
    queryFn: async () => getCounters(tenantId),
  });

  if (summaryQuery.isLoading || countersQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-0"
        label="Cargando reportes de expenses..."
        hint="Consultando resumen y contadores del tenant."
      />
    );
  }

  if (summaryQuery.isError || countersQuery.isError) {
    return (
      <article className="rounded-2xl border border-red-300/70 bg-red-100/60 p-4 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
        <h4 className="text-sm font-semibold">Reportes</h4>
        <p className="mt-2 text-sm">No fue posible cargar resumen y contadores.</p>
      </article>
    );
  }

  const summary = summaryQuery.data;
  const counters = countersQuery.data;

  if (!summary || !counters) {
    return (
      <article className="rounded-2xl border border-red-300/70 bg-red-100/60 p-4 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
        <h4 className="text-sm font-semibold">Reportes</h4>
        <p className="mt-2 text-sm">No se recibieron datos completos para resumen y contadores.</p>
      </article>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Total solicitado" value={summary.totalRequestedAmount} />
      <MetricCard label="Total aprobado" value={summary.totalApprovedAmount} />
      <MetricCard label="Total pagado" value={summary.totalPaidAmount} />
      <MetricCard label="Pendientes" value={counters.submitted + counters.returned} />
      <MetricCard label="Aprobadas" value={counters.approved} />
      <MetricCard label="Rechazadas" value={counters.rejected} />
    </div>
  );
}

function SettingsWorkspace({ tenantId }: { tenantId: string }) {
  return (
    <section className="space-y-4">
      <ExpenseCategoriesManager tenantId={tenantId} />
      <ExpenseModuleSettingsForm tenantId={tenantId} />
    </section>
  );
}

export function ExpensesWorkspace({
  tenantId,
  activeSectionKey,
  requestId,
}: {
  tenantId: string;
  activeSectionKey: ExpensesSectionKey;
  requestId?: string | null;
}) {
  if (activeSectionKey === "requests") {
    return requestId ? (
      <ExpenseRequestDetailPage tenantId={tenantId} requestId={requestId} />
    ) : (
      <ExpensesWorkspacePage tenantId={tenantId} />
    );
  }

  if (activeSectionKey === "approvals") {
    return (
      <RequestsByStatusPanel
        title="Aprobaciones pendientes"
        description="Solicitudes en estado submitted para revision y decision."
        tenantId={tenantId}
        status="submitted"
        emptyLabel="No hay solicitudes pendientes de aprobacion."
      />
    );
  }

  if (activeSectionKey === "payments") {
    return (
      <RequestsByStatusPanel
        title="Pagos por ejecutar"
        description="Solicitudes aprobadas listas para marcar pago."
        tenantId={tenantId}
        status="approved"
        emptyLabel="No hay solicitudes aprobadas pendientes de pago."
      />
    );
  }

  if (activeSectionKey === "reports") {
    return <ReportsWorkspace tenantId={tenantId} />;
  }

  return <SettingsWorkspace tenantId={tenantId} />;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-border/80 bg-background/72 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value.toLocaleString("es-CL")}</p>
    </article>
  );
}
