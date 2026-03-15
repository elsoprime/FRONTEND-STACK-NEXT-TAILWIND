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
  createCrmContact,
  deleteCrmContact,
  listCrmContacts,
  listCrmOrganizations,
  updateCrmContact,
} from "@/features/crm/crm.service";
import { resolveCrmErrorMessage } from "@/features/crm/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

export default function CrmContactsPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organizationId: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFormState({ firstName: "", lastName: "", email: "", phone: "", organizationId: "" });
  };

  return (
    <TenantPageShell
      eyebrow="CRM"
      title="Contactos"
      description="Gestiona contactos del tenant activo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="CRM" config={MODULE_GUARDS.crm}>
            <ContactsContent
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

type ContactsContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  formState: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    organizationId: string;
  };
  setFormState: (value: ContactsContentProps["formState"]) => void;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function ContactsContent({
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
}: ContactsContentProps) {
  const contactsQuery = useQuery({
    queryKey: queryKeys.crmContacts(tenantId),
    queryFn: async () => listCrmContacts(tenantId, { page: 1, limit: 50 }),
  });

  const organizationsQuery = useQuery({
    queryKey: queryKeys.crmOrganizations(tenantId),
    queryFn: async () => listCrmOrganizations(tenantId, { page: 1, limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formState.firstName.trim() || !formState.lastName.trim()) {
        throw new Error("Nombre y apellido son obligatorios.");
      }

      const payload = {
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        email: formState.email.trim() || undefined,
        phone: formState.phone.trim() || undefined,
        organizationId: formState.organizationId || undefined,
      };

      if (editingId) {
        return updateCrmContact(tenantId, editingId, payload);
      }

      return createCrmContact(tenantId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.crmContacts(tenantId) });
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
    mutationFn: async (contactId: string) => deleteCrmContact(tenantId, contactId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.crmContacts(tenantId) });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveCrmErrorMessage(error.code, error.message));
      }
    },
  });

  if (contactsQuery.isLoading || organizationsQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando contactos..."
        hint="Sincronizando contactos y organizaciones."
      />
    );
  }

  if (contactsQuery.error || organizationsQuery.error) {
    const err = contactsQuery.error ?? organizationsQuery.error;
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

  const contacts = contactsQuery.data?.data.items ?? [];
  const organizations = organizationsQuery.data?.data.items ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{editingId ? "Editar contacto" : "Nuevo contacto"}</p>
            <p className="text-xs text-muted-foreground">Completa los datos principales del contacto.</p>
          </div>
          <Button size="sm" variant="outline" onClick={resetForm}>
            Limpiar
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Nombre</label>
            <Input
              value={formState.firstName}
              onChange={(event) => setFormState({ ...formState, firstName: event.target.value })}
              placeholder="Nombre"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Apellido</label>
            <Input
              value={formState.lastName}
              onChange={(event) => setFormState({ ...formState, lastName: event.target.value })}
              placeholder="Apellido"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Email</label>
            <Input
              value={formState.email}
              onChange={(event) => setFormState({ ...formState, email: event.target.value })}
              placeholder="contacto@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Telefono</label>
            <Input
              value={formState.phone}
              onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
              placeholder="+56 9 0000 0000"
            />
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
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {editingId ? "Actualizar contacto" : "Crear contacto"}
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
          <h2 className="text-lg font-semibold">Contactos registrados</h2>
          <Link href="/app/crm" className="text-sm text-primary underline-offset-2 hover:underline">
            Volver al overview
          </Link>
        </div>
        {contacts.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
            Sin contactos registrados.
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/70 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{contact.email ?? "Sin email"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/app/crm/contacts/${contact.id}`} className="text-sm text-primary underline-offset-2 hover:underline">
                    Ver detalle
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => {
                      setEditingId(contact.id);
                      setFormState({
                        firstName: contact.firstName,
                        lastName: contact.lastName,
                        email: contact.email ?? "",
                        phone: contact.phone ?? "",
                        organizationId: contact.organizationId ?? "",
                      });
                    }}
                  >
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(contact.id)}>
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



