"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantModuleGate, MODULE_GUARDS } from "@/components/tenant/tenant-module-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import {
  createHrEmployee,
  deleteHrEmployee,
  listHrEmployees,
  updateHrEmployee,
} from "@/features/hr/hr.service";
import { resolveHrErrorMessage } from "@/features/hr/error-code-map";
import {
  hrEmploymentTypeSchema,
  hrEmployeeStatusSchema,
  type HrEmploymentType,
  type HrEmployeeStatus,
} from "@/features/hr/hr.schemas";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { useSessionStore } from "@/store/session-store";

const EMPLOYMENT_TYPES = hrEmploymentTypeSchema.options;
const STATUS_OPTIONS = hrEmployeeStatusSchema.options;

export default function HrEmployeesPage() {
  const queryClient = useQueryClient();
  const setLastTraceId = useSessionStore((state) => state.setLastTraceId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    workEmail: "",
    personalEmail: "",
    phone: "",
    department: "",
    jobTitle: "",
    employmentType: "full_time" as HrEmploymentType,
    status: "active" as HrEmployeeStatus,
    startDate: "",
    endDate: "",
    birthDate: "",
    managerId: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFormState({
      employeeCode: "",
      firstName: "",
      lastName: "",
      workEmail: "",
      personalEmail: "",
      phone: "",
      department: "",
      jobTitle: "",
      employmentType: "full_time",
      status: "active",
      startDate: "",
      endDate: "",
      birthDate: "",
      managerId: "",
    });
  };

  return (
    <TenantPageShell
      eyebrow="HR"
      title="Empleados"
      description="Gestiona colaboradores, estado laboral y datos administrativos."
    >
      <TenantContextGate>
        {({ tenant, membership }) => (
          <TenantModuleGate tenant={tenant} membership={membership} moduleLabel="HR" config={MODULE_GUARDS.hr}>
            <EmployeesContent
              tenantId={tenant.id}
              setLastTraceId={setLastTraceId}
              queryClient={queryClient}
              editingId={editingId}
              setEditingId={setEditingId}
              formState={formState}
              setFormState={setFormState}
              resetForm={resetForm}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
          </TenantModuleGate>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}

type EmployeesContentProps = {
  tenantId: string;
  setLastTraceId: (traceId: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  formState: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    personalEmail: string;
    phone: string;
    department: string;
    jobTitle: string;
    employmentType: HrEmploymentType;
    status: HrEmployeeStatus;
    startDate: string;
    endDate: string;
    birthDate: string;
    managerId: string;
  };
  setFormState: (value: EmployeesContentProps["formState"]) => void;
  resetForm: () => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
};

function EmployeesContent({
  tenantId,
  setLastTraceId,
  queryClient,
  editingId,
  setEditingId,
  formState,
  setFormState,
  resetForm,
  errorMessage,
  setErrorMessage,
}: EmployeesContentProps) {
  const employeesQuery = useQuery({
    queryKey: queryKeys.hrEmployees(tenantId),
    queryFn: async () => listHrEmployees(tenantId, { page: 1, limit: 50 }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formState.employeeCode.trim() || !formState.firstName.trim() || !formState.lastName.trim()) {
        throw new Error("Codigo, nombre y apellido son obligatorios.");
      }
      if (!formState.startDate.trim()) {
        throw new Error("La fecha de inicio es obligatoria.");
      }

      const payload = {
        employeeCode: formState.employeeCode.trim(),
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        workEmail: formState.workEmail.trim() || undefined,
        personalEmail: formState.personalEmail.trim() || undefined,
        phone: formState.phone.trim() || undefined,
        department: formState.department.trim() || undefined,
        jobTitle: formState.jobTitle.trim() || undefined,
        employmentType: formState.employmentType,
        status: formState.status,
        startDate: formState.startDate.trim(),
        endDate: formState.endDate.trim() || undefined,
        birthDate: formState.birthDate.trim() || undefined,
        managerId: formState.managerId || undefined,
      };

      if (editingId) {
        return updateHrEmployee(tenantId, editingId, payload);
      }

      return createHrEmployee(tenantId, payload);
    },
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.hrEmployees(tenantId) });
      setErrorMessage(null);
      resetForm();
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

  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => deleteHrEmployee(tenantId, employeeId),
    onSuccess: (response) => {
      setLastTraceId(response.traceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.hrEmployees(tenantId) });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setLastTraceId(error.traceId ?? null);
        setErrorMessage(resolveHrErrorMessage(error.code, error.message));
      }
    },
  });

  if (employeesQuery.isLoading) {
    return (
      <LoadingScreen
        variant="inline"
        className="mt-4"
        label="Cargando empleados..."
        hint="Sincronizando directorio de colaboradores."
      />
    );
  }

  if (employeesQuery.error) {
    const err = employeesQuery.error;
    const message =
      err instanceof ApiRequestError
        ? resolveHrErrorMessage(err.code, err.message)
        : resolveHrErrorMessage("GEN_INTERNAL_ERROR");

    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/12 p-4 text-red-200">
        {message}
      </div>
    );
  }

  const employees = employeesQuery.data?.data.items ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{editingId ? "Editar empleado" : "Nuevo empleado"}</p>
            <p className="text-xs text-muted-foreground">Completa ficha laboral y contacto.</p>
          </div>
          <Button size="sm" variant="outline" onClick={resetForm}>
            Limpiar
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="field-label">Codigo</label>
            <Input
              value={formState.employeeCode}
              onChange={(event) => setFormState({ ...formState, employeeCode: event.target.value })}
              placeholder="EMP-001"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Nombre</label>
            <Input
              value={formState.firstName}
              onChange={(event) => setFormState({ ...formState, firstName: event.target.value })}
              placeholder="Nombre"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Apellido</label>
            <Input
              value={formState.lastName}
              onChange={(event) => setFormState({ ...formState, lastName: event.target.value })}
              placeholder="Apellido"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Tipo empleo</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={formState.employmentType}
              onChange={(event) => setFormState({ ...formState, employmentType: event.target.value as HrEmploymentType })}
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="field-label">Estado</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={formState.status}
              onChange={(event) => setFormState({ ...formState, status: event.target.value as HrEmployeeStatus })}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="field-label">Inicio (ISO)</label>
            <Input
              value={formState.startDate}
              onChange={(event) => setFormState({ ...formState, startDate: event.target.value })}
              placeholder="2026-01-01T09:00:00-03:00"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Fin (opcional)</label>
            <Input
              value={formState.endDate}
              onChange={(event) => setFormState({ ...formState, endDate: event.target.value })}
              placeholder="2026-12-31T18:00:00-03:00"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Nacimiento (opcional)</label>
            <Input
              value={formState.birthDate}
              onChange={(event) => setFormState({ ...formState, birthDate: event.target.value })}
              placeholder="1990-01-01T00:00:00-03:00"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Email laboral</label>
            <Input
              value={formState.workEmail}
              onChange={(event) => setFormState({ ...formState, workEmail: event.target.value })}
              placeholder="empleado@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Email personal</label>
            <Input
              value={formState.personalEmail}
              onChange={(event) => setFormState({ ...formState, personalEmail: event.target.value })}
              placeholder="personal@mail.com"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Telefono</label>
            <Input
              value={formState.phone}
              onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
              placeholder="+56 9 0000 0000"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Departamento</label>
            <Input
              value={formState.department}
              onChange={(event) => setFormState({ ...formState, department: event.target.value })}
              placeholder="Operaciones"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Cargo</label>
            <Input
              value={formState.jobTitle}
              onChange={(event) => setFormState({ ...formState, jobTitle: event.target.value })}
              placeholder="Supervisor"
            />
          </div>
          <div className="space-y-2">
            <label className="field-label">Manager (opcional)</label>
            <select
              className="h-11 w-full rounded-md border border-border/80 bg-background/70 px-3 text-sm text-foreground"
              value={formState.managerId}
              onChange={(event) => setFormState({ ...formState, managerId: event.target.value })}
            >
              <option value="">Sin manager</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {editingId ? "Actualizar empleado" : "Crear empleado"}
          </Button>
          {editingId ? (
            <Button size="sm" variant="outline" onClick={resetForm}>
              Cancelar edicion
            </Button>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Empleados registrados</h2>
          <Link href="/app/hr" className="text-sm text-primary underline-offset-2 hover:underline">
            Volver al overview
          </Link>
        </div>
        {employees.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
            Sin empleados registrados.
          </div>
        ) : (
          <div className="space-y-2">
            {employees.map((employee) => (
              <div key={employee.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/70 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {employee.employeeCode} · {employee.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/app/hr/employees/${employee.id}`} className="text-sm text-primary underline-offset-2 hover:underline">
                    Ver detalle
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(employee.id);
                      setFormState({
                        employeeCode: employee.employeeCode,
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        workEmail: employee.workEmail ?? "",
                        personalEmail: employee.personalEmail ?? "",
                        phone: employee.phone ?? "",
                        department: employee.department ?? "",
                        jobTitle: employee.jobTitle ?? "",
                        employmentType: employee.employmentType,
                        status: employee.status,
                        startDate: employee.startDate,
                        endDate: employee.endDate ?? "",
                        birthDate: employee.birthDate ?? "",
                        managerId: employee.managerId ?? "",
                      });
                    }}
                  >
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(employee.id)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

