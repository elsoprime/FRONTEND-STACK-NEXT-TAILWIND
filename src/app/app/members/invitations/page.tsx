"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import {
  createTenantInvitation,
  revokeTenantInvitation,
} from "@/features/tenant/tenant.service";
import { type MembershipView, type TenantSummary } from "@/features/tenant/tenant.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { useSessionStore } from "@/store/session-store";

export default function TenantInvitationsPage() {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="Miembros"
      title="Invitaciones"
      description="Gestiona invitaciones tenant-scoped para sumar miembros al equipo."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantInvitationsContent
            tenant={tenant}
            membership={membership}
            setLastTraceId={setLastTraceId}
          />
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type TenantInvitationsContentProps = {
  tenant: TenantSummary;
  membership: MembershipView;
  setLastTraceId: (traceId: string | null) => void;
};

function TenantInvitationsContent({ tenant, membership, setLastTraceId }: TenantInvitationsContentProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("tenant:member");
  const [revokeId, setRevokeId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const canInvite = hasTenantPermission(membership.roleKey, TENANT_PERMISSION_KEYS.INVITATIONS_CREATE);
  const canRevoke = hasTenantPermission(membership.roleKey, TENANT_PERMISSION_KEYS.INVITATIONS_REVOKE);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!canInvite) {
        throw new Error(resolveTenantErrorMessage("RBAC_PERMISSION_DENIED"));
      }
      return createTenantInvitation(tenant.id, {
        email: inviteEmail.trim(),
        roleKey: inviteRole as "tenant:member" | "tenant:admin" | "tenant:owner",
      });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setFeedback(`Invitacion enviada a ${response.data.invitation.email}.`);
      setInviteEmail("");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFeedback(resolveTenantErrorMessage(error.code, error.message));
        return;
      }
      setFeedback(error instanceof Error ? error.message : resolveTenantErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!canRevoke) {
        throw new Error(resolveTenantErrorMessage("RBAC_PERMISSION_DENIED"));
      }
      return revokeTenantInvitation(tenant.id, { invitationId: revokeId.trim() });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setFeedback(`Invitacion revocada: ${response.data.invitation.email}.`);
      setRevokeId("");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setFeedback(resolveTenantErrorMessage(error.code, error.message));
        return;
      }
      setFeedback(error instanceof Error ? error.message : resolveTenantErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <p className="text-sm font-semibold">Enviar invitacion</p>
        <p className="text-xs text-muted-foreground">Invita a un nuevo miembro al tenant {tenant.name}.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Email</label>
            <Input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="usuario@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Rol</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
            >
              <option value="tenant:member">tenant:member</option>
              <option value="tenant:admin">tenant:admin</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}>
            Enviar invitacion
          </Button>
          {!canInvite ? (
            <p className="text-xs text-muted-foreground">Esta accion requiere permisos de invitacion.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <p className="text-sm font-semibold">Revocar invitacion</p>
        <p className="text-xs text-muted-foreground">Ingresa el ID de la invitacion a revocar.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">ID de invitacion</label>
            <Input
              value={revokeId}
              onChange={(event) => setRevokeId(event.target.value)}
              placeholder="507f191e810c19729de860ea"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => revokeMutation.mutate()}
            disabled={revokeMutation.isPending}
          >
            Revocar invitacion
          </Button>
          {!canRevoke ? (
            <p className="text-xs text-muted-foreground">Esta accion requiere permisos de revocacion.</p>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <div className="rounded-md border border-border/80 bg-background/70 p-3 text-sm text-foreground">
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
