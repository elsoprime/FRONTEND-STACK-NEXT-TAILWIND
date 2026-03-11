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
      <div className="mt-6 inline-flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando resumen HR...
      </div>
    );
  }

  if (employeesQuery.error) {
    return (
      <article className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
        <p className="text-sm font-semibold">{resolveErrorCopy(employeesQuery.error)}</p>
      </article>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Briefcase className="size-4 text-blue-700 dark:text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total empleados</p>
          </div>
          <p className="mt-3 text-3xl font-bold">{total}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <UserCheck className="size-4 text-emerald-700 dark:text-emerald-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Activos</p>
          </div>
          <p className="mt-3 text-3xl font-bold">{active}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <UserX className="size-4 text-amber-700 dark:text-amber-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inactivos</p>
          </div>
          <p className="mt-3 text-3xl font-bold">{inactive}</p>
        </article>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Ultimos empleados</h3>
        {employees.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Sin empleados registrados.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {employees.slice(0, 5).map((employee) => (
              <li key={employee.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span className="font-medium">{employee.firstName} {employee.lastName}</span>
                <span className="text-slate-500 dark:text-slate-400 uppercase">{employee.status}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
