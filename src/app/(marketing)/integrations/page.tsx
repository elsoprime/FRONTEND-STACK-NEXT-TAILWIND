import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { integrationCategories } from "@/lib/marketing.content";
import { MarketingShell } from "../_marketing-shell";

export default function IntegrationsPage() {
  return (
    <MarketingShell>
      <header className="mb-20 max-w-3xl">
        <Badge className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
          Ecosistema NexoStack
        </Badge>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          Conecte su negocio al <br />
          <span className="text-blue-700">mundo digital.</span>
        </h1>
        <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400">
          Nuestra plataforma se integra con las herramientas que su organizacion ya usa para
          centralizar datos y operaciones.
        </p>
      </header>

      <section className="space-y-20">
        {integrationCategories.map((category) => (
          <section key={category.name}>
            <div className="mb-10 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <category.icon className="size-6 text-blue-700 dark:text-blue-400" />
              <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {category.integrations.map((integration) => (
                <article
                  key={integration.name}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-blue-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex size-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-xs font-black text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                      {integration.acronym}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold text-slate-400 uppercase">
                      Certificada
                    </Badge>
                  </div>
                  <h3 className="mb-2 text-xl font-bold transition-colors group-hover:text-blue-700">
                    {integration.name}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {integration.description}
                  </p>
                  <Link
                    href={`/contact/connectors?integration=${encodeURIComponent(integration.name)}`}
                    className="text-xs font-bold tracking-widest text-blue-700 uppercase"
                  >
                    Configurar conector
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="mt-24 rounded-3xl bg-blue-700 p-12 text-center text-white lg:p-20">
        <h2 className="mb-6 text-3xl font-bold sm:text-4xl">No encuentra su herramienta?</h2>
        <p className="mx-auto mb-10 max-w-3xl text-lg text-blue-100">
          Podemos desarrollar conectores personalizados para sistemas legacy manteniendo contratos
          API y trazabilidad.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/contact/custom-connector"
            className="rounded-md bg-white px-10 py-4 font-bold text-blue-700 transition hover:bg-blue-50"
          >
            Solicitar conector propio
          </Link>
          <Link
            href="/developers#api-docs"
            className="rounded-md border border-blue-400 px-10 py-4 font-bold text-white transition hover:bg-blue-800"
          >
            Ver API docs
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
