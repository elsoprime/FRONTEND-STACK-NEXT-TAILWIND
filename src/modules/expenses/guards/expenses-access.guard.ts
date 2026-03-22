"use client";

import { createElement } from "react";
import type { ReactNode } from "react";
import { AccessStatePanel } from "@/components/ui/access-state-panel";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { resolveTenantErrorMessage } from "@/features/tenant/error-code-map";
import { hasTenantPermission } from "@/features/tenant/tenant-permissions";
import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";
import { type MembershipView, type TenantView } from "@/features/tenant/tenant.schemas";
import {
  EXPENSES_PERMISSION_KEYS,
  resolveVisibleExpensesSections,
  type ExpensesSectionKey,
} from "@/modules/expenses/routes/expenses.routes";
import { useTenantStore } from "@/store/tenant-store";

type ExpensesAccessGuardProps = {
  tenant: TenantView | null | undefined;
  membership: MembershipView | null | undefined;
  requestedSectionKey: string | null;
  children: (context: ExpensesAccessContext) => ReactNode;
};

export type ExpensesAccessContext = {
  tenant: TenantView;
  membership: MembershipView;
  runtime: TenantRuntime | null;
  activeSectionKey: ExpensesSectionKey;
  visibleSectionKeys: readonly ExpensesSectionKey[];
};

function resolveModuleErrorCopy(code: string): string {
  return code === "GEN_INTERNAL_ERROR"
    ? "No fue posible resolver el estado del modulo expenses."
    : resolveTenantErrorMessage(code);
}

export function ExpensesAccessGuard({
  tenant,
  membership,
  requestedSectionKey,
  children,
}: ExpensesAccessGuardProps) {
  const runtime = useTenantStore((state) => state.effectiveRuntime);

  if (!tenant || !membership) {
    return createElement(LoadingScreen, {
      variant: "inline",
      className: "mt-6",
      label: "Resolviendo contexto de Expenses...",
      hint: "Esperando tenant activo, membresia y runtime efectivo.",
    });
  }

  const hasModuleUsePermission = hasTenantPermission(
    membership.roleKey,
    EXPENSES_PERMISSION_KEYS.MODULE_USE,
  );

  if (!hasModuleUsePermission) {
    return createElement(AccessStatePanel, {
      title: "Sin acceso al modulo expenses",
      description: resolveTenantErrorMessage("RBAC_PERMISSION_DENIED"),
      code: "RBAC_PERMISSION_DENIED",
    });
  }

  const visibleSections = resolveVisibleExpensesSections(membership.roleKey, runtime);

  if (runtime === null) {
    return createElement(LoadingScreen, {
      variant: "inline",
      className: "mt-6",
      label: "Validando estado de Expenses...",
      hint: "Sincronizando runtime efectivo del tenant.",
    });
  }

  if (!runtime) {
    return createElement(AccessStatePanel, {
      title: "Error del modulo expenses",
      description: resolveModuleErrorCopy("GEN_INTERNAL_ERROR"),
      code: "GEN_INTERNAL_ERROR",
    });
  }

  if (visibleSections.length === 0) {
    return createElement(AccessStatePanel, {
      title: "Sin acceso operativo",
      description: "El tenant tiene el modulo, pero no hay secciones visibles para el rol actual.",
      code: "RBAC_PERMISSION_DENIED",
    });
  }

  const resolvedSectionKey = visibleSections.some((section) => section.key === requestedSectionKey)
    ? (requestedSectionKey as ExpensesSectionKey)
    : "requests";

  if (requestedSectionKey && !visibleSections.some((section) => section.key === requestedSectionKey)) {
    return createElement(AccessStatePanel, {
      title: "Sin acceso a esta seccion",
      description: resolveTenantErrorMessage("RBAC_PERMISSION_DENIED"),
      code: "RBAC_PERMISSION_DENIED",
    });
  }

  return children({
    tenant,
    membership,
    runtime,
    activeSectionKey: resolvedSectionKey,
    visibleSectionKeys: visibleSections.map((section) => section.key),
  });
}


