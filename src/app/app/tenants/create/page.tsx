import Link from "next/link";
import { TenantCreateForm } from "@/components/tenant/tenant-create-form";

export default function TenantCreatePage() {
  return (
    <main className="min-h-[calc(100dvh-4.5rem)] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[1320px] space-y-5">
        <article className="surface-card relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/20 via-accent/15 to-transparent" />
          <div className="relative space-y-2">
            <p className="label-kicker text-primary/90">Onboarding tenant</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Crear tu primer tenant
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              Si aun no tienes tenants asociados, este es el siguiente paso operativo para iniciar
              el contexto tenant del producto.
            </p>
          </div>
        </article>

        <article className="surface-card p-5 sm:p-6">
          <TenantCreateForm />
          <Link
            href="/app"
            className="mt-8 inline-flex rounded-lg border border-border/70 bg-card/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/35 hover:text-primary"
          >
            Volver al dashboard
          </Link>
        </article>
      </section>
    </main>
  );
}
