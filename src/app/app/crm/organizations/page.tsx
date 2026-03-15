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
  createCrmOrganization,
  deleteCrmOrganization,
  listCrmOrganizations,
  updateCrmOrganization,
} from "@/features/crm/crm.service";
import { resolveCrmErrorMessage } from "@/features/crm/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function CrmOrganizationsPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ name: "", domain: "", industry: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFormState({ name: "", domain: "", industry: "" });
  };

  return (
    <TenantPageShell
      eyebrow="CRM"
      title="Organizaciones"
      description="Gestiona organizaciones y cuentas principales del tenant activo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="CRM" config={MODULE_GUARDS.crm}>
            <OrganizationsContent
              tenantId={tenant.id}
              setLastTraceId={setLastTraceId}
              queryClient={queryClient}
              editingId={editingId}
              setEditingId={setEditingId}
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

type OrganizationsContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  formState: {
    name: string;
    domain: string;
    industry: string;
  };
  setFormState: (value: OrganizationsContentProps["formState"]) => void;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function OrganizationsContent({
  tenantId,
  setLastTraceId,
  queryClient,
  editingId,
  setEditingId,
  formState,
  setFormState,
  resetForm,
  errorMessage,
  setErrorMessage,
}: OrganizationsContentProps) {
  const organizationsQuery = useQuery({
    queryKey: queryKeys.crmOrganizations(tenantId),
    queryFn: async () => listCrmOrganizations(tenantId, { page: 1, limit: 50 }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formState.name.trim()) {
        throw new Error("Nombre es obligatorio.");
      }

      const payload = {
        name: formState.name.trim(),
        domain: formState.domain.trim() || undefined,
        industry: formState.industry.trim() || undefined,
      };

      if (editingId) {
        return updateCrmOrganization(tenantId, editingId, payload);
      }

      return createCrmOrganization(tenantId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.crmOrganizations(tenantId) });
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
    mutationFn: async (organizationId: string) => deleteCrmOrganization(tenantId, organizationId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.crmOrganizations(tenantId) });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveCrmErrorMessage(error.code, error.message));
      }
    },
  });

  if (organizationsQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando organizaciones..."
        hint="Sincronizando cuentas corporativas."
      />
    );
  }

  if (organizationsQuery.error) {
    const err = organizationsQuery.error;
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

  const organizations = organizationsQuery.data?.data.items ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{editingId ? "Editar organizacion" : "Nueva organizacion"}</p>
            <p className="text-xs text-muted-foreground">Registra cuentas principales para asociar contactos.</p>
          </div>
          <Button size="sm" variant="outline" onClick={resetForm}>
            Limpiar
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Nombre</label>
            <Input
              value={formState.name}
              onChange={(event) => setFormState({ ...formState, name: event.target.value })}
              placeholder="Nombre de la organizacion"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Dominio (opcional)</label>
            <Input
              value={formState.domain}
              onChange={(event) => setFormState({ ...formState, domain: event.target.value })}
              placeholder="empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Industria (opcional)</label>
            <Input
              value={formState.industry}
              onChange={(event) => setFormState({ ...formState, industry: event.target.value })}
              placeholder="Retail, SaaS, etc."
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {editingId ? "Actualizar organizacion" : "Crear organizacion"}
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
          <h2 className="text-lg font-semibold">Organizaciones registradas</h2>
          <Link href="/app/crm" className="text-sm text-primary underline-offset-2 hover:underline">
            Volver al overview
          </Link>
        </div>
        {organizations.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
            Sin organizaciones registradas.
          </div>
        ) : (
          <div className="space-y-2">
            {organizations.map((organization) => (
              <div key={organization.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/70 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{organization.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {organization.domain ?? "Sin dominio"} · {organization.industry ?? "Sin industria"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/app/crm/organizations/${organization.id}`} className="text-sm text-primary underline-offset-2 hover:underline">
                    Ver detalle
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => {
                      setEditingId(organization.id);
                      setFormState({
                        name: organization.name,
                        domain: organization.domain ?? "",
                        industry: organization.industry ?? "",
                      });
                    }}
                  >
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(organization.id)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



