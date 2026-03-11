import { SecurityTwoFactorPanel } from "@/components/auth/security-two-factor-panel";

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seguridad</h1>
        <p className="text-sm text-muted-foreground">
          Administra 2FA, códigos de recuperación y renovación de sesión headless.
        </p>
      </div>
      <SecurityTwoFactorPanel />
    </div>
  );
}
