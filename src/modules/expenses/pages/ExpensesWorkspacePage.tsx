"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ChartColumn, CircleDollarSign, ClipboardList, Plus } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { getCounters } from "@/lib/api/expenses.client";
import { ExpenseRequestFormDrawer } from "@/modules/expenses/components/requests/ExpenseRequestFormDrawer";
import { ExpensesQueuePage } from "@/modules/expenses/pages/ExpensesQueuePage";
import { useExpensesStore } from "@/modules/expenses/state/expenses.store";
import { useTenantStore } from "@/store/tenant-store";

type ExpensesWorkspacePageProps = {
  tenantId: string;
};

function CounterCard({
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
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value.toLocaleString("es-CL")}</p>
    </article>
  );
}

export function ExpensesWorkspacePage({ tenantId }: ExpensesWorkspacePageProps) {
  const requestFormOpen = useExpensesStore((state) => state.requestFormOpen);
  const requestFormMode = useExpensesStore((state) => state.requestFormMode);
  const setRequestFormState = useExpensesStore((state) => state.setRequestFormState);
  const closeRequestForm = useExpensesStore((state) => state.closeRequestForm);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const countersQuery = useQuery({
    queryKey: ["tenant", tenantId, "expenses", "counters"],
    queryFn: async () => getCounters(tenantId),
  });
  const canCreateRequest = hasTenantPermission(
    activeMembership?.roleKey ?? "tenant:member",
    TENANT_PERMISSION_KEYS.EXPENSES_REQUEST_CREATE,
  );

  return (
    <section className="space-y-5">
      <header className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-kicker text-primary/90">Workspace</p>
            <h3 className="text-[1.6rem] font-semibold tracking-tight text-foreground">Control operativo de Expenses</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Gestiona solicitudes, aprobaciones y pagos desde una sola vista. El estado del flujo
              se sincroniza con permisos y plan del tenant.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/expenses?tab=approvals"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30"
            >
              <BadgeCheck className="size-4" />
              Ir a aprobaciones
            </Link>
            <Link
              href="/app/expenses?tab=payments"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30"
            >
              <CircleDollarSign className="size-4" />
              Ir a pagos
            </Link>
            <Link
              href="/app/expenses?tab=reports"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30"
            >
              <ChartColumn className="size-4" />
              Ver reportes
            </Link>
            {canCreateRequest ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/45"
                onClick={() => setRequestFormState({ open: true, mode: "create" })}
              >
                <Plus className="size-4" />
                Nueva solicitud
              </button>
            ) : null}
          </div>
        </div>

        {countersQuery.isLoading ? (
          <LoadingScreen
            variant="inline"
            className="mt-4"
            label="Cargando indicadores del workspace..."
            hint="Consultando contadores de expenses del tenant activo."
          />
        ) : countersQuery.isError || !countersQuery.data ? (
          <article className="mt-4 rounded-xl border border-red-300/70 bg-red-100/60 p-4 text-sm text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
            No fue posible cargar los indicadores del workspace.
          </article>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CounterCard label="Total" value={countersQuery.data.total} tone="default" />
            <CounterCard
              label="Pendientes"
              value={countersQuery.data.submitted + countersQuery.data.returned}
              tone="warning"
            />
            <CounterCard label="Aprobadas" value={countersQuery.data.approved} tone="success" />
            <CounterCard label="Pagadas" value={countersQuery.data.paid} tone="muted" />
          </div>
        )}
      </header>

      <article className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-6">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="size-5 text-primary" />
          <h4 className="text-lg font-semibold tracking-tight text-foreground">Queue de solicitudes</h4>
        </div>
        <ExpensesQueuePage tenantId={tenantId} />
      </article>

      <ExpenseRequestFormDrawer
        open={requestFormOpen && requestFormMode === "create"}
        mode="create"
        tenantId={tenantId}
        onOpenChange={(open) => {
          if (open) {
            setRequestFormState({ open: true, mode: "create" });
            return;
          }

          closeRequestForm();
        }}
        onCompleted={() => {
          closeRequestForm();
        }}
      />
    </section>
  );
}
