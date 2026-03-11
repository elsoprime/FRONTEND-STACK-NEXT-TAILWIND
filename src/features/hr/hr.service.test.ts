import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  createHrEmployee,
  deleteHrEmployee,
  getHrEmployee,
  getHrEmployeeCompensation,
  listHrEmployees,
  updateHrEmployee,
  updateHrEmployeeCompensation,
} from "@/features/hr/hr.service";
import { server } from "@/mocks/server";

const TENANT_ID = "507f191e810c19729de860ea";
const EMPLOYEE_ID = "507f191e810c19729de860eb";

const employeeFixture = {
  id: EMPLOYEE_ID,
  tenantId: TENANT_ID,
  employeeCode: "EMP-001",
  firstName: "Ana",
  lastName: "Diaz",
  workEmail: "ana@acme.dev",
  personalEmail: null,
  phone: "+56 9 1111 2222",
  department: "Ventas",
  jobTitle: "Account Executive",
  employmentType: "full_time" as const,
  status: "active" as const,
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: null,
  birthDate: null,
  managerId: null,
  isActive: true,
  deletedAt: null,
};

const compensationFixture = {
  id: "507f191e810c19729de860ec",
  employeeId: EMPLOYEE_ID,
  tenantId: TENANT_ID,
  salaryAmount: 3500,
  currency: "USD",
  payFrequency: "monthly" as const,
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  notes: "Initial package",
  isActive: true,
};

describe("hr.service", () => {
  it("lists employees with query and tenant header", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/hr/employees", ({ request }) => {
        capturedUrl = request.url;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: { items: [employeeFixture] },
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          traceId: "trace-hr-list",
        });
      }),
    );

    const response = await listHrEmployees(TENANT_ID, {
      search: "ana",
      department: "Ventas",
      status: "active",
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("search")).toBe("ana");
    expect(parsed.searchParams.get("department")).toBe("Ventas");
    expect(parsed.searchParams.get("status")).toBe("active");
    expect(response.data.items[0]?.id).toBe(EMPLOYEE_ID);
  });

  it("creates employee", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/modules/hr/employees", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(
          {
            success: true,
            data: { employee: employeeFixture },
            traceId: "trace-hr-create",
          },
          { status: 201 },
        );
      }),
    );

    const response = await createHrEmployee(TENANT_ID, {
      employeeCode: "EMP-001",
      firstName: "Ana",
      lastName: "Diaz",
      employmentType: "full_time",
      startDate: "2026-01-01T00:00:00.000Z",
    });

    expect(body).toEqual({
      employeeCode: "EMP-001",
      firstName: "Ana",
      lastName: "Diaz",
      employmentType: "full_time",
      startDate: "2026-01-01T00:00:00.000Z",
    });
    expect(response.data.employee.id).toBe(EMPLOYEE_ID);
  });

  it("gets, updates and deletes employee", async () => {
    server.use(
      http.get(`*/api/v1/modules/hr/employees/${EMPLOYEE_ID}`, () =>
        HttpResponse.json({ success: true, data: { employee: employeeFixture }, traceId: "trace-get" }),
      ),
      http.patch(`*/api/v1/modules/hr/employees/${EMPLOYEE_ID}`, async ({ request }) => {
        const body = (await request.json()) as { department: string };
        expect(body.department).toBe("Revenue");

        return HttpResponse.json({
          success: true,
          data: {
            employee: {
              ...employeeFixture,
              department: "Revenue",
            },
          },
          traceId: "trace-patch",
        });
      }),
      http.delete(`*/api/v1/modules/hr/employees/${EMPLOYEE_ID}`, () =>
        HttpResponse.json({ success: true, data: { employee: employeeFixture }, traceId: "trace-delete" }),
      ),
    );

    const getResp = await getHrEmployee(TENANT_ID, EMPLOYEE_ID);
    const patchResp = await updateHrEmployee(TENANT_ID, EMPLOYEE_ID, {
      department: "Revenue",
    });
    const delResp = await deleteHrEmployee(TENANT_ID, EMPLOYEE_ID);

    expect(getResp.data.employee.id).toBe(EMPLOYEE_ID);
    expect(patchResp.data.employee.department).toBe("Revenue");
    expect(delResp.data.employee.id).toBe(EMPLOYEE_ID);
  });

  it("gets and updates compensation", async () => {
    server.use(
      http.get(`*/api/v1/modules/hr/employees/${EMPLOYEE_ID}/compensation`, () =>
        HttpResponse.json({
          success: true,
          data: {
            compensation: compensationFixture,
          },
          traceId: "trace-comp-get",
        }),
      ),
      http.patch(`*/api/v1/modules/hr/employees/${EMPLOYEE_ID}/compensation`, async ({ request }) => {
        const body = (await request.json()) as { salaryAmount: number };
        expect(body.salaryAmount).toBe(3800);

        return HttpResponse.json({
          success: true,
          data: {
            compensation: {
              ...compensationFixture,
              salaryAmount: 3800,
            },
          },
          traceId: "trace-comp-update",
        });
      }),
    );

    const getResp = await getHrEmployeeCompensation(TENANT_ID, EMPLOYEE_ID);
    const patchResp = await updateHrEmployeeCompensation(TENANT_ID, EMPLOYEE_ID, {
      salaryAmount: 3800,
    });

    expect(getResp.data.compensation.employeeId).toBe(EMPLOYEE_ID);
    expect(patchResp.data.compensation.salaryAmount).toBe(3800);
  });
});
