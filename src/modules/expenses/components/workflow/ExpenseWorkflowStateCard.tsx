"use client";

import {
  Ban,
  CircleCheckBig,
  Clock3,
  HandCoins,
  RotateCcw,
  Send,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type ExpenseRequest, type ExpenseRequestStatus } from "@/lib/api/expenses.types";

type StatusMeta = {
  label: string;
  hint: string;
  tone: "slate" | "amber" | "cyan" | "emerald" | "rose" | "zinc";
  icon: typeof Send;
  nextStep: string;
};

const STATUS_META: Record<ExpenseRequestStatus, StatusMeta> = {
  draft: {
    label: "Borrador",
    hint: "La solicitud aun no fue enviada al flujo de aprobacion.",
    tone: "zinc",
    icon: Send,
    nextStep: "Enviar para revision",
  },
  submitted: {
    label: "En revision",
    hint: "La cola operativa tiene esta solicitud pendiente de decision.",
    tone: "cyan",
    icon: Clock3,
    nextStep: "Aprobar, devolver o rechazar",
  },
  returned: {
    label: "Devuelta",
    hint: "La solicitud volvio al solicitante con observaciones.",
    tone: "amber",
    icon: RotateCcw,
    nextStep: "Corregir y reenviar",
  },
  approved: {
    label: "Aprobada",
    hint: "La solicitud ya fue aprobada y puede avanzar a pago.",
    tone: "emerald",
    icon: CircleCheckBig,
    nextStep: "Marcar como pagada",
  },
  rejected: {
    label: "Rechazada",
    hint: "El flujo termino con rechazo operativo.",
    tone: "rose",
    icon: TriangleAlert,
    nextStep: "Crear una nueva solicitud si corresponde",
  },
  paid: {
    label: "Pagada",
    hint: "La solicitud quedo conciliada con pago registrado.",
    tone: "emerald",
    icon: HandCoins,
    nextStep: "Sin acciones adicionales",
  },
  canceled: {
    label: "Cancelada",
    hint: "La solicitud fue cerrada sin continuar el flujo.",
    tone: "slate",
    icon: Ban,
    nextStep: "Sin acciones adicionales",
  },
};

const STATUS_TONE_CLASSES: Record<StatusMeta["tone"], string> = {
  slate: "border-slate-400/25 bg-slate-500/10 text-slate-700 dark:text-slate-100",
  amber: "border-amber-300/35 bg-amber-400/10 text-amber-700 dark:text-amber-100",
  cyan: "border-cyan-300/35 bg-cyan-400/10 text-cyan-700 dark:text-cyan-100",
  emerald: "border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100",
  rose: "border-rose-300/35 bg-rose-400/10 text-rose-700 dark:text-rose-100",
  zinc: "border-zinc-300/35 bg-zinc-400/10 text-zinc-700 dark:text-zinc-100",
};

export function getExpenseStatusMeta(status: ExpenseRequestStatus): StatusMeta {
  return STATUS_META[status];
}

export function formatExpenseAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatExpenseDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ExpenseStatusBadge({ status }: { status: ExpenseRequestStatus }) {
  const meta = getExpenseStatusMeta(status);
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1", STATUS_TONE_CLASSES[meta.tone])}
    >
      <Icon className="size-3.5" />
      {meta.label}
    </Badge>
  );
}

export function ExpenseWorkflowStateCard({ request }: { request: ExpenseRequest }) {
  const meta = getExpenseStatusMeta(request.status);
  const Icon = meta.icon;

  return (
    <article className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Estado actual
          </p>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl border",
                STATUS_TONE_CLASSES[meta.tone],
              )}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{meta.label}</h3>
              <p className="text-sm text-muted-foreground">{meta.hint}</p>
            </div>
          </div>
        </div>
        <ExpenseStatusBadge status={request.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-border/80 bg-background/72 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Siguiente paso
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{meta.nextStep}</p>
        </article>
        <article className="rounded-2xl border border-border/80 bg-background/72 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Monto
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {formatExpenseAmount(request.amount, request.currency)}
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ExpenseStateField label="Enviada" value={formatExpenseDate(request.submittedAt ?? request.createdAt)} />
        <ExpenseStateField label="Aprobada" value={request.approvedAt ? formatExpenseDate(request.approvedAt) : "Pendiente"} />
        <ExpenseStateField label="Pagada" value={request.paidAt ? formatExpenseDate(request.paidAt) : "Pendiente"} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ExpenseStateField label="Cancelada" value={request.canceledAt ? formatExpenseDate(request.canceledAt) : "No"} />
        <ExpenseStateField label="Motivo rechazo" value={request.rejectionReasonCode ?? "Sin rechazo"} />
      </div>
    </article>
  );
}

function ExpenseStateField({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-border/80 bg-background/72 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </article>
  );
}
