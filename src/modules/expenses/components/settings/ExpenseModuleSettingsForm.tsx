"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleHelp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventorySelectClassName } from "@/components/ui/inventory-records-shell";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { ApiRequestError } from "@/lib/api/client";
import { getSettings, updateSettings } from "@/lib/api/expenses.client";
import { type ExpenseApprovalMode } from "@/lib/api/expenses.types";
import { queryKeys } from "@/lib/query/query-keys";
import { useTenantStore } from "@/store/tenant-store";

type SettingsDraft = {
  allowedCurrencies: string;
  maxAmountWithoutReview: string;
  approvalMode: ExpenseApprovalMode;
  bulkMaxItemsPerOperation: string;
  exportsEnabled: boolean;
};

export function ExpenseModuleSettingsForm({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const [localDraft, setLocalDraft] = useState<SettingsDraft | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const defaultDraft: SettingsDraft = {
    allowedCurrencies: "USD",
    maxAmountWithoutReview: "0",
    approvalMode: "single_step",
    bulkMaxItemsPerOperation: "50",
    exportsEnabled: true,
  };

  const canUpdateSettings = hasTenantPermission(
    activeMembership?.roleKey ?? "tenant:member",
    TENANT_PERMISSION_KEYS.EXPENSES_SETTINGS_UPDATE,
  );

  const settingsQuery = useQuery({
    queryKey: queryKeys.expenseSettings(tenantId),
    queryFn: async () => getSettings(tenantId),
  });

  const remoteDraft = settingsQuery.data
    ? {
        allowedCurrencies: settingsQuery.data.allowedCurrencies.join(","),
        maxAmountWithoutReview: String(settingsQuery.data.maxAmountWithoutReview),
        approvalMode: settingsQuery.data.approvalMode,
        bulkMaxItemsPerOperation: String(settingsQuery.data.bulkMaxItemsPerOperation),
        exportsEnabled: settingsQuery.data.exportsEnabled,
      }
    : null;

  const draft = localDraft ?? remoteDraft ?? defaultDraft;

  const mutation = useMutation({
    mutationFn: async () =>
      updateSettings(tenantId, {
        allowedCurrencies: draft.allowedCurrencies
          .split(",")
          .map((currency) => currency.trim().toUpperCase())
          .filter((currency) => currency.length > 0),
        maxAmountWithoutReview: Number(draft.maxAmountWithoutReview),
        approvalMode: draft.approvalMode,
        bulkMaxItemsPerOperation: Number(draft.bulkMaxItemsPerOperation),
        exportsEnabled: draft.exportsEnabled,
      }),
    onSuccess: async () => {
      setFeedback("Configuracion actualizada.");
      setLocalDraft(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenseSettings(tenantId) });
    },
    onError: (error: unknown) => {
      setFeedback(
        error instanceof ApiRequestError || error instanceof Error
          ? error.message
          : "No fue posible actualizar configuracion.",
      );
    },
  });

  if (settingsQuery.isLoading) {
    return (
      <section className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
        <p className="text-sm text-muted-foreground">Cargando configuracion de expenses...</p>
      </section>
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <section className="surface-card rounded-[1.5rem] border border-destructive/40 bg-destructive/10 p-5">
        <p className="text-sm text-destructive">No fue posible cargar configuracion del modulo.</p>
      </section>
    );
  }

  return (
    <section className="surface-card rounded-[1.5rem] border-border/90 bg-card/96 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <h4 className="text-lg font-semibold tracking-tight text-foreground">Politicas del modulo</h4>
          <p className="max-w-xl text-sm text-muted-foreground">
            Reglas globales de aprobacion, limites operativos y exportacion del workspace.
          </p>
        </div>

        <Badge
          variant="outline"
          className={canUpdateSettings ? "rounded-full border-primary/20 bg-primary/8 text-primary" : "rounded-full border-amber-300/35 bg-amber-400/10 text-amber-700 dark:text-amber-100"}
        >
          {canUpdateSettings ? "Editable" : "Solo lectura"}
        </Badge>
      </div>

      <article className="mt-5 rounded-[1.1rem] border border-border/80 bg-background/82 p-4">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <CircleHelp className="mt-0.5 size-4 text-primary" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Guia rapida de politicas</p>
            <p>1. Define monedas permitidas separadas por coma (ej: CLP,USD).</p>
            <p>2. Ajusta el modo de aprobacion segun nivel de control requerido.</p>
            <p>3. Limita operaciones bulk para controlar riesgo operativo.</p>
          </div>
        </div>
      </article>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SettingsSummaryCard label="Monedas" value={settingsQuery.data.allowedCurrencies.join(", ")} />
        <SettingsSummaryCard
          label="Revision automatica"
          value={String(settingsQuery.data.maxAmountWithoutReview)}
        />
        <SettingsSummaryCard label="Modo de aprobacion" value={approvalModeLabel(settingsQuery.data.approvalMode)} />
        <SettingsSummaryCard
          label="Bulk max"
          value={String(settingsQuery.data.bulkMaxItemsPerOperation)}
        />
        <SettingsSummaryCard label="Exportaciones" value={settingsQuery.data.exportsEnabled ? "Activas" : "Bloqueadas"} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="block py-2 text-muted-foreground">Monedas permitidas (CSV)</span>
          <Input
            value={draft.allowedCurrencies}
            onChange={(event) =>
              setLocalDraft((state) => ({
                ...(state ?? draft),
                allowedCurrencies: event.target.value,
              }))
            }
            disabled={!canUpdateSettings}
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="block py-2 text-muted-foreground">Monto maximo sin revision</span>
          <Input
            type="number"
            min="0"
            value={draft.maxAmountWithoutReview}
            onChange={(event) =>
              setLocalDraft((state) => ({
                ...(state ?? draft),
                maxAmountWithoutReview: event.target.value,
              }))
            }
            disabled={!canUpdateSettings}
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="block py-2 text-muted-foreground">Modo de aprobacion</span>
          <select
            className={inventorySelectClassName}
            value={draft.approvalMode}
            onChange={(event) =>
              setLocalDraft((state) => ({
                ...(state ?? draft),
                approvalMode: event.target.value as ExpenseApprovalMode,
              }))
            }
            disabled={!canUpdateSettings}
          >
            <option value="single_step">Aprobacion en un paso</option>
            <option value="multi_step">Aprobacion en multiples pasos</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="block py-2 text-muted-foreground">Maximo items por operacion bulk</span>
          <Input
            type="number"
            min="1"
            value={draft.bulkMaxItemsPerOperation}
            onChange={(event) =>
              setLocalDraft((state) => ({
                ...(state ?? draft),
                bulkMaxItemsPerOperation: event.target.value,
              }))
            }
            disabled={!canUpdateSettings}
          />
        </label>
      </div>

      <label className="mt-4 inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/82 px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={draft.exportsEnabled}
          onChange={(event) =>
            setLocalDraft((state) => ({
              ...(state ?? draft),
              exportsEnabled: event.target.checked,
            }))
          }
          disabled={!canUpdateSettings}
        />
        Exportaciones habilitadas
      </label>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
        {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : <span />}
        <Button
          type="button"
          variant="primary"
          onClick={() => mutation.mutate()}
          disabled={!canUpdateSettings || mutation.isPending}
        >
          {mutation.isPending ? "Guardando..." : "Guardar settings"}
        </Button>
      </div>
    </section>
  );
}

function approvalModeLabel(mode: ExpenseApprovalMode): string {
  if (mode === "single_step") {
    return "Aprobacion en un paso";
  }

  return "Aprobacion en multiples pasos";
}

function SettingsSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.2rem] border border-border/80 bg-background/82 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </article>
  );
}