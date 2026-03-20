"use client";

import { useState } from "react";
import {
  KeyRound,
  RefreshCcw,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from "lucide-react";
import {
  changeCurrentPassword,
  confirmTwoFactor,
  disableTwoFactor,
  regenerateRecoveryCodes,
  refreshHeadlessSession,
  setupTwoFactor,
} from "@/features/auth/auth.service";
import { type TwoFactorChallengeInput } from "@/features/auth/auth.schemas";
import { resolveAuthErrorMessage } from "@/features/auth/error-code-map";
import { ApiRequestError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ActionState = "idle" | "loading" | "success" | "error";

type Message = {
  kind: "success" | "error";
  text: string;
};

function resolvePanelTone(state: ActionState): string {
  if (state === "error") {
    return "border-destructive/40 bg-destructive/8";
  }

  if (state === "success") {
    return "border-emerald-400/35 bg-emerald-500/8";
  }

  return "border-border/85 bg-background/78";
}

export function SecurityTwoFactorPanel() {
  const [setupState, setSetupState] = useState<ActionState>("idle");
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmState, setConfirmState] = useState<ActionState>("idle");
  const [challenge, setChallenge] = useState<TwoFactorChallengeInput>({});
  const [regenState, setRegenState] = useState<ActionState>("idle");
  const [disableState, setDisableState] = useState<ActionState>("idle");
  const [changePasswordState, setChangePasswordState] = useState<ActionState>("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState<Message | null>(null);

  function resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiRequestError) {
      return resolveAuthErrorMessage(error.code);
    }

    return fallback;
  }

  async function handleSetup() {
    setSetupState("loading");
    setMessage(null);
    try {
      await setupTwoFactor();
      setSetupState("success");
      setMessage({ kind: "success", text: "Provision pendiente: revisa el canal seguro." });
    } catch (error) {
      setSetupState("error");
      setMessage({ kind: "error", text: resolveErrorMessage(error, "No se pudo iniciar 2FA.") });
    }
  }

  async function handleConfirm() {
    setConfirmState("loading");
    setMessage(null);
    try {
      await confirmTwoFactor({ code: confirmCode });
      setConfirmState("success");
      setMessage({ kind: "success", text: "2FA habilitado correctamente." });
    } catch (error) {
      setConfirmState("error");
      setMessage({ kind: "error", text: resolveErrorMessage(error, "Codigo invalido. Reintenta.") });
    }
  }

  async function handleRegenerate() {
    setRegenState("loading");
    setMessage(null);
    try {
      await regenerateRecoveryCodes(challenge);
      setRegenState("success");
      setMessage({ kind: "success", text: "Codigos de recuperacion regenerados." });
    } catch (error) {
      setRegenState("error");
      setMessage({ kind: "error", text: resolveErrorMessage(error, "No se pudieron regenerar los codigos.") });
    }
  }

  async function handleDisable() {
    setDisableState("loading");
    setMessage(null);
    try {
      await disableTwoFactor(challenge);
      setDisableState("success");
      setMessage({ kind: "success", text: "2FA deshabilitado." });
    } catch (error) {
      setDisableState("error");
      setMessage({ kind: "error", text: resolveErrorMessage(error, "No se pudo deshabilitar 2FA.") });
    }
  }

  async function handleChangePassword() {
    setChangePasswordState("loading");
    setMessage(null);

    if (newPassword.length < 8) {
      setChangePasswordState("error");
      setMessage({ kind: "error", text: "La nueva contrasena debe tener al menos 8 caracteres." });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordState("error");
      setMessage({ kind: "error", text: "La confirmacion de contrasena no coincide." });
      return;
    }

    try {
      const response = await changeCurrentPassword({ currentPassword, newPassword });
      setChangePasswordState("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMessage({
        kind: "success",
        text: `Contrasena actualizada. Sesiones revocadas: ${response.data.revokedSessionIds.length}.`,
      });
    } catch (error) {
      setChangePasswordState("error");
      setMessage({ kind: "error", text: resolveErrorMessage(error, "No se pudo actualizar la contrasena.") });
    }
  }

  async function handleRefreshHeadless() {
    setMessage(null);
    try {
      await refreshHeadlessSession();
      setMessage({ kind: "success", text: "Refresh headless OK (modo integraciones)." });
    } catch (error) {
      setMessage({ kind: "error", text: resolveErrorMessage(error, "Refresh headless fallo.") });
    }
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SecurityActionCard
          title="Iniciar provision 2FA"
          description="Envia la configuracion TOTP por el canal seguro registrado."
          icon={Smartphone}
          tone={resolvePanelTone(setupState)}
          action={
            <Button type="button" variant="primary" onClick={handleSetup} disabled={setupState === "loading"}>
              {setupState === "loading" ? "Enviando..." : "Iniciar 2FA"}
            </Button>
          }
        />

        <SecurityActionCard
          title="Confirmar 2FA"
          description="Valida el codigo TOTP para activar la proteccion en la cuenta actual."
          icon={ShieldCheck}
          tone={resolvePanelTone(confirmState)}
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="field-label" htmlFor="totp-code">Codigo TOTP</label>
              <Input
                id="totp-code"
                value={confirmCode}
                onChange={(event) => setConfirmCode(event.target.value)}
                placeholder="123456"
                maxLength={6}
                className="h-10 rounded-md bg-background/85"
              />
            </div>
            <Button type="button" variant="primary" onClick={handleConfirm} disabled={confirmState === "loading" || confirmCode.length < 6}>
              {confirmState === "loading" ? "Confirmando..." : "Confirmar 2FA"}
            </Button>
          </div>
        </SecurityActionCard>

        <SecurityActionCard
          title="Regenerar recovery codes"
          description="Genera nuevos codigos de respaldo usando TOTP o recovery code vigente."
          icon={RefreshCcw}
          tone={resolvePanelTone(regenState)}
        >
          <div className="space-y-3">
            <Input
              id="regen-code"
              value={challenge.code ?? ""}
              onChange={(event) => setChallenge((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="Codigo 2FA (opcional)"
              maxLength={6}
              className="h-10 rounded-md bg-background/85"
            />
            <Input
              id="regen-recovery"
              value={challenge.recoveryCode ?? ""}
              onChange={(event) => setChallenge((prev) => ({ ...prev, recoveryCode: event.target.value }))}
              placeholder="Codigo recovery (opcional)"
              className="h-10 rounded-md bg-background/85"
            />
            <Button type="button" variant="secondary" onClick={handleRegenerate} disabled={regenState === "loading"}>
              {regenState === "loading" ? "Regenerando..." : "Regenerar codigos"}
            </Button>
          </div>
        </SecurityActionCard>

        <SecurityActionCard
          title="Deshabilitar 2FA"
          description="Desactiva 2FA de forma controlada con validacion de codigo vigente."
          icon={ShieldOff}
          tone={resolvePanelTone(disableState)}
        >
          <div className="space-y-3">
            <Input
              id="disable-code"
              value={challenge.code ?? ""}
              onChange={(event) => setChallenge((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="Codigo 2FA o deja vacio"
              maxLength={6}
              className="h-10 rounded-md bg-background/85"
            />
            <Input
              id="disable-recovery"
              value={challenge.recoveryCode ?? ""}
              onChange={(event) => setChallenge((prev) => ({ ...prev, recoveryCode: event.target.value }))}
              placeholder="Codigo recovery (opcional)"
              className="h-10 rounded-md bg-background/85"
            />
            <Button type="button" variant="destructive" onClick={handleDisable} disabled={disableState === "loading"}>
              {disableState === "loading" ? "Deshabilitando..." : "Deshabilitar 2FA"}
            </Button>
          </div>
        </SecurityActionCard>
      </div>

      <SecurityActionCard
        title="Cambiar contrasena"
        description="Actualiza la contrasena actual y revoca otras sesiones del usuario."
        icon={KeyRound}
        tone={resolvePanelTone(changePasswordState)}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            id="change-current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Contrasena actual"
            className="h-10 rounded-md bg-background/85"
          />
          <Input
            id="change-new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Nueva contrasena"
            className="h-10 rounded-md bg-background/85"
          />
          <Input
            id="change-confirm-password"
            type="password"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            placeholder="Confirmar nueva contrasena"
            className="h-10 rounded-md bg-background/85"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleChangePassword}
            disabled={
              changePasswordState === "loading" ||
              currentPassword.length < 8 ||
              newPassword.length < 8
            }
          >
            {changePasswordState === "loading" ? "Actualizando..." : "Cambiar contrasena"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleRefreshHeadless}>
            Probar refresh headless
          </Button>
        </div>
      </SecurityActionCard>

      {message ? (
        <article
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            message.kind === "success"
              ? "border-emerald-400/45 bg-emerald-500/12 text-emerald-100"
              : "border-destructive/45 bg-destructive/12 text-red-200",
          )}
        >
          {message.text}
        </article>
      ) : null}
    </section>
  );
}

function SecurityActionCard({
  title,
  description,
  icon: Icon,
  tone,
  children,
  action,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <article className={cn("surface-card rounded-[1.35rem] p-5", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <div>
            <h4 className="text-base font-semibold tracking-tight text-foreground">{title}</h4>
            <p className="mt-1 text-sm dashboard-text-muted">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}
