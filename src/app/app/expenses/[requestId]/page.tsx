"use client";

import { useParams, useSearchParams } from "next/navigation";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { ExpensesAccessGuard } from "@/modules/expenses/guards/expenses-access.guard";
import { ExpensesModuleLayout } from "@/modules/expenses/layout/ExpensesModuleLayout";
import { resolveExpensesSectionKey } from "@/modules/expenses/routes/expenses.routes";

function resolveRequestId(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return raw ?? null;
}

export default function ExpenseRequestPage() {
  const params = useParams<{ requestId?: string | string[] }>();
  const searchParams = useSearchParams();
  const requestId = resolveRequestId(params.requestId);
  const requestedSectionKey = resolveExpensesSectionKey(searchParams.get("tab"));

  if (!requestId) {
    return null;
  }

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
              requestId={requestId}
            />
          )}
        </ExpensesAccessGuard>
      )}
    </TenantContextGate>
  );
}
