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
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <LoaderCircle className="size-4 animate-spin" />
          Cargando runtime efectivo...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <article className="rounded-xl border border-red-300 bg-red-50 p-5 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-4" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      </article>
    );
  }

  if (!runtime) {
    return (
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
        <div className="flex items-center gap-3">
          <Settings2 className="size-4" />
          <p className="text-sm font-semibold">
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
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-blue-700 dark:text-blue-400" />
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Plan</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {planId ?? "sin plan asignado"}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Feature Flags activas
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatValues(featureFlagKeys)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Estado por modulo
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {RUNTIME_MODULE_LABELS.map((module) => {
            const state = resolveTenantModuleState(runtime, module.key);

            return (
              <div
                key={module.key}
                className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {module.label}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {resolveModuleStateCopy(state)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Catalogo esperado de features
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {RUNTIME_FEATURE_LABELS.map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {feature.label}
              </span>
              {hasTenantFeatureFlag(runtime, feature.key) ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <ShieldCheck className="size-3" />
                  Activa
                </span>
              ) : (
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
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
