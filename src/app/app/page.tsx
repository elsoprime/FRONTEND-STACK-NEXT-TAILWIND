import Link from "next/link";
import { TenantShellBootstrap } from "@/components/tenant/tenant-shell-bootstrap";

export default function AppHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
          Shell autenticado
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Dashboard tenant</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Sesion iniciada. Desde aqui se conectaran los modulos protegidos por permisos y plan.
        </p>

        <TenantShellBootstrap />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/app/tenants"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
          >
            Ver mis tenants
          </Link>
          <Link
            href="/app/modules/inventory"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
          >
            Abrir Inventory
          </Link>
          <Link
            href="/app/modules/crm"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
          >
            Abrir CRM
          </Link>
          <Link
            href="/app/modules/hr"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
          >
            Abrir HR
          </Link>
        </div>
      </section>
    </main>
  );
}
