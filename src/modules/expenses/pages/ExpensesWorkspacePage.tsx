"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <article className="surface-card rounded-[1.3rem] border-border/80 bg-background/82 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value.toLocaleString("es-CL")}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
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
      <section className="overflow-hidden rounded-xl border border-border/90 bg-card/96 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="rounded-lg border-primary/20 bg-primary/8 px-2.5 text-primary"
            >
              Workspace operativo
            </Badge>
            <div>
              <h3 className="text-[1.7rem] font-semibold tracking-tight text-foreground">
                Solicitudes, aprobaciones y pagos sin salir del modulo
              </h3>
              <p className="mt-2 max-w-3xl text-sm dashboard-text-muted">
                La cola central mantiene el foco del operador y deja aprobaciones, pagos y reportes
                dentro del mismo contexto del tenant.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCreateRequest ? (
              <Button
                type="button"
                radius="full"
                onClick={() => setRequestFormState({ open: true, mode: "create" })}
              >
                <Plus className="size-4" />
                Nueva solicitud
              </Button>
            ) : null}
          </div>
        </div>

        {countersQuery.isLoading ? (
          <LoadingScreen
            variant="inline"
            className="mt-5"
            label="Cargando indicadores del workspace..."
            hint="Consultando contadores de expenses del tenant activo."
          />
        ) : countersQuery.isError || !countersQuery.data ? (
          <article className="mt-5 rounded-xl border border-red-300/70 bg-red-100/60 p-4 text-sm text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200">
            No fue posible cargar los indicadores del workspace.
          </article>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CounterCard
              label="Total"
              value={countersQuery.data.total}
              hint="Solicitudes registradas para el tenant activo."
            />
            <CounterCard
              label="Pendientes"
              value={countersQuery.data.submitted + countersQuery.data.returned}
              hint="Solicitudes esperando decision o correccion."
            />
            <CounterCard
              label="Aprobadas"
              value={countersQuery.data.approved}
              hint="Listas para continuar al tramo financiero."
            />
            <CounterCard
              label="Pagadas"
              value={countersQuery.data.paid}
              hint="Cerradas con desembolso registrado."
            />
          </div>
        )}
      </section>

      <ExpensesQueuePage tenantId={tenantId} />

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



