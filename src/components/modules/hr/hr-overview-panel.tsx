"use client";

import { useQuery } from "@tanstack/react-query";
import { Briefcase, LoaderCircle, UserCheck, UserX } from "lucide-react";
import { listHrEmployees } from "@/features/hr/hr.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";

type HrOverviewPanelProps = {
  tenantId: string;
};

function resolveErrorCopy(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return resolveTenantErrorMessage(error.code, error.message);
  }

  return resolveTenantErrorMessage("GEN_INTERNAL_ERROR");
}

export function HrOverviewPanel({ tenantId }: HrOverviewPanelProps) {
  const employeesQuery = useQuery({
    queryKey: queryKeys.hrEmployees(tenantId),
    queryFn: async () => listHrEmployees(tenantId, { page: 1, limit: 20 }),
  });

  const employees = employeesQuery.data?.data.items ?? [];
  const active = employees.filter((employee) => employee.status === "active").length;
  const inactive = employees.filter((employee) => employee.status === "inactive").length;
  const total = employeesQuery.data?.pagination.total ?? 0;

  if (employeesQuery.isLoading) {
    return (
      <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando resumen HR...
      </div>
    );
  }

  if (employeesQuery.error) {
    return (
      <article className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
        <p className="text-sm font-semibold">{resolveErrorCopy(employeesQuery.error)}</p>
      </article>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card surface-card-hover rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Briefcase className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total empleados
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold">{total}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="size-4 text-emerald-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Activos
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold">{active}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl p-4">
          <div className="flex items-center gap-3">
            <UserX className="size-4 text-amber-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Inactivos
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold">{inactive}</p>
        </article>
      </div>

      <article className="surface-card rounded-xl p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Ultimos empleados
        </h3>
        {employees.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Sin empleados registrados.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {employees.slice(0, 5).map((employee) => (
              <li
                key={employee.id}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-background/70 px-3 py-2.5 transition-colors hover:border-primary/30"
              >
                <span className="font-medium">
                  {employee.firstName} {employee.lastName}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {employee.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
