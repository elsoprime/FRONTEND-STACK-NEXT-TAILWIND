"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import {
  getHrEmployee,
  getHrEmployeeCompensation,
  updateHrEmployeeCompensation,
} from "@/features/hr/hr.service";
import { resolveHrErrorMessage } from "@/features/hr/error-code-map";
import {
  hrPayFrequencySchema,
  type HrCompensation,
  type HrPayFrequency,
} from "@/features/hr/hr.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

const PAY_FREQUENCIES = hrPayFrequencySchema.options;

export default function HrEmployeeDetailPage() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = params?.employeeId ?? "";
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);

  return (
    <TenantPageShell
      eyebrow="HR"
      title="Detalle de empleado"
      description="Ficha completa del colaborador y su compensacion."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="HR" config={MODULE_GUARDS.hr}>
            <EmployeeDetailContent tenantId={tenant.id} employeeId={employeeId} setLastTraceId={setLastTraceId} />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type EmployeeDetailContentProps = {
  tenantId: string;
  employeeId: string;
  setLastTraceId: (traceId: string | null) => void;
};

type CompensationFormState = {
  salaryAmount: string;
  currency: string;
  payFrequency: HrPayFrequency;
  effectiveFrom: string;
  notes: string;
};

function buildCompensationState(compensation: HrCompensation | null): CompensationFormState {
  if (!compensation) {
    return {
      salaryAmount: "",
      currency: "",
      payFrequency: "monthly",
      effectiveFrom: "",
      notes: "",
    };
  }

  return {
    salaryAmount: compensation.salaryAmount.toString(),
    currency: compensation.currency,
    payFrequency: compensation.payFrequency,
    effectiveFrom: compensation.effectiveFrom,
    notes: compensation.notes ?? "",
  };
}

function EmployeeDetailContent({ tenantId, employeeId, setLastTraceId }: EmployeeDetailContentProps) {
  const employeeQuery = useQuery({
    queryKey: queryKeys.hrEmployee(tenantId, employeeId),
    enabled: Boolean(employeeId),
    queryFn: async () => {
      const response = await getHrEmployee(tenantId, employeeId);
      setLastTraceId(response.traceId);
      return response.data.employee;
    },
  });

  const compensationQuery = useQuery({
    queryKey: queryKeys.hrCompensation(tenantId, employeeId),
    enabled: Boolean(employeeId),
    queryFn: async () => {
      const response = await getHrEmployeeCompensation(tenantId, employeeId);
      setLastTraceId(response.traceId);
      return response.data.compensation;
    },
  });

  if (employeeQuery.isLoading || compensationQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando empleado..."
        hint="Sincronizando perfil y compensacion."
      />
    );
  }

  const compensationNotFound =
    compensationQuery.error instanceof ApiRequestError &&
    compensationQuery.error.code === "HR_COMPENSATION_NOT_FOUND"
      ? compensationQuery.error
      : null;

  const blockingError =
    employeeQuery.error ??
    (compensationQuery.error && !compensationNotFound ? compensationQuery.error : null);

  if (blockingError) {
    const message =
      blockingError instanceof ApiRequestError
        ? resolveHrErrorMessage(blockingError.code, blockingError.message)
        : resolveHrErrorMessage("GEN_INTERNAL_ERROR");

    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        {message}
      </div>
    );
  }

  const employee = employeeQuery.data;
  if (!employee) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
        No encontramos el empleado.
      </div>
    );
  }

  const compensation = compensationQuery.data ?? null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-background/70 p-4">
        <h2 className="text-lg font-semibold">
          {employee.firstName} {employee.lastName}
        </h2>
        <p className="text-sm text-muted-foreground">Codigo: {employee.employeeCode}</p>
        <p className="text-sm text-muted-foreground">Cargo: {employee.jobTitle ?? "No definido"}</p>
        <p className="text-sm text-muted-foreground">Departamento: {employee.department ?? "No definido"}</p>
        <p className="text-sm text-muted-foreground">Estado: {employee.status}</p>
      </div>

      <CompensationSection
        key={`${employeeId}-${compensation?.id ?? "new"}`}
        tenantId={tenantId}
        employeeId={employeeId}
        compensation={compensation}
        compensationNotFound={Boolean(compensationNotFound)}
        setLastTraceId={setLastTraceId}
      />

      <Link href="/app/hr/employees" className="text-sm text-primary underline-offset-2 hover:underline">
        Volver a empleados
      </Link>
    </div>
  );
}

type CompensationSectionProps = {
  tenantId: string;
  employeeId: string;
  compensation: HrCompensation | null;
  compensationNotFound: boolean;
  setLastTraceId: (traceId: string | null) => void;
};

function CompensationSection({
  tenantId,
  employeeId,
  compensation,
  compensationNotFound,
  setLastTraceId,
}: CompensationSectionProps) {
  const queryClient = useQueryClient();
  const [compensationState, setCompensationState] = useState<CompensationFormState>(() =>
    buildCompensationState(compensation),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!employeeId) {
        throw new Error("Empleado invalido.");
      }

      const salaryAmount = compensationState.salaryAmount
        ? Number(compensationState.salaryAmount)
        : undefined;
      if (compensationState.salaryAmount && Number.isNaN(salaryAmount)) {
        throw new Error("El salario debe ser numerico.");
      }

      const payload = {
        salaryAmount,
        currency: compensationState.currency.trim().toUpperCase() || undefined,
        payFrequency: compensationState.payFrequency,
        effectiveFrom: compensationState.effectiveFrom.trim() || undefined,
        notes: compensationState.notes.trim() || undefined,
      };

      return updateHrEmployeeCompensation(tenantId, employeeId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      setCompensationState(buildCompensationState(response.data.compensation));
      queryClient.invalidateQueries({ queryKey: queryKeys.hrCompensation(tenantId, employeeId) });
      setErrorMessage(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveHrErrorMessage(error.code, error.message));
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : resolveHrErrorMessage("GEN_INTERNAL_ERROR"));
    },
  });

  return (
    <div className="rounded-xl border border-border/80 bg-card/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Compensacion</p>
          <p className="text-xs text-muted-foreground">Actualiza salario, moneda y frecuencia de pago.</p>
        </div>
        <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          Guardar compensacion
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="field-label">Salario</label>
          <Input
            type="number"
            value={compensationState.salaryAmount}
            onChange={(event) =>
              setCompensationState({ ...compensationState, salaryAmount: event.target.value })
            }
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <label className="field-label">Moneda</label>
          <Input
            value={compensationState.currency}
            onChange={(event) =>
              setCompensationState({ ...compensationState, currency: event.target.value })
            }
            placeholder="USD"
          />
        </div>
        <div className="space-y-2">
          <label className="field-label">Frecuencia de pago</label>
          <select
            className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
            value={compensationState.payFrequency}
            onChange={(event) =>
              setCompensationState({
                ...compensationState,
                payFrequency: event.target.value as HrPayFrequency,
              })
            }
          >
            {PAY_FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="field-label">Vigencia (ISO)</label>
          <Input
            value={compensationState.effectiveFrom}
            onChange={(event) =>
              setCompensationState({ ...compensationState, effectiveFrom: event.target.value })
            }
            placeholder="2026-01-01T00:00:00-03:00"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="field-label">Notas</label>
          <textarea
            className="min-h-[90px] w-full rounded-md border border-border/80 bg-background/70 px-3 py-2 text-sm text-foreground"
            value={compensationState.notes}
            onChange={(event) => setCompensationState({ ...compensationState, notes: event.target.value })}
            placeholder="Detalles adicionales"
          />
        </div>
      </div>

      {compensationNotFound ? (
        <div className="mt-3 rounded-md border border-amber-400/55 bg-amber-500/12 p-3 text-sm text-amber-100">
          No existe compensacion registrada. Completa los campos y guarda para crearla.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
