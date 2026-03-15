"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { getCrmContact } from "@/features/crm/crm.service";
import { resolveCrmErrorMessage } from "@/features/crm/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function CrmContactDetailPage() {
  const params = useParams<{ contactId: string }>();
  const contactId = params?.contactId ?? "";
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="CRM"
      title="Detalle de contacto"
      description="Vista puntual del contacto seleccionado."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="CRM" config={MODULE_GUARDS.crm}>
            <ContactDetailContent tenantId={tenant.id} contactId={contactId} setLastTraceId={setLastTraceId} />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type ContactDetailContentProps = {
  tenantId: string;
  contactId: string;
  setLastTraceId: (traceId: string | null) => void;
};

function ContactDetailContent({ tenantId, contactId, setLastTraceId }: ContactDetailContentProps) {
  const contactQuery = useQuery({
    queryKey: queryKeys.crmContact(tenantId, contactId),
    enabled: Boolean(contactId),
    queryFn: async () => {
      const response = await getCrmContact(tenantId, contactId);
      setLastTraceId(response.traceId);
      return response.data.contact;
    },
  });

  if (contactQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando contacto..."
        hint="Sincronizando detalle del contacto."
      />
    );
  }

  if (contactQuery.error) {
    const err = contactQuery.error;
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

  const contact = contactQuery.data;
  if (!contact) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
        No encontramos el contacto.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-background/70 p-4">
        <h2 className="text-lg font-semibold">{contact.firstName} {contact.lastName}</h2>
        <p className="text-sm text-muted-foreground">{contact.email ?? "Sin email"}</p>
        <p className="text-sm text-muted-foreground">{contact.phone ?? "Sin telefono"}</p>
        <p className="text-xs text-muted-foreground">Organizacion: {contact.organizationId ?? "No asignada"}</p>
      </div>

      <Link href="/app/crm/contacts" className="text-sm text-primary underline-offset-2 hover:underline">
        Volver a contactos
      </Link>
    </div>
  );
}
