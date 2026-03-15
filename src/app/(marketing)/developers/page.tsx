import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { developerFeatures } from "@/lib/marketing.content";
import { MarketingShell } from "../_marketing-shell";

export default function DevelopersPage() {
  return (
    <MarketingShell>
      <header className="mb-20 max-w-3xl">
        <Badge className="mb-4 bg-slate-900 text-[10px] font-extrabold tracking-widest text-white uppercase dark:bg-blue-900 dark:text-blue-100">
          Developer Ecosystem
        </Badge>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          Ingenieria de <span className="text-blue-700">mision critica.</span>
        </h1>
        <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400">
          Plataforma construida por ingenieros para ingenieros, con foco en extensibilidad,
          seguridad y DX en cada capa.
        </p>
      </header>

      <section id="api-docs" className="mb-24 grid gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Estandares de integracion</h2>
          <div className="rounded-xl border border-slate-200 bg-slate-900 p-8 dark:border-slate-800">
            <pre className="overflow-x-auto text-sm leading-relaxed text-slate-300">{`// Estandar de cliente HTTP
const client = await ERPClient.init({
  tenantId: "enterprise-core-01",
  credentials: "include",
  traceId: true,
});

const response = await client.inventory.getStats();`}</pre>
          </div>
          <p className="font-medium text-slate-600 dark:text-slate-400">
            El SDK oficial mantiene tipos seguros y trazabilidad completa en cada llamada.
          </p>
        </div>

        <div className="grid gap-6">
          {developerFeatures.map((feature) => (
            <article
              key={feature.title}
              className="flex gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <feature.icon className="size-6" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-blue-700 p-12 text-center text-white">
        <h2 className="mb-4 text-3xl font-bold">Listo para integrar?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
          Acceda a entorno sandbox y comience a construir sobre una infraestructura robusta.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/contact/technical-consulting"
            className="rounded-md bg-white px-8 py-3 font-bold text-blue-700 transition hover:bg-blue-50"
          >
            Agendar consultoria tecnica
          </Link>
          <Link
            href="/developers#api-docs"
            className="rounded-md border border-blue-400 px-8 py-3 font-bold text-white transition hover:bg-blue-800"
          >
            Ver API docs
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
