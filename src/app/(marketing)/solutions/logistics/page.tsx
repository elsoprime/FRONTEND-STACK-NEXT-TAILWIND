import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logisticsFeatures } from "@/lib/marketing.content";

export default function LogisticsSolutionPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main>
        <section className="relative flex min-h-[500px] items-center overflow-hidden border-b border-slate-200 px-6 py-20 dark:border-slate-800 lg:px-8">
          <Image
            src="/backgrounds/hero-logistics-desktop.avif"
            alt="Logistics operations"
            fill
            className="object-cover brightness-[0.35]"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent" />

          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <Badge className="mb-6 w-fit bg-blue-700 text-[10px] font-extrabold tracking-widest text-white uppercase shadow-lg shadow-blue-700/20">
              Vertical: Supply Chain
            </Badge>
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
              Infraestructura critica para <br />
              <span className="text-blue-500">logistica global.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed font-medium text-slate-300">
              Transforme su cadena de suministro con visibilidad total, cumplimiento normativo y
              eficiencia operativa a escala enterprise.
            </p>
            <div className="mt-12">
              <Link href="/contact/technical-consulting">
                <Button
                  size="lg"
                  className="rounded-md bg-blue-700 px-8 py-6 text-base font-bold text-white shadow-xl hover:bg-blue-800"
                >
                  Agendar consultoria tecnica
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="mb-20 grid items-end gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                Capacidades de mision critica
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Visibilidad absoluta en cada etapa del proceso fisico.
              </h2>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Solucion vertical para logistica integrada con ERP Solutions Media y controles de
              seguridad de extremo a extremo.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {logisticsFeatures.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="mb-6 flex size-12 items-center justify-center rounded-md bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-700 group-hover:text-white dark:bg-blue-900/20 dark:text-blue-400">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="mb-3 text-lg font-bold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
