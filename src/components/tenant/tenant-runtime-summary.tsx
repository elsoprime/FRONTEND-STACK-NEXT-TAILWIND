"use client";

import { LoaderCircle, ShieldAlert, ShieldCheck, Settings2 } from "lucide-react";
import {
  hasTenantFeatureFlag,
  resolveTenantModuleState,
} from "@/features/tenant/tenant-runtime-guards";
import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";

type TenantRuntimeSummaryProps = {
  runtime: TenantRuntime | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  title?: string;
  description?: string;
};

const RUNTIME_MODULE_LABELS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "inventory", label: "Inventory" },
  { key: "crm", label: "CRM" },
  { key: "hr", label: "HR" },
];

const RUNTIME_FEATURE_LABELS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "inventory:base", label: "Inventory Base" },
  { key: "inventory:analytics", label: "Inventory Analytics" },
  { key: "crm:base", label: "CRM Base" },
  { key: "hr:base", label: "HR Base" },
];

function formatValues(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "sin valores activos";
}

function resolveModuleStateCopy(state: ReturnType<typeof resolveTenantModuleState>): string {
  switch (state) {
    case "active":
      return "Activo";
    case "enabled":
      return "Habilitado";
    default:
      return "No disponible";
  }
}

function normalizeRuntimeList(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((item): item is string => typeof item === "string");
}

export function TenantRuntimeSummary({
  runtime,
  isLoading = false,
  errorMessage = null,
  title = "Runtime efectivo",
  description = "Estado runtime resuelto desde plan, modulos y feature flags del tenant activo.",
}: TenantRuntimeSummaryProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary/35 bg-primary/14 p-5 text-primary">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <LoaderCircle className="size-4 animate-spin" />
          Cargando runtime efectivo...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <article className="rounded-xl border border-destructive/45 bg-destructive/14 p-5 text-red-200">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-4" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      </article>
    );
  }

  if (!runtime) {
    return (
      <article className="surface-card rounded-xl border-border/85 bg-card/88 p-5">
        <div className="flex items-center gap-3">
          <Settings2 className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-muted-foreground">
            El runtime efectivo todavia no esta disponible para este tenant.
          </p>
        </div>
      </article>
    );
  }

  const featureFlagKeys = normalizeRuntimeList(runtime.featureFlagKeys);
  const planId =
    typeof runtime.planId === "string" && runtime.planId.trim().length > 0 ? runtime.planId : null;

  return (
    <article className="reveal-up surface-card rounded-xl border-border/85 bg-card/88 p-6 [--reveal-delay:40ms]">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-primary" />
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-background/50 p-4">
          <p className="field-label">Plan</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {planId ?? "sin plan asignado"}
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/50 p-4">
          <p className="field-label">
            Feature Flags activas
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {formatValues(featureFlagKeys)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border/80 bg-background/50 p-4">
        <p className="field-label">
          Estado por modulo
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {RUNTIME_MODULE_LABELS.map((module) => {
            const state = resolveTenantModuleState(runtime, module.key);

            return (
              <div
                key={module.key}
                className="rounded-xl border border-border/80 bg-card/60 p-3"
              >
                <p className="text-sm font-semibold text-foreground">
                  {module.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {resolveModuleStateCopy(state)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border/80 bg-background/50 p-4">
        <p className="field-label">
          Catalogo esperado de features
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {RUNTIME_FEATURE_LABELS.map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 px-3 py-2"
            >
              <span className="text-sm font-medium text-foreground">
                {feature.label}
              </span>
              {hasTenantFeatureFlag(runtime, feature.key) ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/45 bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-emerald-200">
                  <ShieldCheck className="size-3" />
                  Activa
                </span>
              ) : (
                <span className="rounded-full border border-border/85 bg-muted/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                  Inactiva
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

