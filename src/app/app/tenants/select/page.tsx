import { TenantSelectorPanel } from "@/components/tenant/tenant-selector-panel";

export default function TenantSelectPage() {
  return (
    <main className="min-h-[calc(100dvh-4.5rem)] px-4 py-7 sm:px-6 xl:px-2">
      <section className="mx-auto w-full max-w-[1320px] space-y-6">
        <article className="surface-card relative overflow-hidden p-7 sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/20 via-accent/15 to-transparent" />
          <div className="relative space-y-2">
            <p className="label-kicker text-primary/90">Selector tenant</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Selecciona un tenant activo
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              Si tienes acceso a multiples tenants, elige aqui el contexto operativo que se usara
              en todo el dashboard modular.
            </p>
          </div>
        </article>

        <article className="surface-card p-6 sm:p-7">
          <TenantSelectorPanel />
        </article>
      </section>
    </main>
  );
}
