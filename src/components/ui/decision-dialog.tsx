"use client";

import * as React from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { CircleHelp, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DecisionDialogTone = "default" | "danger";

type DecisionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  tone?: DecisionDialogTone;
  loading?: boolean;
  disabled?: boolean;
  closeOnConfirm?: boolean;
  showCloseButton?: boolean;
  children?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onConfirmError?: (error: unknown) => void;
};

const toneStyles: Record<
  DecisionDialogTone,
  {
    badgeText: string;
    icon: React.ComponentType<{ className?: string }>;
    iconContainerClassName: string;
    confirmVariant: "default" | "destructive";
  }
> = {
  default: {
    badgeText: "Decision clave",
    icon: CircleHelp,
    iconContainerClassName: "bg-primary/12 text-primary border-primary/25",
    confirmVariant: "default",
  },
  danger: {
    badgeText: "Accion sensible",
    icon: TriangleAlert,
    iconContainerClassName: "bg-destructive/12 text-destructive border-destructive/30",
    confirmVariant: "destructive",
  },
};

export function DecisionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  busyLabel = "Procesando...",
  tone = "default",
  loading = false,
  disabled = false,
  closeOnConfirm = true,
  showCloseButton = true,
  children,
  onConfirm,
  onCancel,
  onConfirmError,
}: DecisionDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const currentTone = toneStyles[tone];
  const Icon = currentTone.icon;
  const isBusy = loading || isSubmitting;

  const handleConfirm = async () => {
    if (isBusy || disabled) {
      return;
    }

    if (!onConfirm) {
      if (closeOnConfirm) {
        onOpenChange(false);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm();

      if (closeOnConfirm) {
        onOpenChange(false);
      }
    } catch (error) {
      onConfirmError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isBusy || disabled) {
      return;
    }

    onCancel?.();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy || disabled) {
      return;
    }

    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[90] bg-foreground/24 backdrop-blur-[2px] transition-opacity duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <AlertDialog.Viewport className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6">
          <AlertDialog.Popup className="surface-card w-full max-w-xl overflow-hidden border-border/85 bg-card/95 p-0 transition-[opacity,transform] duration-200 ease-out data-[starting-style]:translate-y-2 data-[starting-style]:scale-[0.985] data-[starting-style]:opacity-0 data-[ending-style]:translate-y-2 data-[ending-style]:scale-[0.985] data-[ending-style]:opacity-0">
            <div className="relative border-b border-border/70 px-5 py-4 sm:px-6">
              <p className="label-kicker text-muted-foreground">{currentTone.badgeText}</p>
              {showCloseButton ? (
                <AlertDialog.Close
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "absolute top-4 right-4 rounded-full",
                  )}
                  aria-label="Cerrar dialogo"
                >
                  <X className="size-4" />
                </AlertDialog.Close>
              ) : null}
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                    currentTone.iconContainerClassName,
                  )}
                >
                  <Icon className="size-5" />
                </div>

                <div className="space-y-1">
                  <AlertDialog.Title className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {title}
                  </AlertDialog.Title>
                  {description ? (
                    <AlertDialog.Description className="text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </AlertDialog.Description>
                  ) : null}
                </div>
              </div>

              {children ? (
                <div className="rounded-xl border border-border/70 bg-background/65 px-4 py-3 text-sm text-foreground/90">
                  {children}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-4"
                  onClick={handleCancel}
                  disabled={isBusy || disabled}
                >
                  {cancelLabel}
                </Button>
                <Button
                  type="button"
                  variant={currentTone.confirmVariant}
                  className="h-10 px-4"
                  onClick={() => void handleConfirm()}
                  disabled={isBusy || disabled}
                >
                  {isBusy ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  {isBusy ? busyLabel : confirmLabel}
                </Button>
              </div>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export type { DecisionDialogProps, DecisionDialogTone };

