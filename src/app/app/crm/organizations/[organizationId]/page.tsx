"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { getCrmOrganization } from "@/features/crm/crm.service";
import { resolveCrmErrorMessage } from "@/features/crm/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function CrmOrganizationDetailPage() {
  const params = useParams<{ organizationId: string }>();
  const organizationId = params?.organizationId ?? "";
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="CRM"
      title="Detalle de organizacion"
      description="Vista puntual de la organizacion seleccionada."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="CRM" config={MODULE_GUARDS.crm}>
            <OrganizationDetailContent tenantId={tenant.id} organizationId={organizationId} setLastTraceId={setLastTraceId} />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type OrganizationDetailContentProps = {
  tenantId: string;
  organizationId: string;
  setLastTraceId: (traceId: string | null) => void;
};

function OrganizationDetailContent({ tenantId, organizationId, setLastTraceId }: OrganizationDetailContentProps) {
  const organizationQuery = useQuery({
    queryKey: queryKeys.crmOrganization(tenantId, organizationId),
    enabled: Boolean(organizationId),
    queryFn: async () => {
      const response = await getCrmOrganization(tenantId, organizationId);
      setLastTraceId(response.traceId);
      return response.data.organization;
    },
  });

  if (organizationQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando organizacion..."
        hint="Sincronizando detalle de la organizacion."
      />
    );
  }

  if (organizationQuery.error) {
    const err = organizationQuery.error;
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

  const organization = organizationQuery.data;
  if (!organization) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
        No encontramos la organizacion.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-background/70 p-4">
        <h2 className="text-lg font-semibold">{organization.name}</h2>
        <p className="text-sm text-muted-foreground">Dominio: {organization.domain ?? "Sin dominio"}</p>
        <p className="text-sm text-muted-foreground">Industria: {organization.industry ?? "Sin industria"}</p>
        <p className="text-xs text-muted-foreground">Activa: {organization.isActive ? "Si" : "No"}</p>
      </div>

      <Link href="/app/crm/organizations" className="text-sm text-primary underline-offset-2 hover:underline">
        Volver a organizaciones
      </Link>
    </div>
  );
}
