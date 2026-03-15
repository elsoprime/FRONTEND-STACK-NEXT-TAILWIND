"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { transferTenantOwnership } from "@/features/tenant/tenant.service";
import { type MembershipView, type TenantSummary } from "@/features/tenant/tenant.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { useSessionStore } from "@/store/session-store";

export default function TenantOwnershipPage() {
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="Tenant"
      title="Transferir ownership"
      description="Transfiere el ownership del tenant a otro usuario."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantOwnershipContent
            tenant={tenant}
            membership={membership}
            setLastTraceId={setLastTraceId}
          />
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type TenantOwnershipContentProps = {
  tenant: TenantSummary;
  membership: MembershipView;
  setLastTraceId: (traceId: string | null) => void;
};

function TenantOwnershipContent({ tenant, membership, setLastTraceId }: TenantOwnershipContentProps) {
  const [targetUserId, setTargetUserId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const canTransfer = hasTenantPermission(membership.roleKey, TENANT_PERMISSION_KEYS.OWNERSHIP_TRANSFER);

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!canTransfer) {
        throw new Error(resolveTenantErrorMessage("RBAC_PERMISSION_DENIED"));
      }
      return transferTenantOwnership(tenant.id, { targetUserId: targetUserId.trim() });
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setFeedback("Ownership transferido correctamente.");
      setTargetUserId("");
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
        <p className="text-sm font-semibold">Usuario destino</p>
        <p className="text-xs text-muted-foreground">
          Ingresa el ID del usuario que recibira el ownership del tenant {tenant.name}.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">User ID</label>
            <Input
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              placeholder="507f191e810c19729de860ea"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => transferMutation.mutate()} disabled={transferMutation.isPending}>
            Transferir ownership
          </Button>
          {!canTransfer ? (
            <p className="text-xs text-muted-foreground">Esta accion requiere permisos de ownership.</p>
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
