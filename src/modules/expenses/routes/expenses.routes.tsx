import { hasAllTenantPermissions } from "@/features/tenant/tenant-permissions";
import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";

export const EXPENSES_MODULE_KEY = "expenses" as const;

export const EXPENSES_PERMISSION_KEYS = {
  MODULE_USE: "tenant:modules:expenses:use",
  REQUEST_CREATE: "tenant:expenses:request:create",
  REQUEST_READ_OWN: "tenant:expenses:request:read:own",
  REQUEST_UPDATE_OWN: "tenant:expenses:request:update:own",
  REQUEST_CANCEL_OWN: "tenant:expenses:request:cancel:own",
  REQUEST_READ: "tenant:expenses:request:read",
  REQUEST_REVIEW: "tenant:expenses:request:review",
  REQUEST_APPROVE: "tenant:expenses:request:approve",
  REQUEST_REJECT: "tenant:expenses:request:reject",
  PAYMENT_MARK_PAID: "tenant:expenses:payment:mark-paid",
  REPORT_READ: "tenant:expenses:report:read",
  EXPORT: "tenant:expenses:export",
  SETTINGS_READ: "tenant:expenses:settings:read",
  SETTINGS_UPDATE: "tenant:expenses:settings:update",
} as const;

export const EXPENSES_SECTION_KEYS = [
  "requests",
  "approvals",
  "payments",
  "reports",
  "settings",
] as const;

export type ExpensesSectionKey = (typeof EXPENSES_SECTION_KEYS)[number];

export type ExpensesRouteSection = {
  key: ExpensesSectionKey;
  label: string;
  summary: string;
  requiredPermissions: readonly string[];
  capabilityLabel: string;
  tone: "default" | "emerald" | "amber" | "cyan" | "violet";
};

export const EXPENSES_ROUTE_SECTIONS: readonly ExpensesRouteSection[] = [
  {
    key: "requests",
    label: "Solicitudes",
    summary: "Alta, lectura y control de solicitudes de gasto.",
    requiredPermissions: [
      EXPENSES_PERMISSION_KEYS.MODULE_USE,
      EXPENSES_PERMISSION_KEYS.REQUEST_READ_OWN,
    ],
    capabilityLabel: "Captura y seguimiento",
    tone: "default",
  },
  {
    key: "approvals",
    label: "Aprobaciones",
    summary: "Revision, devolucion y decisiones operativas.",
    requiredPermissions: [
      EXPENSES_PERMISSION_KEYS.MODULE_USE,
      EXPENSES_PERMISSION_KEYS.REQUEST_REVIEW,
    ],
    capabilityLabel: "Workflow",
    tone: "amber",
  },
  {
    key: "payments",
    label: "Pagos",
    summary: "Marcacion de pago y control de desembolsos.",
    requiredPermissions: [
      EXPENSES_PERMISSION_KEYS.MODULE_USE,
      EXPENSES_PERMISSION_KEYS.PAYMENT_MARK_PAID,
    ],
    capabilityLabel: "Disbursement",
    tone: "emerald",
  },
  {
    key: "reports",
    label: "Reportes",
    summary: "Lectura de resumen, exportes y tablero operativo.",
    requiredPermissions: [
      EXPENSES_PERMISSION_KEYS.MODULE_USE,
      EXPENSES_PERMISSION_KEYS.REPORT_READ,
    ],
    capabilityLabel: "Analitica",
    tone: "cyan",
  },
  {
    key: "settings",
    label: "Configuracion",
    summary: "Politicas, categorias y reglas del modulo.",
    requiredPermissions: [
      EXPENSES_PERMISSION_KEYS.MODULE_USE,
      EXPENSES_PERMISSION_KEYS.SETTINGS_READ,
    ],
    capabilityLabel: "Policy layer",
    tone: "violet",
  },
] as const;

const EXPENSES_SECTION_KEY_SET = new Set<ExpensesSectionKey>(EXPENSES_SECTION_KEYS);
const EXPENSES_SECTION_BY_KEY = new Map(
  EXPENSES_ROUTE_SECTIONS.map((section) => [section.key, section] as const),
);

export function isExpensesSectionKey(value: string | null): value is ExpensesSectionKey {
  return Boolean(value && EXPENSES_SECTION_KEY_SET.has(value as ExpensesSectionKey));
}

export function resolveExpensesSectionKey(value: string | null): ExpensesSectionKey {
  return isExpensesSectionKey(value) ? value : "requests";
}

export function resolveExpensesSectionByKey(
  key: ExpensesSectionKey,
): ExpensesRouteSection | undefined {
  return EXPENSES_SECTION_BY_KEY.get(key);
}

export function resolveVisibleExpensesSections(
  roleKey: string,
  runtime: TenantRuntime | null | undefined,
): readonly ExpensesRouteSection[] {
  const runtimeModuleKeys = runtime?.activeModuleKeys ?? [];
  const runtimeEnabledModuleKeys = runtime?.enabledModuleKeys ?? [];
  const moduleIsAvailable =
    runtimeModuleKeys.includes(EXPENSES_MODULE_KEY) ||
    runtimeEnabledModuleKeys.includes(EXPENSES_MODULE_KEY);

  if (!moduleIsAvailable) {
    return [];
  }

  return EXPENSES_ROUTE_SECTIONS.filter((section) =>
    hasAllTenantPermissions(roleKey, section.requiredPermissions),
  );
}

