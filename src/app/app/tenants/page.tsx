import { TenantSelectorPanel } from "@/components/tenant/tenant-selector-panel";

export default function TenantHubPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
          Hub tenant
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Tus tenants disponibles</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Desde aqui puedes revisar tus tenants y activar el contexto que usara el shell
          autenticado.
        </p>

        <TenantSelectorPanel
          title="Selecciona el tenant con el que vas a trabajar"
          description="La seleccion actualiza la sesion browser y limpia el cache del tenant previo antes de volver al dashboard."
        />
      </section>
    </main>
  );
}
