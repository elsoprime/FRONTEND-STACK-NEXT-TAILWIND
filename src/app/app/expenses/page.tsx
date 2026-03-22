"use client";

import { useSearchParams } from "next/navigation";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { ExpensesAccessGuard } from "@/modules/expenses/guards/expenses-access.guard";
import { ExpensesModuleLayout } from "@/modules/expenses/layout/ExpensesModuleLayout";
import { resolveExpensesSectionKey } from "@/modules/expenses/routes/expenses.routes";

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const requestedSectionKey = resolveExpensesSectionKey(searchParams.get("tab"));

  return (
    <TenantContextGate>
      {({ tenant, membership }) => (
        <ExpensesAccessGuard
          tenant={tenant}
          membership={membership}
          requestedSectionKey={requestedSectionKey}
        >
          {({ tenant: resolvedTenant, activeSectionKey, visibleSectionKeys }) => (
            <ExpensesModuleLayout
              tenantId={resolvedTenant.id}
              tenantName={resolvedTenant.name}
              activeSectionKey={activeSectionKey}
              visibleSections={visibleSectionKeys}
            />
          )}
        </ExpensesAccessGuard>
      )}
    </TenantContextGate>
  );
}

