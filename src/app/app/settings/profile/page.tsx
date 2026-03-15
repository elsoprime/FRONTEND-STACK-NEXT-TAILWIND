"use client";

import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";
import { useSessionStore } from "@/store/session-store";

function formatUserName(firstName: string, lastName: string | null): string {
  return lastName ? `${firstName} ${lastName}` : firstName;
}

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Seguridad", href: "/app/settings/security" },
  { label: "Tenant settings", href: "/app/settings/tenant" },
  { label: "Volver al dashboard", href: "/app" },
];

export default function ProfileSettingsPage() {
  const user = useSessionStore((state) => state.user);
  const sessionExpiresAt = useSessionStore((state) => state.sessionExpiresAt);

  return (
    <TenantPageShell
      eyebrow="Perfil"
      title="Perfil de usuario"
      description="Resumen de identidad de sesion y contexto tenant activo para operaciones seguras."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ membership, tenant }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-lg border border-border/80 bg-background/75 p-4">
              <p className="field-label">Nombre</p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {user ? formatUserName(user.firstName, user.lastName) : "Usuario no disponible"}
              </p>
            </article>

            <article className="rounded-lg border border-border/80 bg-background/75 p-4">
              <p className="field-label">Email</p>
              <p className="mt-2 text-base font-semibold text-foreground">{user?.email ?? "No disponible"}</p>
            </article>

            <article className="rounded-lg border border-border/80 bg-background/75 p-4">
              <p className="field-label">Tenant activo</p>
              <p className="mt-2 text-base font-semibold text-foreground">{tenant.name}</p>
            </article>

            <article className="rounded-lg border border-border/80 bg-background/75 p-4">
              <p className="field-label">Rol actual</p>
              <p className="mt-2 text-base font-semibold text-foreground">{membership.roleKey}</p>
            </article>

            <article className="rounded-lg border border-border/80 bg-background/75 p-4 sm:col-span-2">
              <p className="field-label">Sesion expira</p>
              <p className="mt-2 text-base font-semibold text-foreground">{sessionExpiresAt ?? "No disponible"}</p>
            </article>
          </div>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
