import { TenantSelectorPanel } from "@/components/tenant/tenant-selector-panel";

export default function TenantSelectPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
          Selector tenant
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Selecciona un tenant activo</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Si tienes acceso a múltiples tenants, puedes seleccionar el tenant activo para gestionar
          sus recursos y configuraciones. El tenant activo es el que se utilizará para todas las
          operaciones y acciones que realices en esta aplicación.
        </p>

        <TenantSelectorPanel />
      </section>
    </main>
  );
}
