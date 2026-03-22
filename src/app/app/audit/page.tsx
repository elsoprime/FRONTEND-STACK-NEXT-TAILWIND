"use client";

import { useSearchParams } from "next/navigation";
import { AuditWorkspace, resolveAuditTabKey } from "@/components/modules/audit/audit-workspace";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { MODULE_GUARDS, TenantModuleGate } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { useSessionStore } from "@/store/session-store";

export default function AuditPage() {
  const searchParams = useSearchParams();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="Audit"
      title="Auditoria tenant"
      description="Consulta eventos y trazabilidad operacional del tenant activo con paginacion optimizada."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate
            tenant={tenant}
            membership={membership}
            moduleLabel="Audit"
            config={MODULE_GUARDS.audit}
          >
            <AuditWorkspace
              tenantId={tenant.id}
              setLastTraceId={setLastTraceId}
              initialTab={resolveAuditTabKey(searchParams.get("tab"))}
            />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
