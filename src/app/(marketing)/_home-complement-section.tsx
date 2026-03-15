import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  homeCapabilityCards,
  homeClientMarks,
  homeFaqs,
  homeStats,
  homeTechPillars,
} from "@/lib/marketing.content";

export function HomeComplementSection() {
  return (
    <section className="bg-slate-50 py-20 text-slate-900 dark:bg-slate-800/80 dark:text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="space-y-6">
            <Badge
              variant="secondary"
              className="rounded-md px-3 py-1 text-[11px] tracking-[0.2em] uppercase"
            >
              Plataforma SaaS B2B
            </Badge>
            <h2 className="max-w-3xl text-balance text-4xl leading-[0.95] font-semibold tracking-tight sm:text-6xl">
              Controla tu operacion SaaS sin romper contratos de integracion.
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg dark:text-slate-300">
              Base frontend para equipos que necesitan gobernanza real: auth, permisos, modulos y
              trazabilidad en una sola direccion visual.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact/plan"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
              >
                Solicitar plan
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/methodology"
                className="inline-flex h-11 items-center rounded-md border border-slate-300 bg-white px-6 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                Ver metodologia
              </Link>
            </div>
          </article>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Control cockpit
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              Sesion, tenant y guardas en un tablero
            </h3>
            <div className="mt-6 grid gap-3">
              {homeTechPillars.map((pillar) => (
                <article
                  key={pillar.title}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <pillar.icon className="size-4" />
                    <h4 className="text-sm font-semibold">{pillar.title}</h4>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {pillar.description}
                  </p>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-wrap gap-4">
            {homeClientMarks.map((mark) => (
              <span
                key={mark}
                className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase"
              >
                {mark}
              </span>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {homeStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="text-3xl leading-none font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs tracking-wide text-slate-600 dark:text-slate-400">
                  {stat.label}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-7 max-w-3xl space-y-2">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Capacidades clave
            </p>
            <h3 className="text-balance text-4xl leading-[0.95] font-semibold">
              Base visual sobria, tecnica y lista para producto real.
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {homeCapabilityCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
              >
                <card.icon className="size-5 text-primary" />
                <h4 className="mt-4 text-2xl leading-tight font-semibold">{card.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-8 flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h3 className="text-2xl font-semibold">Preguntas frecuentes</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {homeFaqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <h4 className="text-sm font-semibold">{faq.question}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
