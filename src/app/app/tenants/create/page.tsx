import Link from "next/link";
import { TenantCreateForm } from "@/components/tenant/tenant-create-form";

export default function TenantCreatePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
          Onboarding tenant
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Crear tu primer tenant</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Si aun no tienes tenants asociados, este es el siguiente paso operativo para iniciar el
          contexto tenant del producto.
        </p>

        <TenantCreateForm />

        <Link
          href="/app"
          className="mt-8 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-blue-700 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400"
        >
          Volver al shell
        </Link>
      </section>
    </main>
  );
}
