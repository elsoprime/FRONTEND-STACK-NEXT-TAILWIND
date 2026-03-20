"use client";

import { useSearchParams } from "next/navigation";
import { ProfileSettingsWorkspace, resolveProfileTabKey } from "@/components/modules/profile/profile-settings-workspace";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";

export default function ProfileSettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = resolveProfileTabKey(searchParams.get("tab"));

  return (
    <TenantPageShell
      eyebrow="Settings"
      title="Perfil y seguridad"
      description="Workspace unificado para identidad del usuario, proteccion de acceso y vistas escalables del modulo personal."
      breadcrumbItems={[{ label: "Dashboard", href: "/app" }, { label: "Perfil y seguridad" }]}
    >
      <ProfileSettingsWorkspace initialTab={initialTab} />
    </TenantPageShell>
  );
}
