"use client";

import { useSearchParams } from "next/navigation";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";
import { TenantPageShell } from "@/components/tenant/tenant-page-shell";
import { ExpensesAccessGuard } from "@/modules/expenses/guards/expenses-access.guard";
import { ExpensesModuleLayout } from "@/modules/expenses/layout/ExpensesModuleLayout";
import { resolveExpensesSectionKey } from "@/modules/expenses/routes/expenses.routes";

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const requestedSectionKey = resolveExpensesSectionKey(searchParams.get("tab"));

  return (
    <TenantPageShell
      eyebrow="Modulo Expenses"
      title="Panel principal de Expenses"
      description="Gestiona solicitudes, aprobaciones, pagos, reportes y configuracion desde una superficie unificada."
    >
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
                activeSectionKey={activeSectionKey}
                visibleSections={visibleSectionKeys}
              />
            )}
          </ExpensesAccessGuard>
        )}
      </TenantContextGate>
    </TenantPageShell>
  );
}
