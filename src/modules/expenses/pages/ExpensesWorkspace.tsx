"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { inventorySelectClassName } from "@/components/ui/inventory-records-shell";
import { listRequests } from "@/lib/api/expenses.client";
import { type ExpenseRequestStatus } from "@/lib/api/expenses.types";
import { ExpenseCategoryCatalogManager } from "@/modules/expenses/components/settings/ExpenseCategoryCatalogManager";
import { ExpenseModuleSettingsForm } from "@/modules/expenses/components/settings/ExpenseModuleSettingsForm";
import { formatExpenseAmount } from "@/modules/expenses/components/workflow/ExpenseWorkflowStateCard";
import { ExpensesCategoryDistribution } from "@/modules/expenses/components/dashboard/ExpensesCategoryDistribution";
import { ExpensesKpiStrip } from "@/modules/expenses/components/dashboard/ExpensesKpiStrip";
import { ExpensesOperationalAlerts } from "@/modules/expenses/components/dashboard/ExpensesOperationalAlerts";
import { ExpensesTrendsPanel } from "@/modules/expenses/components/dashboard/ExpensesTrendsPanel";
import {
  type ExpensesDashboardDateWindow,
  useExpensesDashboard,
} from "@/modules/expenses/hooks/use-expenses-dashboard";
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
    <section className="space-y-4">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Workflow</p>
        <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">{description}</p>
      </header>

      <article className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
        {items.length === 0 ? (
          <div className="rounded-[1.2rem] border border-border/80 bg-background/82 p-5">
            <p className="text-sm font-semibold text-foreground">{emptyLabel}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando aparezcan solicitudes en este estado, se listaran aqui sin salir del workspace.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((request) => (
              <Link
                key={request.id}
                href={`/app/expenses/${request.id}`}
                className="group flex items-center justify-between rounded-[1.2rem] border border-border/80 bg-background/82 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-background/92"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{request.requestNumber}</p>
                  <p className="text-xs text-muted-foreground">{request.title}</p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatExpenseAmount(request.amount, request.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">Abrir detalle</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function ReportsWorkspace({ tenantId }: { tenantId: string }) {
  const dashboard = useExpensesDashboard(tenantId);

  if (dashboard.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-0"
        label="Cargando dashboard de expenses..."
        hint="Sincronizando metricas operativas del tenant activo."
      />
    );
  }

  if (dashboard.isError) {
    return (
      <article className="rounded-2xl border border-red-300/70 bg-red-100/60 p-4 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
        <h4 className="text-sm font-semibold">Dashboard</h4>
        <p className="mt-2 text-sm">{dashboard.errorMessage ?? "No fue posible cargar metricas de expenses."}</p>
      </article>
    );
  }

  return (
    <section className="space-y-4" data-testid="expenses-reports-dashboard">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Reportes</p>
        <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
          Panel operativo de expenses
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Vista ejecutiva para controlar volumen, montos, alertas y comportamiento por categoria.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className="rounded-full border-cyan-300/35 bg-cyan-400/10 text-cyan-700 dark:text-cyan-100">
            Dashboard
          </Badge>
          <Badge variant="outline" className="rounded-full border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100">
            Operacion
          </Badge>
          <Badge variant="outline" className="rounded-full border-amber-300/35 bg-amber-400/10 text-amber-700 dark:text-amber-100">
            Riesgo
          </Badge>
        </div>
      </header>

      <section className="grid gap-3 rounded-[1.2rem] border border-border/80 bg-background/82 p-4 sm:grid-cols-3">
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Rango</span>
          <select
            className={inventorySelectClassName}
            value={dashboard.filters.dateWindowDays}
            onChange={(event) => dashboard.setDateWindowDays(Number(event.target.value) as ExpensesDashboardDateWindow)}
          >
            <option value={7}>Ultimos 7 dias</option>
            <option value={30}>Ultimos 30 dias</option>
            <option value={90}>Ultimos 90 dias</option>
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Estado</span>
          <select
            className={inventorySelectClassName}
            value={dashboard.filters.status}
            onChange={(event) => dashboard.setStatus(event.target.value as "all" | ExpenseRequestStatus)}
          >
            <option value="all">Todos</option>
            <option value="submitted">Enviadas</option>
            <option value="returned">Devueltas</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="paid">Pagadas</option>
            <option value="canceled">Canceladas</option>
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Categoria</span>
          <select
            className={inventorySelectClassName}
            value={dashboard.filters.categoryKey}
            onChange={(event) => dashboard.setCategoryKey(event.target.value)}
          >
            <option value="all">Todas</option>
            {dashboard.availableCategories.map((category) => (
              <option key={category.key} value={category.key}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {dashboard.hasMixedCurrencies ? (
        <p className="text-sm text-muted-foreground">
          Los montos del panel se muestran en {dashboard.primaryCurrency ?? "CLP"} como moneda principal del rango seleccionado.
        </p>
      ) : null}

      <ExpensesKpiStrip kpis={dashboard.kpis} currency={dashboard.primaryCurrency ?? "CLP"} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <ExpensesTrendsPanel trends={dashboard.trends} />
        <ExpensesOperationalAlerts alerts={dashboard.alerts} />
      </div>

      <ExpensesCategoryDistribution categories={dashboard.categories} currency={dashboard.primaryCurrency ?? "CLP"} />
    </section>
  );
}

function SettingsWorkspace({ tenantId }: { tenantId: string }) {
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Configuracion</p>
        <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
          Politicas y catalogos del modulo
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Ajustes operativos y categorias sobre el mismo lenguaje visual del resto del dashboard.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <ExpenseCategoryCatalogManager tenantId={tenantId} />
        <ExpenseModuleSettingsForm tenantId={tenantId} />
      </div>
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

