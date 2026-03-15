import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { methodologyHighlights, methodologyPhases } from "@/lib/marketing.content";
import { MarketingShell } from "../_marketing-shell";

export default function MethodologyPage() {
  return (
    <MarketingShell>
      <header className="mb-24 max-w-3xl">
        <Badge className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
          Metodologia de implementacion
        </Badge>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          Despliegue de grado <span className="text-blue-700">enterprise.</span>
        </h1>
        <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400">
          Cinco fases para transicion segura hacia ERP Solutions Media, priorizando continuidad
          operativa y control tecnico.
        </p>
      </header>

      <section className="relative space-y-24">
        <div className="absolute top-0 bottom-0 left-8 w-px bg-slate-200 dark:bg-slate-800 lg:left-1/2" />

        {methodologyPhases.map((phase, index) => (
          <article key={phase.phase} className="relative grid items-center gap-12 lg:grid-cols-2">
            <div className="absolute z-20 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-slate-50 bg-blue-700 text-white shadow-xl dark:border-slate-950 lg:left-1/2">
              <span className="text-xs font-bold">{phase.phase}</span>
            </div>

            <div className={`${index % 2 === 0 ? "lg:order-1 lg:text-right" : "lg:order-2 lg:text-left"} pl-16 lg:pl-0`}>
              <div className={`mb-6 inline-flex size-14 items-center justify-center rounded-2xl shadow-sm ${phase.toneClassName}`}>
                <phase.icon className="size-7" />
              </div>
              <p className="mb-2 text-sm font-bold tracking-widest text-blue-700 uppercase dark:text-blue-400">
                {phase.subtitle}
              </p>
              <h2 className="mb-4 text-3xl font-extrabold">{phase.title}</h2>
              <p className="max-w-md leading-relaxed text-slate-600 lg:ml-auto dark:text-slate-400">
                {phase.businessValue}
              </p>
            </div>

            <div className={`${index % 2 === 0 ? "lg:order-2" : "lg:order-1"} pl-16 lg:pl-0`}>
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mb-6 flex items-center gap-2 text-slate-400">
                  <Code2 className="size-4" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Hitos tecnicos</span>
                </div>
                <ul className="space-y-4">
                  {phase.technicalMilestones.map((milestone) => (
                    <li key={milestone} className="flex items-center gap-3">
                      <CheckCircle2 className="size-5 shrink-0 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-32 rounded-3xl bg-slate-900 p-12 text-center text-white lg:p-16">
        <p className="mb-12 text-sm font-bold tracking-widest text-blue-500 uppercase">Garantia de despliegue</p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          {methodologyHighlights.map((highlight) => (
            <article key={highlight.label} className="space-y-2">
              <p className="text-5xl font-extrabold">{highlight.value}</p>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">{highlight.label}</p>
            </article>
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <Link
            href="/contact/plan"
            className="flex items-center gap-2 rounded-md bg-blue-700 px-10 py-4 font-bold text-white shadow-xl shadow-blue-700/30 transition hover:bg-blue-800"
          >
            Solicitar plan detallado
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
