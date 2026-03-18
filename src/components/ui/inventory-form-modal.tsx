"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InventoryFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  alert?: ReactNode;
  size?: "md" | "lg";
};

const panelSizes = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
} as const;

export function InventoryFormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  alert,
  size = "md",
}: InventoryFormModalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-form-modal-title"
    >
      <div
        className="absolute inset-0 bg-foreground/32 backdrop-blur-[3px]"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 z-[121] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div
          className={cn(
            "surface-card relative w-full overflow-hidden border-border/85 p-0 shadow-2xl",
            panelSizes[size],
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
            <div className="space-y-1">
              <p className="label-kicker text-muted-foreground">Registro operativo</p>
              <h2
                id="inventory-form-modal-title"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={() => onOpenChange(false)}
              aria-label="Cerrar modal"
            >
              <X className="size-4" />
            </Button>
          </div>
          {alert ? <div className="border-b border-border/70 px-5 py-4 sm:px-6">{alert}</div> : null}
          <div className="max-h-[calc(100dvh-18rem)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer ? (
            <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-background/55 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
