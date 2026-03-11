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
      <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
        <LoaderCircle className="size-4 animate-spin" />
        Cargando resumen CRM...
      </div>
    );
  }

  const firstError = countersQuery.error ?? opportunitiesQuery.error;
  if (firstError) {
    return (
      <article className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
        <p className="text-sm font-semibold">{resolveErrorCopy(firstError)}</p>
      </article>
    );
  }

  const counters = countersQuery.data?.data.counters;
  const opportunities = opportunitiesQuery.data?.data.items ?? [];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card surface-card-hover rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Users className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Contactos activos
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold">{counters?.contactsActive ?? 0}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl p-4">
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Organizaciones
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold">{counters?.organizationsActive ?? 0}</p>
        </article>

        <article className="surface-card surface-card-hover rounded-xl p-4">
          <div className="flex items-center gap-3">
            <BadgeDollarSign className="size-4 text-emerald-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Oportunidades abiertas
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold">{counters?.opportunitiesOpen ?? 0}</p>
        </article>
      </div>

      <article className="surface-card rounded-xl p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Pipeline reciente
        </h3>
        {opportunities.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Sin oportunidades registradas.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {opportunities.map((opportunity) => (
              <li
                key={opportunity.id}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-background/70 px-3 py-2.5 transition-colors hover:border-primary/30"
              >
                <span className="font-medium">{opportunity.title}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {opportunity.stage}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
