import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { securityCompliances, securityFaqs, securityFeatures } from "@/lib/marketing.content";
import { MarketingShell } from "../_marketing-shell";

export default function SecurityPage() {
  return (
    <MarketingShell>
      <header className="mb-20 text-center">
        <Badge className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
          Trust and Security Center
        </Badge>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          Su confianza es nuestra <br />
          <span className="text-blue-700">mayor prioridad.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Operamos con seguridad por diseno para proteger el activo mas valioso de su empresa: sus
          datos.
        </p>
      </header>

      <section className="mb-24 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {securityFeatures.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              <feature.icon className="size-6" />
            </div>
            <h2 className="mb-3 text-lg font-bold">{feature.title}</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {feature.description}
            </p>
          </article>
        ))}
      </section>

      <section className="mb-24 rounded-3xl bg-slate-900 p-12 text-white lg:p-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold">Certificaciones y cumplimiento</h2>
            <p className="mb-10 text-lg leading-relaxed text-slate-400">
              Auditamos la infraestructura en forma continua para sostener estandares
              internacionales.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {securityCompliances.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-blue-500" />
                  <span className="text-sm font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex aspect-video items-center justify-center rounded-xl border border-blue-500/20 bg-blue-600/10">
            <ShieldCheck className="size-32 text-blue-500/30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-2 text-4xl font-extrabold">SOC 2</div>
              <div className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase">
                Certified Infrastructure
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl">
        <h2 className="mb-12 text-center text-3xl font-bold">Preguntas sobre privacidad</h2>
        <div className="space-y-6">
          {securityFaqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <h3 className="mb-2 font-bold">{faq.question}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
