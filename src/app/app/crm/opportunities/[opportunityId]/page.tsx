"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { getCrmOpportunity } from "@/features/crm/crm.service";
import { resolveCrmErrorMessage } from "@/features/crm/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function CrmOpportunityDetailPage() {
  const params = useParams<{ opportunityId: string }>();
  const opportunityId = params?.opportunityId ?? "";
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="CRM"
      title="Detalle de oportunidad"
      description="Vista puntual de la oportunidad seleccionada."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="CRM" config={MODULE_GUARDS.crm}>
            <OpportunityDetailContent tenantId={tenant.id} opportunityId={opportunityId} setLastTraceId={setLastTraceId} />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type OpportunityDetailContentProps = {
  tenantId: string;
  opportunityId: string;
  setLastTraceId: (traceId: string | null) => void;
};

function OpportunityDetailContent({ tenantId, opportunityId, setLastTraceId }: OpportunityDetailContentProps) {
  const opportunityQuery = useQuery({
    queryKey: queryKeys.crmOpportunity(tenantId, opportunityId),
    enabled: Boolean(opportunityId),
    queryFn: async () => {
      const response = await getCrmOpportunity(tenantId, opportunityId);
      setLastTraceId(response.traceId);
      return response.data.opportunity;
    },
  });

  if (opportunityQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando oportunidad..."
        hint="Sincronizando detalle de la oportunidad."
      />
    );
  }

  if (opportunityQuery.error) {
    const err = opportunityQuery.error;
    const message =
      err instanceof ApiRequestError
        ? resolveCrmErrorMessage(err.code, err.message)
        : resolveCrmErrorMessage("GEN_INTERNAL_ERROR");

    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        {message}
      </div>
    );
  }

  const opportunity = opportunityQuery.data;
  if (!opportunity) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
        No encontramos la oportunidad.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-background/70 p-4">
        <h2 className="text-lg font-semibold">{opportunity.title}</h2>
        <p className="text-sm text-muted-foreground">Etapa: {opportunity.stage}</p>
        <p className="text-sm text-muted-foreground">
          Monto: {opportunity.amount ?? "N/A"} {opportunity.currency ?? ""}
        </p>
        <p className="text-sm text-muted-foreground">Descripcion: {opportunity.description ?? "Sin descripcion"}</p>
        <p className="text-xs text-muted-foreground">Contacto: {opportunity.contactId ?? "No asignado"}</p>
        <p className="text-xs text-muted-foreground">Organizacion: {opportunity.organizationId ?? "No asignada"}</p>
        <p className="text-xs text-muted-foreground">Cierre estimado: {opportunity.expectedCloseDate ?? "No definido"}</p>
      </div>

      <Link href="/app/crm/opportunities" className="text-sm text-primary underline-offset-2 hover:underline">
        Volver a oportunidades
      </Link>
    </div>
  );
}
