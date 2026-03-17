import { KeyRound, ShieldCheck, Workflow } from "lucide-react";
import { SecurityTwoFactorPanel } from "@/components/auth/security-two-factor-panel";
import { TenantPageShell, type TenantPageAction } from "@/components/tenant/tenant-page-shell";

const ACTIONS: readonly TenantPageAction[] = [
  { label: "Ir a perfil", href: "/app/settings/profile" },
  { label: "Tenant settings", href: "/app/settings/tenant" },
  { label: "Volver al dashboard", href: "/app" },
];

export default function SecuritySettingsPage() {
  return (
    <TenantPageShell
      eyebrow="Seguridad"
      title="Control de seguridad"
      description="Gestiona 2FA, cambio de contrasena y renovacion de sesiones con una distribucion clara y consistente."
      actions={ACTIONS}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SecurityTwoFactorPanel />

        <aside className="space-y-4">
          <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                Buenas practicas
              </h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm dashboard-text-muted">
              <li>Activa 2FA antes de invitar mas usuarios al tenant.</li>
              <li>Usa codigos de recuperacion en un gestor seguro.</li>
              <li>Rota la contrasena del owner de forma periodica.</li>
            </ul>
          </article>

          <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
            <div className="flex items-center gap-2">
              <Workflow className="size-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                Flujo recomendado
              </h3>
            </div>
            <ol className="mt-3 space-y-2 text-sm dashboard-text-muted">
              <li>1. Iniciar provision 2FA.</li>
              <li>2. Confirmar TOTP.</li>
              <li>3. Generar codigos recovery.</li>
              <li>4. Validar refresh headless.</li>
            </ol>
          </article>

          <article className="surface-card rounded-xl border-border/90 bg-card/95 p-4">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                La configuracion se aplica al usuario actual en tiempo real.
              </p>
            </div>
          </article>
        </aside>
      </div>
    </TenantPageShell>
  );
}
