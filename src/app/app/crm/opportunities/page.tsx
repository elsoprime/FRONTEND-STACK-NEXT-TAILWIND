"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import {
  changeCrmOpportunityStage,
  createCrmOpportunity,
  deleteCrmOpportunity,
  listCrmContacts,
  listCrmOpportunities,
  listCrmOrganizations,
  updateCrmOpportunity,
} from "@/features/crm/crm.service";
import { resolveCrmErrorMessage } from "@/features/crm/error-code-map";
import { crmOpportunityStageSchema, type CrmOpportunityStage } from "@/features/crm/crm.schemas";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

const STAGE_OPTIONS = crmOpportunityStageSchema.options;

export default function CrmOpportunitiesPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "",
    contactId: "",
    organizationId: "",
    expectedCloseDate: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stageUpdates, setStageUpdates] = useState<Record<string, CrmOpportunityStage>>({});

  const resetForm = () => {
    setEditingId(null);
    setFormState({
      title: "",
      description: "",
      amount: "",
      currency: "",
      contactId: "",
      organizationId: "",
      expectedCloseDate: "",
    });
  };

  return (
    <TenantPageShell
      eyebrow="CRM"
      title="Oportunidades"
      description="Gestiona pipeline comercial, montos y etapas del tenant activo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="CRM" config={MODULE_GUARDS.crm}>
            <OpportunitiesContent
              tenantId={tenant.id}
              roleKey={membership.roleKey}
              setLastTraceId={setLastTraceId}
              queryClient={queryClient}
              editingId={editingId}
              setEditingId={setEditingId}
              formState={formState}
              setFormState={setFormState}
              resetForm={resetForm}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              stageUpdates={stageUpdates}
              setStageUpdates={setStageUpdates}
            />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type OpportunitiesContentProps = {
  tenantId: string;
  roleKey: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  editingId: string | null;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  formState: {
    title: string;
    description: string;
    amount: string;
    currency: string;
    contactId: string;
    organizationId: string;
    expectedCloseDate: string;
  };
  setFormState: Dispatch<SetStateAction<OpportunitiesContentProps["formState"]>>;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
  stageUpdates: Record<string, CrmOpportunityStage>;
  setStageUpdates: Dispatch<SetStateAction<Record<string, CrmOpportunityStage>>>;
};

function OpportunitiesContent({
  tenantId,
  roleKey,
  setLastTraceId,
  queryClient,
  editingId,
  setEditingId,
  formState,
  setFormState,
  resetForm,
  errorMessage,
  setErrorMessage,
  stageUpdates,
  setStageUpdates,
}: OpportunitiesContentProps) {
  const opportunitiesQuery = useQuery({
    queryKey: queryKeys.crmOpportunities(tenantId),
    queryFn: async () => listCrmOpportunities(tenantId, { page: 1, limit: 50 }),
  });

  const contactsQuery = useQuery({
    queryKey: queryKeys.crmContacts(tenantId),
    queryFn: async () => listCrmContacts(tenantId, { page: 1, limit: 100 }),
  });

  const organizationsQuery = useQuery({
    queryKey: queryKeys.crmOrganizations(tenantId),
    queryFn: async () => listCrmOrganizations(tenantId, { page: 1, limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formState.title.trim()) {
        throw new Error("El titulo es obligatorio.");
      }

      const amountValue = formState.amount ? Number(formState.amount) : undefined;
      if (formState.amount && Number.isNaN(amountValue)) {
        throw new Error("El monto debe ser numerico.");
      }

      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        amount: amountValue,
        currency: formState.currency.trim().toUpperCase() || undefined,
        contactId: formState.contactId || undefined,
        organizationId: formState.organizationId || undefined,
        expectedCloseDate: formState.expectedCloseDate.trim() || undefined,
      };

      if (editingId) {
        return updateCrmOpportunity(tenantId, editingId, payload);
      }

      return createCrmOpportunity(tenantId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.crmOpportunities(tenantId) });
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

  const deleteMutation = useMutation({
    mutationFn: async (opportunityId: string) => deleteCrmOpportunity(tenantId, opportunityId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.crmOpportunities(tenantId) });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveCrmErrorMessage(error.code, error.message));
      }
    },
  });

  const stageMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      const stage = stageUpdates[opportunityId];
      if (!stage) {
        throw new Error("Selecciona una etapa valida.");
      }
      return changeCrmOpportunityStage(tenantId, opportunityId, { stage });
    },
    onSuccess: (response, opportunityId) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.crmOpportunities(tenantId) });
      setStageUpdates((prev) => ({ ...prev, [opportunityId]: response.data.opportunity.stage }));
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveCrmErrorMessage(error.code, error.message));
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    },
  });

  const canUpdateStage = hasTenantPermission(roleKey, TENANT_PERMISSION_KEYS.CRM_STAGE_UPDATE);

  if (opportunitiesQuery.isLoading || contactsQuery.isLoading || organizationsQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando oportunidades..."
        hint="Sincronizando pipeline, contactos y organizaciones."
      />
    );
  }

  const firstError = opportunitiesQuery.error ?? contactsQuery.error ?? organizationsQuery.error;
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

  const opportunities = opportunitiesQuery.data?.data.items ?? [];
  const contacts = contactsQuery.data?.data.items ?? [];
  const organizations = organizationsQuery.data?.data.items ?? [];

  const resolvedContacts = new Map(
    contacts.map((contact) => [contact.id, `${contact.firstName} ${contact.lastName}`]),
  );
  const resolvedOrganizations = new Map(organizations.map((org) => [org.id, org.name]));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{editingId ? "Editar oportunidad" : "Nueva oportunidad"}</p>
            <p className="text-xs text-muted-foreground">Registra pipeline comercial con monto y fechas estimadas.</p>
          </div>
          <Button size="sm" variant="outline" onClick={resetForm}>
            Limpiar
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Titulo</label>
            <Input
              value={formState.title}
              onChange={(event) => setFormState({ ...formState, title: event.target.value })}
              placeholder="Proyecto CRM"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Monto (opcional)</label>
            <Input
              type="number"
              value={formState.amount}
              onChange={(event) => setFormState({ ...formState, amount: event.target.value })}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Moneda (ISO 3)</label>
            <Input
              value={formState.currency}
              onChange={(event) => setFormState({ ...formState, currency: event.target.value })}
              placeholder="USD"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Fecha estimada (ISO)</label>
            <Input
              value={formState.expectedCloseDate}
              onChange={(event) => setFormState({ ...formState, expectedCloseDate: event.target.value })}
              placeholder="2026-12-31T00:00:00-03:00"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Contacto (opcional)</label>
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
            <label className="field-label">Organizacion (opcional)</label>
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
          <div className="space-y-2 md:col-span-2">
            <label className="field-label">Descripcion (opcional)</label>
            <Input
              value={formState.description}
              onChange={(event) => setFormState({ ...formState, description: event.target.value })}
              placeholder="Descripcion de la oportunidad"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {editingId ? "Actualizar oportunidad" : "Crear oportunidad"}
          </Button>
          {editingId ? (
            <Button size="sm" variant="outline" onClick={resetForm}>
              Cancelar edicion
            </Button>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pipeline registrado</h2>
          <Link href="/app/crm" className="text-sm text-primary underline-offset-2 hover:underline">
            Volver al overview
          </Link>
        </div>
        {opportunities.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
            Sin oportunidades registradas.
          </div>
        ) : (
          <div className="space-y-2">
            {opportunities.map((opportunity) => {
              const stageValue = stageUpdates[opportunity.id] ?? opportunity.stage;
              return (
                <div
                  key={opportunity.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/80 bg-background/70 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{opportunity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {resolvedOrganizations.get(opportunity.organizationId ?? "") ?? "Sin organizacion"}
                        {opportunity.contactId
                          ? ` · ${resolvedContacts.get(opportunity.contactId) ?? "Contacto"}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/app/crm/opportunities/${opportunity.id}`}
                        className="text-sm text-primary underline-offset-2 hover:underline"
                      >
                        Ver detalle
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(opportunity.id);
                          setFormState({
                            title: opportunity.title,
                            description: opportunity.description ?? "",
                            amount: opportunity.amount?.toString() ?? "",
                            currency: opportunity.currency ?? "",
                            contactId: opportunity.contactId ?? "",
                            organizationId: opportunity.organizationId ?? "",
                            expectedCloseDate: opportunity.expectedCloseDate ?? "",
                          });
                        }}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(opportunity.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {opportunity.amount
                        ? `Monto: ${opportunity.amount} ${opportunity.currency ?? ""}`
                        : "Monto no definido"}
                      {opportunity.expectedCloseDate ? ` · Cierre: ${opportunity.expectedCloseDate}` : ""}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="h-9 rounded-md border border-border/80 bg-background/70 px-2 text-xs text-foreground"
                        value={stageValue}
                        onChange={(event) =>
                          setStageUpdates((prev) => ({
                            ...prev,
                            [opportunity.id]: event.target.value as CrmOpportunityStage,
                          }))
                        }
                        disabled={!canUpdateStage}
                      >
                        {STAGE_OPTIONS.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => stageMutation.mutate(opportunity.id)}
                        disabled={!canUpdateStage || stageMutation.isPending}
                      >
                        Actualizar etapa
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



