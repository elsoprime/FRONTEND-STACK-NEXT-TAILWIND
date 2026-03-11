"use client";

import { useState } from "react";
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

type ActionState = "idle" | "loading" | "success" | "error";

type Message = {
  kind: "success" | "error";
  text: string;
};

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
      setMessage({
        kind: "error",
        text: resolveErrorMessage(error, "Codigo invalido. Reintenta."),
      });
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
      setMessage({
        kind: "error",
        text: resolveErrorMessage(error, "No se pudieron regenerar los codigos."),
      });
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
      setMessage({
        kind: "error",
        text: resolveErrorMessage(error, "No se pudo deshabilitar 2FA."),
      });
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
      const response = await changeCurrentPassword({
        currentPassword,
        newPassword,
      });
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
      setMessage({
        kind: "error",
        text: resolveErrorMessage(error, "No se pudo actualizar la contrasena."),
      });
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
    <div className="space-y-6 rounded-lg border border-border/50 bg-card/50 p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Seguridad</h2>
        <p className="text-sm text-muted-foreground">
          Administra 2FA, codigos de recuperacion, cambio de contrasena y refresh headless.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-md border border-border/40 p-4">
          <h3 className="font-medium">1) Iniciar provision</h3>
          <p className="text-sm text-muted-foreground">
            Envia la configuracion TOTP por el canal seguro registrado.
          </p>
          <Button onClick={handleSetup} disabled={setupState === "loading"}>
            {setupState === "loading" ? "Enviando..." : "Iniciar 2FA"}
          </Button>
        </div>

        <div className="space-y-2 rounded-md border border-border/40 p-4">
          <h3 className="font-medium">2) Confirmar 2FA</h3>
          <label className="text-sm font-medium text-foreground" htmlFor="totp-code">
            Codigo TOTP
          </label>
          <Input
            id="totp-code"
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
          />
          <Button
            onClick={handleConfirm}
            disabled={confirmState === "loading" || confirmCode.length < 6}
          >
            {confirmState === "loading" ? "Confirmando..." : "Confirmar 2FA"}
          </Button>
        </div>

        <div className="space-y-2 rounded-md border border-border/40 p-4">
          <h3 className="font-medium">Regenerar codigos de recuperacion</h3>
          <p className="text-sm text-muted-foreground">
            Usa un codigo TOTP o recovery code actual.
          </p>
          <Input
            id="regen-code"
            value={challenge.code ?? ""}
            onChange={(e) => setChallenge((prev) => ({ ...prev, code: e.target.value }))}
            placeholder="Codigo 2FA (opcional)"
            maxLength={6}
          />
          <Input
            id="regen-recovery"
            value={challenge.recoveryCode ?? ""}
            onChange={(e) => setChallenge((prev) => ({ ...prev, recoveryCode: e.target.value }))}
            placeholder="Codigo de recuperacion (opcional)"
          />
          <Button onClick={handleRegenerate} disabled={regenState === "loading"}>
            {regenState === "loading" ? "Regenerando..." : "Regenerar codigos"}
          </Button>
        </div>

        <div className="space-y-2 rounded-md border border-border/40 p-4">
          <h3 className="font-medium">Deshabilitar 2FA</h3>
          <p className="text-sm text-muted-foreground">
            Se requiere un codigo valido (TOTP o recovery) para desactivar.
          </p>
          <Input
            id="disable-code"
            value={challenge.code ?? ""}
            onChange={(e) => setChallenge((prev) => ({ ...prev, code: e.target.value }))}
            placeholder="Codigo 2FA o deja vacio si usas recovery"
            maxLength={6}
          />
          <Input
            id="disable-recovery"
            value={challenge.recoveryCode ?? ""}
            onChange={(e) => setChallenge((prev) => ({ ...prev, recoveryCode: e.target.value }))}
            placeholder="Codigo de recuperacion (opcional)"
          />
          <Button onClick={handleDisable} disabled={disableState === "loading"}>
            {disableState === "loading" ? "Deshabilitando..." : "Deshabilitar 2FA"}
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-border/40 p-4">
        <h3 className="font-medium">Cambiar contrasena</h3>
        <p className="text-sm text-muted-foreground">
          Actualiza la contrasena actual y revoca otras sesiones activas del usuario.
        </p>
        <Input
          id="change-current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Contrasena actual"
        />
        <Input
          id="change-new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nueva contrasena"
        />
        <Input
          id="change-confirm-password"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="Confirmar nueva contrasena"
        />
        <Button
          onClick={handleChangePassword}
          disabled={
            changePasswordState === "loading" ||
            currentPassword.length < 8 ||
            newPassword.length < 8
          }
        >
          {changePasswordState === "loading" ? "Actualizando..." : "Cambiar contrasena"}
        </Button>
      </div>

      <div className="space-y-2 rounded-md border border-border/40 p-4">
        <h3 className="font-medium">Refresh headless</h3>
        <p className="text-sm text-muted-foreground">
          Uso solo para integraciones externas (no browser). No requiere CSRF ni cookies.
        </p>
        <Button variant="secondary" onClick={handleRefreshHeadless}>
          Probar refresh headless
        </Button>
      </div>

      {message && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            message.kind === "success"
              ? "border-emerald-300/60 bg-emerald-50 text-emerald-800"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
