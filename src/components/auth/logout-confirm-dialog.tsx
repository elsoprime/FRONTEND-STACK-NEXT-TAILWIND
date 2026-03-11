"use client";

import { DecisionDialog } from "@/components/ui/decision-dialog";

type LogoutConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  mode?: "current" | "all";
};

function resolveCopy(mode: "current" | "all") {
  if (mode === "all") {
    return {
      title: "Cerrar todas las sesiones activas",
      description:
        "Se revocaran los accesos activos en otros navegadores y dispositivos para este usuario.",
      confirmLabel: "Cerrar todas",
      busyLabel: "Cerrando sesiones...",
      detail:
        "Esta accion afectara todos los dispositivos conectados y puede requerir volver a autenticarse.",
    };
  }

  return {
    title: "Cerrar sesion actual",
    description:
      "Se finalizara la sesion activa en este navegador y se limpiara el estado local del frontend.",
    confirmLabel: "Cerrar sesion",
    busyLabel: "Cerrando sesion...",
    detail:
      "Si tienes cambios sin guardar en otras pantallas, asegurate de guardarlos antes de continuar.",
  };
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  mode = "current",
}: LogoutConfirmDialogProps) {
  const copy = resolveCopy(mode);

  return (
    <DecisionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      cancelLabel="Mantener sesion"
      busyLabel={copy.busyLabel}
      tone="danger"
      loading={loading}
      onConfirm={onConfirm}
    >
      <p>{copy.detail}</p>
    </DecisionDialog>
  );
}

export type { LogoutConfirmDialogProps };
