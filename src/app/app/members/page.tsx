"use client";

import { useSearchParams } from "next/navigation";
import {
  MembersWorkspace,
  resolveMembersTabKey,
} from "@/components/modules/members/members-workspace";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Abrir ownership", href: "/app/members?tab=ownership", variant: "tertiary" },
  { label: "Volver al dashboard", href: "/app", variant: "outline" },
];

export default function MembersPage() {
  const searchParams = useSearchParams();
  const initialTab = resolveMembersTabKey(searchParams.get("tab"));

  return (
    <TenantPageShell
      eyebrow="Members"
      title="Miembros y acceso"
      description="Workspace para invitaciones, ownership y gobierno de acceso del tenant activo."
      actions={ACTIONS}
      breadcrumbItems={[{ label: "Dashboard", href: "/app" }, { label: "Miembros" }]}
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <MembersWorkspace tenant={tenant} membership={membership} initialTab={initialTab} />
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
