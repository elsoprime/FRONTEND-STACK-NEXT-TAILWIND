"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeDollarSign, BriefcaseBusiness, LoaderCircle, Users } from "lucide-react";
import { getCrmCounters, listCrmOpportunities } from "@/features/crm/crm.service";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";

type CrmOverviewPanelProps = {
  tenantId: string;
};

function resolveErrorCopy(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return resolveTenantErrorMessage(error.code, error.message);
  }

  return resolveTenantErrorMessage("GEN_INTERNAL_ERROR");
}

export function CrmOverviewPanel({ tenantId }: CrmOverviewPanelProps) {
  const countersQuery = useQuery({
    queryKey: queryKeys.crmCounters(tenantId),
    queryFn: async () => getCrmCounters(tenantId),
  });

  const opportunitiesQuery = useQuery({
    queryKey: queryKeys.crmOpportunities(tenantId),
    queryFn: async () => listCrmOpportunities(tenantId, { page: 1, limit: 5 }),
  });

  if (countersQuery.isLoading || opportunitiesQuery.isLoading) {
    return (
      <div className="mt-6 inline-flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando resumen CRM...
      </div>
    );
  }

  const firstError = countersQuery.error ?? opportunitiesQuery.error;
  if (firstError) {
    return (
      <article className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
        <p className="text-sm font-semibold">{resolveErrorCopy(firstError)}</p>
      </article>
    );
  }

  const counters = countersQuery.data?.data.counters;
  const opportunities = opportunitiesQuery.data?.data.items ?? [];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Users className="size-4 text-blue-700 dark:text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contactos activos</p>
          </div>
          <p className="mt-3 text-3xl font-bold">{counters?.contactsActive ?? 0}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="size-4 text-blue-700 dark:text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Organizaciones</p>
          </div>
          <p className="mt-3 text-3xl font-bold">{counters?.organizationsActive ?? 0}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <BadgeDollarSign className="size-4 text-emerald-700 dark:text-emerald-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Oportunidades abiertas</p>
          </div>
          <p className="mt-3 text-3xl font-bold">{counters?.opportunitiesOpen ?? 0}</p>
        </article>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Pipeline reciente</h3>
        {opportunities.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Sin oportunidades registradas.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {opportunities.map((opportunity) => (
              <li key={opportunity.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span className="font-medium">{opportunity.title}</span>
                <span className="text-slate-500 dark:text-slate-400 uppercase">{opportunity.stage}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
