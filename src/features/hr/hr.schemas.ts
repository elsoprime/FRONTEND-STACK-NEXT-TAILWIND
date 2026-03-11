import { z } from "zod";

const objectIdRegex = /^[a-f0-9]{24}$/i;
const employeeCodeRegex = /^[a-zA-Z0-9._-]+$/;

export const hrPaginationSchema = z
  .object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .passthrough();

export const hrEmploymentTypeSchema = z.enum(["full_time", "part_time", "contractor", "intern"]);
export const hrEmployeeStatusSchema = z.enum(["active", "inactive", "terminated"]);
export const hrPayFrequencySchema = z.enum(["weekly", "biweekly", "monthly"]);

export type HrEmploymentType = z.infer<typeof hrEmploymentTypeSchema>;
export type HrEmployeeStatus = z.infer<typeof hrEmployeeStatusSchema>;
export type HrPayFrequency = z.infer<typeof hrPayFrequencySchema>;

export const hrEmployeeSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    employeeCode: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    workEmail: z.string().nullable(),
    personalEmail: z.string().nullable(),
    phone: z.string().nullable(),
    department: z.string().nullable(),
    jobTitle: z.string().nullable(),
    employmentType: hrEmploymentTypeSchema,
    status: hrEmployeeStatusSchema,
    startDate: z.string(),
    endDate: z.string().nullable(),
    birthDate: z.string().nullable(),
    managerId: z.string().nullable(),
    isActive: z.boolean(),
    deletedAt: z.string().nullable(),
  })
  .passthrough();

export type HrEmployee = z.infer<typeof hrEmployeeSchema>;

export const hrCompensationSchema = z
  .object({
    id: z.string(),
    employeeId: z.string(),
    tenantId: z.string(),
    salaryAmount: z.number().min(0),
    currency: z.string().regex(/^[A-Z]{3}$/),
    payFrequency: hrPayFrequencySchema,
    effectiveFrom: z.string(),
    notes: z.string().nullable(),
    isActive: z.boolean(),
  })
  .passthrough();

export type HrCompensation = z.infer<typeof hrCompensationSchema>;

export const hrEmployeeDataSchema = z.object({ employee: hrEmployeeSchema }).passthrough();
export const hrEmployeeListDataSchema = z.object({ items: z.array(hrEmployeeSchema) }).passthrough();
export const hrCompensationDataSchema = z
  .object({ compensation: hrCompensationSchema })
  .passthrough();

export type HrEmployeeData = z.infer<typeof hrEmployeeDataSchema>;
export type HrCompensationData = z.infer<typeof hrCompensationDataSchema>;

export const hrEmployeeListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: hrEmployeeListDataSchema,
  pagination: hrPaginationSchema,
  traceId: z.string(),
});

export type HrEmployeeListEnvelope = z.infer<typeof hrEmployeeListEnvelopeSchema>;

const nullableEmailSchema = z.string().email().nullable();
const nullableIsoDateSchema = z.string().datetime({ offset: true }).nullable();
const nullableObjectIdSchema = z.string().regex(objectIdRegex).nullable();

export const createHrEmployeeInputSchema = z.object({
  employeeCode: z.string().trim().min(1).max(64).regex(employeeCodeRegex),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  workEmail: nullableEmailSchema.optional(),
  personalEmail: nullableEmailSchema.optional(),
  phone: z.string().trim().min(1).max(40).nullable().optional(),
  department: z.string().trim().min(1).max(120).nullable().optional(),
  jobTitle: z.string().trim().min(1).max(160).nullable().optional(),
  employmentType: hrEmploymentTypeSchema,
  status: hrEmployeeStatusSchema.optional(),
  startDate: z.string().datetime({ offset: true }),
  endDate: nullableIsoDateSchema.optional(),
  birthDate: nullableIsoDateSchema.optional(),
  managerId: nullableObjectIdSchema.optional(),
});

export const updateHrEmployeeInputSchema = z
  .object({
    employeeCode: z.string().trim().min(1).max(64).regex(employeeCodeRegex).optional(),
    firstName: z.string().trim().min(1).max(120).optional(),
    lastName: z.string().trim().min(1).max(120).optional(),
    workEmail: nullableEmailSchema.optional(),
    personalEmail: nullableEmailSchema.optional(),
    phone: z.string().trim().min(1).max(40).nullable().optional(),
    department: z.string().trim().min(1).max(120).nullable().optional(),
    jobTitle: z.string().trim().min(1).max(160).nullable().optional(),
    employmentType: hrEmploymentTypeSchema.optional(),
    status: hrEmployeeStatusSchema.optional(),
    startDate: z.string().datetime({ offset: true }).optional(),
    endDate: nullableIsoDateSchema.optional(),
    birthDate: nullableIsoDateSchema.optional(),
    managerId: nullableObjectIdSchema.optional(),
  })
  .refine(
    (v) =>
      v.employeeCode !== undefined ||
      v.firstName !== undefined ||
      v.lastName !== undefined ||
      v.workEmail !== undefined ||
      v.personalEmail !== undefined ||
      v.phone !== undefined ||
      v.department !== undefined ||
      v.jobTitle !== undefined ||
      v.employmentType !== undefined ||
      v.status !== undefined ||
      v.startDate !== undefined ||
      v.endDate !== undefined ||
      v.birthDate !== undefined ||
      v.managerId !== undefined,
    { message: "Debes enviar al menos un campo para actualizar el empleado." },
  );

export const updateHrCompensationInputSchema = z
  .object({
    salaryAmount: z.number().min(0).optional(),
    currency: z.string().regex(/^[A-Z]{3}$/).optional(),
    payFrequency: hrPayFrequencySchema.optional(),
    effectiveFrom: z.string().datetime({ offset: true }).optional(),
    notes: z.string().trim().min(1).max(200).nullable().optional(),
  })
  .refine(
    (v) =>
      v.salaryAmount !== undefined ||
      v.currency !== undefined ||
      v.payFrequency !== undefined ||
      v.effectiveFrom !== undefined ||
      v.notes !== undefined,
    { message: "Debes enviar al menos un campo para actualizar compensacion." },
  );

export const hrIdInputSchema = z.string().trim().regex(objectIdRegex, "ID invalido");

export const listHrEmployeesInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  status: hrEmployeeStatusSchema.optional(),
});

export type CreateHrEmployeeInput = z.infer<typeof createHrEmployeeInputSchema>;
export type UpdateHrEmployeeInput = z.infer<typeof updateHrEmployeeInputSchema>;
export type UpdateHrCompensationInput = z.infer<typeof updateHrCompensationInputSchema>;
export type ListHrEmployeesInput = z.infer<typeof listHrEmployeesInputSchema>;
