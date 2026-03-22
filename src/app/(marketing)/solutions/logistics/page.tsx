import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { logisticsFeatures } from "@/lib/marketing.content";

export const metadata: Metadata = {
  title: "Solucion Logistica",
  description:
    "Infraestructura SaaS para logistica global con trazabilidad, seguridad y control operativo en tiempo real.",
};

type CoverageState = "Completo" | "Parcial" | "Extendido";

type ModuleCoverage = {
  module: string;
  capability: string;
  status: CoverageState;
};

const kpiCards = [
  { label: "OTIF", value: "97.4%", note: "entregas completas y a tiempo" },
  { label: "Rotacion", value: "8.1x", note: "inventario anual promedio" },
  { label: "Quiebres", value: "-34%", note: "reduccion trimestral" },
  { label: "Ciclo", value: "42h", note: "recepcion a despacho" },
] as const;

const operationalFlow = [
  {
    step: "01",
    stage: "Recepcion y alta",
    detail: "Ingreso de mercaderia con control de lotes y estado inicial.",
    module: "Inventory",
  },
  {
    step: "02",
    stage: "Almacenamiento",
    detail: "Ubicaciones y reglas por bodega para trazabilidad y disponibilidad.",
    module: "Inventory",
  },
  {
    step: "03",
    stage: "Picking y despacho",
    detail: "Priorizacion por compromiso de entrega y validaciones operativas.",
    module: "Inventory + Billing",
  },
  {
    step: "04",
    stage: "Seguimiento de cliente",
    detail: "Visibilidad de cumplimiento y eventos de entrega en CRM.",
    module: "CRM",
  },
  {
    step: "05",
    stage: "Auditoria y control",
    detail: "Evidencia de cambios, usuarios y trazas para compliance.",
    module: "Audit",
  },
] as const;

const moduleCoverage: readonly ModuleCoverage[] = [
  {
    module: "Inventory",
    capability: "Lotes, stocktakes, alertas de stock, reconciliacion",
    status: "Completo",
  },
  {
    module: "Audit",
    capability: "Trazabilidad de eventos, hitos y contexto operativo",
    status: "Completo",
  },
  {
    module: "Billing",
    capability: "Costeo de ordenes y estado financiero operativo",
    status: "Parcial",
  },
  {
    module: "CRM",
    capability: "Seguimiento de cuentas y cumplimiento de entrega",
    status: "Parcial",
  },
  {
    module: "Expenses",
    capability: "Control de gastos logisticos y flujo de aprobacion",
    status: "Extendido",
  },
] as const;

const criticalAlerts = [
  {
    title: "Stock bajo en SKU criticos",
    severity: "Alta",
    action: "Reabastecer y priorizar compra en menos de 12h.",
  },
  {
    title: "Diferencia en conteo de bodega",
    severity: "Media",
    action: "Lanzar stocktake parcial y validar ajustes por usuario.",
  },
  {
    title: "Lote proximo a vencimiento",
    severity: "Alta",
    action: "Aplicar estrategia FEFO y bloquear nuevos despachos no validados.",
  },
] as const;

const useCases = [
  "Retail con reposicion diaria y alta variabilidad de demanda",
  "Distribucion mayorista con multiples bodegas y rutas",
  "Operadores 3PL con requerimientos de evidencia auditada",
] as const;

const logisticsTestimonials = [
  {
    quote:
      "Reducimos quiebres en productos criticos y logramos visibilidad operativa diaria por bodega.",
    author: "Sofia Mena",
    role: "Head of Operations, Norte Distribucion",
  },
  {
    quote:
      "Con Inventory + Audit dejamos de discutir datos: ahora tenemos trazabilidad accionable por evento.",
    author: "Tomas Rivas",
    role: "Supply Chain Manager, Vector Retail",
  },
  {
    quote:
      "El mayor valor fue unificar despacho, alertas y seguimiento comercial sin rehacer todo el stack.",
    author: "Camila Torres",
    role: "COO, Andes Fulfillment",
  },
] as const;

const logisticsFaqs = [
  {
    question: "Cuanto tarda una puesta en marcha inicial?",
    answer:
      "Depende del alcance, pero el onboarding operativo suele iniciar en semanas con fases por prioridad.",
  },
  {
    question: "Se puede operar por modulos sin migracion completa?",
    answer:
      "Si. Puede comenzar por Inventory y Audit, luego extender a Billing, CRM y Expenses segun madurez.",
  },
  {
    question: "Como se controlan accesos por area o rol?",
    answer:
      "Con permisos por tenant y trazabilidad de eventos para auditar cambios, aprobaciones y acciones criticas.",
  },
  {
    question: "Que pasa con integraciones existentes?",
    answer:
      "La estrategia es contract-first con OpenAPI para integrar por etapas y reducir riesgo operativo.",
  },
] as const;

function statusClasses(status: CoverageState): string {
  if (status === "Completo") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (status === "Parcial") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
  }

  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
}

export default function LogisticsSolutionPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main>
        <section className="relative flex min-h-[560px] items-center overflow-hidden border-b border-slate-200 px-6 py-20 dark:border-slate-800 lg:px-8">
          <Image
            src="/backgrounds/hero-logistics-desktop.avif"
            alt="Logistics operations"
            fill
            className="object-cover brightness-[0.35]"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent" />

          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <Badge className="mb-6 w-fit bg-blue-700 text-[10px] font-extrabold tracking-widest text-white uppercase shadow-lg shadow-blue-700/20">
              Vertical: Supply Chain
            </Badge>
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
              Control operativo para <br />
              <span className="text-blue-500">logistica con trazabilidad total.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed font-medium text-slate-300">
              Una vista unificada para inventario, despacho, cumplimiento y auditoria, integrada al
              ecosistema modular de ELSOMEDIA One.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/contact/technical-consulting"
                className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-6 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Agendar consultoria tecnica
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Ver planes y modulos
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.12em] text-slate-200 uppercase">
              <Link href="#logistics-testimonials" className="rounded-full border border-white/25 px-3 py-1.5 transition hover:bg-white/15">
                Ver casos reales
              </Link>
              <Link href="#logistics-faq" className="rounded-full border border-white/25 px-3 py-1.5 transition hover:bg-white/15">
                Ver FAQ
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-8 flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Clock3 className="size-5" />
            <p className="text-xs font-semibold tracking-[0.14em] uppercase">Panel operativo</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((kpi) => (
              <article
                key={kpi.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
              >
                <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">{kpi.label}</p>
                <p className="mt-2 text-4xl font-extrabold tracking-tight">{kpi.value}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{kpi.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
              Flujo de operacion
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              De recepcion a auditoria, sin perder contexto.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {operationalFlow.map((step) => (
              <article
                key={step.step}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
              >
                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold tracking-[0.12em] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {step.step}
                </span>
                <h3 className="mt-3 text-lg font-bold">{step.stage}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{step.detail}</p>
                <p className="mt-3 inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  {step.module}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-800 sm:px-8">
              <div className="mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <ShieldCheck className="size-5" />
                <p className="text-xs font-semibold tracking-[0.14em] uppercase">Cobertura modular</p>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Que cubre cada modulo en Logistica</h2>
            </div>

            <div className="space-y-2 p-4 sm:p-6">
              {moduleCoverage.map((item) => (
                <article
                  key={item.module}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[180px_1fr_120px] md:items-center dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <p className="text-sm font-bold">{item.module}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.capability}</p>
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(item.status)}`}
                  >
                    {item.status}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-4 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-5" />
                <p className="text-xs font-semibold tracking-[0.14em] uppercase">Alertas criticas</p>
              </div>
              <div className="space-y-3">
                {criticalAlerts.map((alert) => (
                  <div
                    key={alert.title}
                    className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-950/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{alert.title}</p>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{alert.action}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Truck className="size-5" />
                <p className="text-xs font-semibold tracking-[0.14em] uppercase">Casos de uso</p>
              </div>
              <ul className="space-y-3">
                {useCases.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contact/strategy"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Diseñar plan logistico
                <ArrowRight className="size-4" />
              </Link>
            </article>
          </div>
        </section>

        <section id="logistics-testimonials" className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight">Equipos que mejoraron su operacion</h2>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              Casos reales
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {logisticsTestimonials.map((item) => (
              <article
                key={item.author}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
              >
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">&quot;{item.quote}&quot;</p>
                <p className="mt-4 text-sm font-bold">{item.author}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="logistics-faq" className="mx-auto max-w-5xl px-6 pb-16 lg:px-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold tracking-[0.14em] text-blue-700 uppercase dark:text-blue-400">
              FAQ Logistica
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Preguntas frecuentes antes de implementar</h2>
          </div>
          <div className="space-y-3">
            {logisticsFaqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm open:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:open:bg-slate-900"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold sm:text-base">{faq.question}</summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-700 to-slate-900 p-8 text-white shadow-xl sm:p-10">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-blue-100">
              Integraciones y expansion
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Conecte su operacion logistica sin rehacer su stack.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Integracion por contratos OpenAPI con sistemas de origen, trazabilidad completa en
              Audit y evolucion por modulos segun su volumen operativo.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {logisticsFeatures.map((feature) => (
                <span
                  key={feature.title}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide"
                >
                  {feature.title}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact/plan"
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Solicitar propuesta por volumen
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Comparar planes
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
