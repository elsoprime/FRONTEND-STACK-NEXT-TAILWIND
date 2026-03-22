"use client";

import type { ReactNode } from "react";
import { CircleCheckBig, CircleX, Info, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ExpenseActionFeedbackStatus = "idle" | "success" | "partial" | "error";

export type ExpenseActionFeedbackItem = {
  id: string;
  label?: string;
  success: boolean;
  code?: string;
  message?: string;
};

export type ExpenseActionFeedbackProps = {
  title: string;
  description?: string;
  status: ExpenseActionFeedbackStatus;
  traceId?: string | null;
  counts?: {
    processed: number;
    succeeded: number;
    failed: number;
  };
  items?: readonly ExpenseActionFeedbackItem[];
  children?: ReactNode;
  className?: string;
};

const STATUS_STYLES: Record<
  ExpenseActionFeedbackStatus,
  {
    icon: typeof Info;
    containerClassName: string;
    badgeLabel: string;
    badgeVariant: "default" | "secondary" | "outline" | "destructive";
    toneClassName: string;
  }
> = {
  idle: {
    icon: Info,
    containerClassName: "border-border/70 bg-background/82 text-foreground",
    badgeLabel: "Preparado",
    badgeVariant: "outline",
    toneClassName: "text-primary",
  },
  success: {
    icon: CircleCheckBig,
    containerClassName: "border-emerald-300/35 bg-emerald-400/10 text-foreground",
    badgeLabel: "Exito",
    badgeVariant: "default",
    toneClassName: "text-emerald-700 dark:text-emerald-100",
  },
  partial: {
    icon: TriangleAlert,
    containerClassName: "border-amber-300/35 bg-amber-400/10 text-foreground",
    badgeLabel: "Parcial",
    badgeVariant: "secondary",
    toneClassName: "text-amber-700 dark:text-amber-100",
  },
  error: {
    icon: CircleX,
    containerClassName: "border-destructive/35 bg-destructive/10 text-foreground",
    badgeLabel: "Error",
    badgeVariant: "destructive",
    toneClassName: "text-destructive dark:text-red-200",
  },
};

function formatCount(value: number): string {
  return new Intl.NumberFormat("es-CL").format(value);
}

export function ExpenseActionFeedback({
  title,
  description,
  status,
  traceId,
  counts,
  items,
  children,
  className,
}: ExpenseActionFeedbackProps) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;

  return (
    <article className={cn("rounded-2xl border px-4 py-4 shadow-sm", style.containerClassName, className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl border border-current/10 bg-background/70">
          <Icon className={cn("size-4", style.toneClassName)} />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
            <Badge variant={style.badgeVariant} className="rounded-full">
              {style.badgeLabel}
            </Badge>
          </div>

          {description ? <p className="text-sm leading-relaxed text-muted-foreground">{description}</p> : null}

          {counts ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">
                Procesados: {formatCount(counts.processed)}
              </Badge>
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">
                Exitosos: {formatCount(counts.succeeded)}
              </Badge>
              <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">
                Fallidos: {formatCount(counts.failed)}
              </Badge>
            </div>
          ) : null}

          {children ? <div className="rounded-xl border border-border/70 bg-background/72 p-3">{children}</div> : null}

          {items && items.length > 0 ? (
            <div className="space-y-2 pt-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/72 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label ?? item.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.success ? "Operacion correcta" : "Operacion fallida"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-semibold", item.success ? "text-emerald-700 dark:text-emerald-100" : "text-destructive dark:text-red-200")}>
                      {item.success ? "OK" : item.code ?? "ERROR"}
                    </p>
                    {item.message ? <p className="text-xs text-muted-foreground">{item.message}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {traceId ? <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Trace {traceId}</p> : null}
        </div>
      </div>
    </article>
  );
}
