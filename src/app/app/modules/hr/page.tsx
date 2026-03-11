"use client";

import Link from "next/link";
import { HrOverviewPanel } from "@/components/modules/hr/hr-overview-panel";
import { TenantContextGate } from "@/components/tenant/tenant-context-gate";

export default function HrModulePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
          Modulo HR
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Recursos Humanos</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Vista inicial de consumo del API para gestion de empleados del tenant activo.
        </p>

        <TenantContextGate>
          {({ tenant }) => (
            <>
              <HrOverviewPanel tenantId={tenant.id} />
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
                >
                  Volver al shell
                </Link>
              </div>
            </>
          )}
        </TenantContextGate>
      </section>
    </main>
  );
}
