import { apiRequest } from "@/lib/api/client";
import { type ApiSuccessEnvelope } from "@/lib/api/contracts";
import {
  createHrEmployeeInputSchema,
  hrCompensationDataSchema,
  hrEmployeeDataSchema,
  hrEmployeeListDataSchema,
  hrEmployeeListEnvelopeSchema,
  hrIdInputSchema,
  listHrEmployeesInputSchema,
  updateHrCompensationInputSchema,
  updateHrEmployeeInputSchema,
  type CreateHrEmployeeInput,
  type HrCompensationData,
  type HrEmployeeData,
  type HrEmployeeListEnvelope,
  type ListHrEmployeesInput,
  type UpdateHrCompensationInput,
  type UpdateHrEmployeeInput,
} from "@/features/hr/hr.schemas";

const HR_ENDPOINTS = {
  employees: "/api/v1/modules/hr/employees",
} as const;

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
}

function employeeByIdPath(employeeId: string): string {
  return `${HR_ENDPOINTS.employees}/${hrIdInputSchema.parse(employeeId)}`;
}

function compensationByEmployeePath(employeeId: string): string {
  return `${employeeByIdPath(employeeId)}/compensation`;
}

export async function listHrEmployees(
  tenantId: string,
  filters: ListHrEmployeesInput = {},
): Promise<HrEmployeeListEnvelope> {
  const parsed = listHrEmployeesInputSchema.parse(filters);

  const response = await apiRequest(
    `${HR_ENDPOINTS.employees}${buildQueryString({
      page: parsed.page,
      limit: parsed.limit,
      search: parsed.search,
      department: parsed.department,
      status: parsed.status,
    })}`,
    {
      method: "GET",
      tenantId,
      dataSchema: hrEmployeeListDataSchema,
    },
  );

  return hrEmployeeListEnvelopeSchema.parse(response);
}

export async function createHrEmployee(
  tenantId: string,
  payload: CreateHrEmployeeInput,
): Promise<ApiSuccessEnvelope<HrEmployeeData>> {
  return apiRequest(HR_ENDPOINTS.employees, {
    method: "POST",
    tenantId,
    body: createHrEmployeeInputSchema.parse(payload),
    dataSchema: hrEmployeeDataSchema,
  });
}

export async function getHrEmployee(
  tenantId: string,
  employeeId: string,
): Promise<ApiSuccessEnvelope<HrEmployeeData>> {
  return apiRequest(employeeByIdPath(employeeId), {
    method: "GET",
    tenantId,
    dataSchema: hrEmployeeDataSchema,
  });
}

export async function updateHrEmployee(
  tenantId: string,
  employeeId: string,
  payload: UpdateHrEmployeeInput,
): Promise<ApiSuccessEnvelope<HrEmployeeData>> {
  return apiRequest(employeeByIdPath(employeeId), {
    method: "PATCH",
    tenantId,
    body: updateHrEmployeeInputSchema.parse(payload),
    dataSchema: hrEmployeeDataSchema,
  });
}

export async function deleteHrEmployee(
  tenantId: string,
  employeeId: string,
): Promise<ApiSuccessEnvelope<HrEmployeeData>> {
  return apiRequest(employeeByIdPath(employeeId), {
    method: "DELETE",
    tenantId,
    dataSchema: hrEmployeeDataSchema,
  });
}

export async function getHrEmployeeCompensation(
  tenantId: string,
  employeeId: string,
): Promise<ApiSuccessEnvelope<HrCompensationData>> {
  return apiRequest(compensationByEmployeePath(employeeId), {
    method: "GET",
    tenantId,
    dataSchema: hrCompensationDataSchema,
  });
}

export async function updateHrEmployeeCompensation(
  tenantId: string,
  employeeId: string,
  payload: UpdateHrCompensationInput,
): Promise<ApiSuccessEnvelope<HrCompensationData>> {
  return apiRequest(compensationByEmployeePath(employeeId), {
    method: "PATCH",
    tenantId,
    body: updateHrCompensationInputSchema.parse(payload),
    dataSchema: hrCompensationDataSchema,
  });
}
