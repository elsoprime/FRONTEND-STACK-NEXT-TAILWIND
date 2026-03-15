"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import {
  createCrmActivity,
  listCrmActivities,
  listCrmContacts,
  listCrmOpportunities,
  listCrmOrganizations,
} from "@/features/crm/crm.service";
import { resolveCrmErrorMessage } from "@/features/crm/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function CrmActivitiesPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [formState, setFormState] = useState({
    type: "",
    note: "",
    contactId: "",
    organizationId: "",
    opportunityId: "",
    occurredAt: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFormState({
      type: "",
      note: "",
      contactId: "",
      organizationId: "",
      opportunityId: "",
      occurredAt: "",
    });
  };

  return (
    <TenantPageShell
      eyebrow="CRM"
      title="Actividades"
      description="Registra actividades comerciales asociadas a contactos, organizaciones u oportunidades."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="CRM" config={MODULE_GUARDS.crm}>
            <ActivitiesContent
              tenantId={tenant.id}
              setLastTraceId={setLastTraceId}
              queryClient={queryClient}
              formState={formState}
              setFormState={setFormState}
              resetForm={resetForm}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type ActivitiesContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  formState: {
    type: string;
    note: string;
    contactId: string;
    organizationId: string;
    opportunityId: string;
    occurredAt: string;
  };
  setFormState: (value: ActivitiesContentProps["formState"]) => void;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function ActivitiesContent({
  tenantId,
  setLastTraceId,
  queryClient,
  formState,
  setFormState,
  resetForm,
  errorMessage,
  setErrorMessage,
}: ActivitiesContentProps) {
  const activitiesQuery = useQuery({
    queryKey: queryKeys.crmActivities(tenantId),
    queryFn: async () => listCrmActivities(tenantId, { page: 1, limit: 50 }),
  });

  const contactsQuery = useQuery({
    queryKey: queryKeys.crmContacts(tenantId),
    queryFn: async () => listCrmContacts(tenantId, { page: 1, limit: 100 }),
  });

  const organizationsQuery = useQuery({
    queryKey: queryKeys.crmOrganizations(tenantId),
    queryFn: async () => listCrmOrganizations(tenantId, { page: 1, limit: 100 }),
  });

  const opportunitiesQuery = useQuery({
    queryKey: queryKeys.crmOpportunities(tenantId),
    queryFn: async () => listCrmOpportunities(tenantId, { page: 1, limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formState.type.trim() || !formState.note.trim()) {
        throw new Error("Tipo y nota son obligatorios.");
      }

      if (!formState.contactId && !formState.organizationId && !formState.opportunityId) {
        throw new Error("Debes asociar la actividad a un contacto, organizacion u oportunidad.");
      }

      const payload = {
        type: formState.type.trim(),
        note: formState.note.trim(),
        contactId: formState.contactId || undefined,
        organizationId: formState.organizationId || undefined,
        opportunityId: formState.opportunityId || undefined,
        occurredAt: formState.occurredAt.trim() || undefined,
      };

      return createCrmActivity(tenantId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.crmActivities(tenantId) });
      setErrorMessage(null);
      resetForm();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveCrmErrorMessage(error.code, error.message));
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : resolveCrmErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  if (activitiesQuery.isLoading || contactsQuery.isLoading || organizationsQuery.isLoading || opportunitiesQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando actividades..."
        hint="Sincronizando referencias y bitacora comercial."
      />
    );
  }

  const firstError = activitiesQuery.error ?? contactsQuery.error ?? organizationsQuery.error ?? opportunitiesQuery.error;
  if (firstError) {
    const message =
      firstError instanceof ApiRequestError
        ? resolveCrmErrorMessage(firstError.code, firstError.message)
        : resolveCrmErrorMessage("GEN_INTERNAL_ERROR");

    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        {message}
      </div>
    );
  }

  const activities = activitiesQuery.data?.data.items ?? [];
  const contacts = contactsQuery.data?.data.items ?? [];
  const organizations = organizationsQuery.data?.data.items ?? [];
  const opportunities = opportunitiesQuery.data?.data.items ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Nueva actividad</p>
            <p className="text-xs text-muted-foreground">Registra llamadas, reuniones o notas comerciales.</p>
          </div>
          <Button size="sm" variant="outline" onClick={resetForm}>
            Limpiar
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Tipo</label>
            <Input
              value={formState.type}
              onChange={(event) => setFormState({ ...formState, type: event.target.value })}
              placeholder="Call, Demo, Follow-up"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Fecha (ISO opcional)</label>
            <Input
              value={formState.occurredAt}
              onChange={(event) => setFormState({ ...formState, occurredAt: event.target.value })}
              placeholder="2026-12-01T10:00:00-03:00"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Contacto</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={formState.contactId}
              onChange={(event) => setFormState({ ...formState, contactId: event.target.value })}
            >
              <option value="">Sin contacto</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="field-label">Organizacion</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={formState.organizationId}
              onChange={(event) => setFormState({ ...formState, organizationId: event.target.value })}
            >
              <option value="">Sin organizacion</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="field-label">Oportunidad</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={formState.opportunityId}
              onChange={(event) => setFormState({ ...formState, opportunityId: event.target.value })}
            >
              <option value="">Sin oportunidad</option>
              {opportunities.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>
                  {opportunity.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="field-label">Nota</label>
            <textarea
              className="min-h-[110px] w-full rounded-md border border-border/80 bg-background/70 px-3 py-2 text-sm text-foreground"
              value={formState.note}
              onChange={(event) => setFormState({ ...formState, note: event.target.value })}
              placeholder="Resumen de la actividad"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Registrar actividad
          </Button>
        </div>

        {errorMessage ? (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bitacora comercial</h2>
          <Link href="/app/crm" className="text-sm text-primary underline-offset-2 hover:underline">
            Volver al overview
          </Link>
        </div>
        {activities.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
            Sin actividades registradas.
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded-lg border border-border/80 bg-background/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activity.type}</p>
                    <p className="text-xs text-muted-foreground">{activity.note}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.occurredAt}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {activity.contactId ? `Contacto: ${activity.contactId}` : null}
                  {activity.organizationId ? ` · Org: ${activity.organizationId}` : null}
                  {activity.opportunityId ? ` · Oportunidad: ${activity.opportunityId}` : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
