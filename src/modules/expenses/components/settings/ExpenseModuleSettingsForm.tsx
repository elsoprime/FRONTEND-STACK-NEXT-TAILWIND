"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <section className="rounded-2xl border border-border/80 bg-card/95 p-5">
        <p className="text-sm text-muted-foreground">Cargando configuracion de expenses...</p>
      </section>
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5">
        <p className="text-sm text-destructive">No fue posible cargar configuracion del modulo.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-card/95 p-5">
      <header className="space-y-2">
        <h4 className="text-lg font-semibold tracking-tight text-foreground">Politicas del modulo</h4>
        <p className="text-sm text-muted-foreground">
          Define reglas globales de aprobacion, limites y exportacion.
        </p>
        {!canUpdateSettings ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Modo solo lectura: tu rol no tiene permiso de actualizacion.
          </p>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Monedas permitidas (CSV)</span>
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
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Monto maximo sin revision</span>
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Modo de aprobacion</span>
          <select
            className="h-10 w-full rounded-md border border-border/80 bg-background/70 px-2 text-sm text-foreground"
            value={draft.approvalMode}
            onChange={(event) =>
              setLocalDraft((state) => ({
                ...(state ?? draft),
                approvalMode: event.target.value as ExpenseApprovalMode,
              }))
            }
            disabled={!canUpdateSettings}
          >
            <option value="single_step">single_step</option>
            <option value="multi_step">multi_step</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Maximo items por operacion bulk</span>
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

      <label className="inline-flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm text-foreground">
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

      <div className="flex items-center justify-between gap-3">
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
