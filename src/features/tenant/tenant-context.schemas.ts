import { z } from "zod";
import {
  membershipViewSchema,
  tenantMembershipSummarySchema,
  tenantViewSchema,
} from "@/features/tenant/tenant.schemas";

const objectIdRegex = /^[a-f0-9]{24}$/i;
const tenantRoleKeySchema = z.enum(["tenant:owner", "tenant:member"]);

export const createTenantInputSchema = z.object({
  name: z.string().trim().min(1, "Ingresa un nombre para el tenant").max(120),
  slug: z
    .string()
    .trim()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .max(120, "El slug no puede superar los 120 caracteres")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa solo minusculas, numeros y guiones")
    .optional()
    .or(z.literal("")),
});

export type CreateTenantInput = z.infer<typeof createTenantInputSchema>;

export const switchActiveTenantInputSchema = z.object({
  tenantId: z
    .string()
    .trim()
    .regex(objectIdRegex, "Selecciona un tenant valido"),
});

export type SwitchActiveTenantInput = z.infer<typeof switchActiveTenantInputSchema>;

export const createTenantInvitationInputSchema = z.object({
  email: z.string().trim().email("Ingresa un email valido"),
  roleKey: tenantRoleKeySchema.optional(),
});

export type CreateTenantInvitationInput = z.infer<typeof createTenantInvitationInputSchema>;

export const acceptTenantInvitationInputSchema = z.object({
  token: z.string().trim().min(1, "Token de invitacion requerido"),
});

export type AcceptTenantInvitationInput = z.infer<typeof acceptTenantInvitationInputSchema>;

export const revokeTenantInvitationInputSchema = z.object({
  invitationId: z
    .string()
    .trim()
    .regex(objectIdRegex, "Invitacion invalida"),
});

export type RevokeTenantInvitationInput = z.infer<typeof revokeTenantInvitationInputSchema>;

export const transferTenantOwnershipInputSchema = z.object({
  targetUserId: z
    .string()
    .trim()
    .regex(objectIdRegex, "Usuario destino invalido"),
});

export type TransferTenantOwnershipInput = z.infer<typeof transferTenantOwnershipInputSchema>;

export const activeTenantContextSchema = z.object({
  tenant: tenantViewSchema,
  membership: membershipViewSchema,
});

export type ActiveTenantContext = z.infer<typeof activeTenantContextSchema>;

export const tenantShellReadyStateSchema = z.object({
  status: z.literal("ready"),
  tenant: tenantViewSchema,
  membership: membershipViewSchema,
  traceId: z.string(),
});

export type TenantShellReadyState = z.infer<typeof tenantShellReadyStateSchema>;

export type TenantShellBootstrapResult =
  | {
      status: "no_tenants";
      items: [];
      traceId: string;
    }
  | {
      status: "selection_required";
      items: z.infer<typeof tenantMembershipSummarySchema>[];
      traceId: string;
    }
  | {
      status: "ready";
      tenant: z.infer<typeof tenantViewSchema>;
      membership: z.infer<typeof membershipViewSchema>;
      traceId: string;
      switched: boolean;
      items: z.infer<typeof tenantMembershipSummarySchema>[];
    };
