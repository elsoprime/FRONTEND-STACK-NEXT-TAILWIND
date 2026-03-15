"use client";

import { AlertTriangle, CircleHelp, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TenantDashboardInteractionGuideProps = {
  lastDomainCode: string | null;
  lastTraceId: string | null;
};

type RuleItem = {
  code: string;
  title: string;
  instruction: string;
  tone: "warning" | "danger" | "info";
};

const RULES: RuleItem[] = [
  {
    code: "TENANT_MEMBER_LIMIT_REACHED",
    title: "Limite de miembros alcanzado",
    instruction: "Upgrade de plan o depura membresias activas antes de reenviar invitaciones.",
    tone: "warning",
  },
  {
    code: "RBAC_PERMISSION_DENIED",
    title: "Accion restringida por permisos",
    instruction: "Solicita rol owner o permiso operativo para ejecutar acciones de tenant.",
    tone: "danger",
  },
  {
    code: "GEN_INTERNAL_ERROR",
    title: "Error inesperado con soporte",
    instruction: "Comparte el traceId al equipo de soporte para diagnostico backend.",
    tone: "info",
  },
];

const RULE_TONE_CLASSNAMES: Record<RuleItem["tone"], string> = {
  warning:
    "border-amber-300/80 bg-amber-50/80 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
  danger:
    "border-destructive/35 bg-destructive/10 text-destructive dark:border-destructive/45 dark:bg-destructive/15",
  info: "border-accent/35 bg-accent/10 text-foreground",
};

function resolveIcon(tone: RuleItem["tone"]) {
  if (tone === "danger") {
    return ShieldAlert;
  }

  if (tone === "warning") {
    return AlertTriangle;
  }

  return CircleHelp;
}

export function TenantDashboardInteractionGuide({
  lastDomainCode,
  lastTraceId,
}: TenantDashboardInteractionGuideProps) {
  return (
    <article className="surface-card rounded-2xl p-5">
      <header className="space-y-2">
        <p className="label-kicker text-primary/90">Guia de Interaccion</p>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          Estados de error, alertas y validaciones
        </h3>
        <p className="text-sm text-muted-foreground">
          El dashboard comunica errores por `error.code` y preserva `traceId` para soporte.
        </p>
      </header>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {RULES.map((rule) => {
          const Icon = resolveIcon(rule.tone);

          return (
            <section
              key={rule.code}
              className={cn("rounded-xl border px-3 py-3", RULE_TONE_CLASSNAMES[rule.tone])}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon className="mt-0.5 size-4 shrink-0" />
                <Badge variant="outline" className="border-current/30 bg-transparent text-[10px]">
                  {rule.code}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-semibold">{rule.title}</p>
              <p className="mt-1 text-sm">{rule.instruction}</p>
            </section>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Ultimo codigo de dominio:</span>
        <Badge variant="outline" className="border-border/80 bg-background/70 text-foreground">
          {lastDomainCode ?? "N/A"}
        </Badge>
        <span>TraceId soporte:</span>
        <Badge variant="outline" className="border-border/80 bg-background/70 font-mono text-foreground">
          {lastTraceId ?? "sin traza"}
        </Badge>
      </div>
    </article>
  );
}
