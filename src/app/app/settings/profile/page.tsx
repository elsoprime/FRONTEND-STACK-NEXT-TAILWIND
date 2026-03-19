"use client";

import Link from "next/link";
import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";
import { useSessionStore } from "@/store/session-store";

function formatUserName(firstName: string, lastName: string | null): string {
  return lastName ? `${firstName} ${lastName}` : firstName;
}

function buildInitials(firstName: string, lastName: string | null): string {
  const a = firstName.charAt(0).toUpperCase();
  const b = lastName?.charAt(0).toUpperCase() ?? "";
  return `${a}${b}`;
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
      description="Vista profesional de identidad, sesion actual y controles de seguridad del usuario activo."
      actions={ACTIONS}
    >
      <TenantContextGate>
        {({ membership, tenant }) => (
          <div className="space-y-5">
            <article className="surface-card rounded-xl border-border/90 bg-card/95 p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/35 bg-primary/12 text-lg font-bold text-primary">
                  {user ? (
                    buildInitials(user.firstName, user.lastName)
                  ) : (
                    <UserRound className="size-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-foreground">
                    {user ? formatUserName(user.firstName, user.lastName) : "Usuario no disponible"}
                  </p>
                  <p className="truncate text-sm dashboard-text-muted">
                    {user?.email ?? "No disponible"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/35 bg-primary/12 font-semibold text-primary"
                  >
                    Tenant: {tenant.name}
                  </Badge>
                  <Badge variant="outline" className="font-semibold">
                    Rol: {membership.roleKey}
                  </Badge>
                </div>
              </div>
            </article>

            <div className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-xl border border-border/85 bg-background/84 p-4">
                <p className="field-label">Sesion expira</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {sessionExpiresAt ?? "No disponible"}
                </p>
              </article>

              <article className="rounded-xl border border-border/85 bg-background/84 p-4">
                <p className="field-label">Tenant activo</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{tenant.name}</p>
              </article>

              <article className="rounded-xl border border-border/85 bg-background/84 p-4">
                <p className="field-label">Rol actual</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{membership.roleKey}</p>
              </article>
            </div>

            <article className="surface-card rounded-xl border-border/90 bg-card/95 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Seguridad de cuenta
                    </h2>
                  </div>
                  <p className="mt-1 text-sm dashboard-text-muted">
                    Configura 2FA, codigos recovery y cambio de contrasena desde una sola ruta.
                  </p>
                </div>

                <Link href="/app/settings/security">
                  <Button variant="primary">
                    <LockKeyhole className="size-4" />
                    Abrir seguridad
                  </Button>
                </Link>
              </div>
            </article>
          </div>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

