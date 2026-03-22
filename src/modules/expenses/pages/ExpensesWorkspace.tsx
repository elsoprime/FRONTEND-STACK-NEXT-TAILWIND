"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChartColumn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { getCounters, getSummary, listRequests } from "@/lib/api/expenses.client";
import { ExpenseCategoriesManager } from "@/modules/expenses/components/settings/ExpenseCategoriesManager";
import { ExpenseModuleSettingsForm } from "@/modules/expenses/components/settings/ExpenseModuleSettingsForm";
import { formatExpenseAmount } from "@/modules/expenses/components/workflow/ExpenseWorkflowStateCard";
import { ExpenseRequestDetailPage } from "@/modules/expenses/pages/ExpenseRequestDetailPage";
import { ExpensesWorkspacePage } from "@/modules/expenses/pages/ExpensesWorkspacePage";
import { type ExpensesSectionKey } from "@/modules/expenses/routes/expenses.routes";
import { cn } from "@/lib/utils";

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
    <section className="space-y-4">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Reportes</p>
        <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
          Lectura ejecutiva del modulo
        </h3>
        <p className="max-w-2xl text-sm dashboard-text-muted">
          Resumen financiero y volumen operativo del tenant en una superficie alineada con el dashboard.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className="rounded-full border-cyan-300/35 bg-cyan-400/10 text-cyan-700 dark:text-cyan-100">
            Analitica
          </Badge>
          <Badge variant="outline" className="rounded-full border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100">
            Finanzas
          </Badge>
          <Badge variant="outline" className="rounded-full border-amber-300/35 bg-amber-400/10 text-amber-700 dark:text-amber-100">
            Workflow
          </Badge>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Total solicitado" value={summary.totalRequestedAmount} tone="default" />
          <MetricCard label="Total aprobado" value={summary.totalApprovedAmount} tone="success" />
          <MetricCard label="Total pagado" value={summary.totalPaidAmount} tone="muted" />
          <MetricCard label="Pendientes" value={counters.submitted + counters.returned} tone="warning" />
          <MetricCard label="Aprobadas" value={counters.approved} tone="success" />
          <MetricCard label="Rechazadas" value={counters.rejected} tone="warning" />
        </section>

        <aside className="surface-card rounded-[1.5rem] border-border/90 bg-background/82 p-5">
          <div className="flex items-center gap-2 text-primary">
            <ChartColumn className="size-4" />
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Lectura recomendada
            </h4>
          </div>
          <div className="mt-4 space-y-3 text-sm dashboard-text-muted">
            <p>Usa total solicitado y aprobado para detectar atascos entre captura y decision.</p>
            <p>Contrasta aprobadas contra pagadas para revisar cola financiera real.</p>
            <p>Las solicitudes rechazadas ayudan a detectar ruido operacional o reglas mal calibradas.</p>
          </div>
        </aside>
      </div>
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
        <ExpenseCategoriesManager tenantId={tenantId} />
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

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "warning" | "success" | "muted";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-400/35 bg-amber-400/10"
      : tone === "success"
        ? "border-emerald-400/35 bg-emerald-400/10"
        : tone === "muted"
          ? "border-border/80 bg-background/65"
          : "border-primary/25 bg-primary/10";

  return (
    <article className={cn("surface-card rounded-[1.35rem] border-border/90 p-4", toneClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/62">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value.toLocaleString("es-CL")}
      </p>
    </article>
  );
}


