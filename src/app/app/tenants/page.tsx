import { TenantSelectorPanel } from "@/components/tenant/tenant-selector-panel";

export default function TenantHubPage() {
  return (
    <main className="min-h-[calc(100dvh-4.5rem)] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[1320px] space-y-5">
        <article className="surface-card relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/20 via-accent/15 to-transparent" />
          <div className="relative space-y-2">
            <p className="label-kicker text-primary/90">Hub tenant</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Tus tenants disponibles
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              Revisa tus membresias y activa el contexto tenant que usara el shell autenticado.
            </p>
          </div>
        </article>

        <article className="surface-card p-5 sm:p-6">
          <TenantSelectorPanel
            title="Selecciona el tenant con el que vas a trabajar"
            description="La seleccion actualiza la sesion browser y limpia el cache del tenant previo antes de volver al dashboard."
          />
        </article>
      </section>
    </main>
  );
}
