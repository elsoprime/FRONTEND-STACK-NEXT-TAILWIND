import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, CircleDot, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { pricingPlans } from "@/lib/marketing.content";
import { MarketingShell } from "../_marketing-shell";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes SaaS por escala operativa con detalle de modulos, seguridad y soporte para cada etapa.",
};

type PlanTier = "starter" | "pro" | "enterprise";

type ModuleRow = {
  module: string;
  starter: "Incluido" | "Limitado" | "No incluido";
  pro: "Incluido" | "Limitado" | "No incluido";
  enterprise: "Incluido" | "Limitado" | "No incluido";
};

const moduleRows: readonly ModuleRow[] = [
  { module: "Auth y sesiones", starter: "Incluido", pro: "Incluido", enterprise: "Incluido" },
  { module: "Tenant management", starter: "Incluido", pro: "Incluido", enterprise: "Incluido" },
  { module: "Billing y facturacion", starter: "Limitado", pro: "Incluido", enterprise: "Incluido" },
  { module: "Inventory", starter: "No incluido", pro: "Incluido", enterprise: "Incluido" },
  { module: "CRM", starter: "No incluido", pro: "Incluido", enterprise: "Incluido" },
  { module: "HR", starter: "No incluido", pro: "Limitado", enterprise: "Incluido" },
  { module: "Audit", starter: "Limitado", pro: "Incluido", enterprise: "Incluido" },
  { module: "Expenses", starter: "No incluido", pro: "Limitado", enterprise: "Incluido" },
];

const galleryCards = [
  {
    src: "/backgrounds/pricing/pricing-modules-grid.avif",
    title: "Mapa de modulos",
    description: "Vista por plan con alcance funcional y evolucion modular.",
  },
  {
    src: "/backgrounds/pricing/pricing-security-trust.avif",
    title: "Seguridad y compliance",
    description: "Controles SOC2, trazabilidad y aislamiento de tenant por nivel.",
  },
  {
    src: "/backgrounds/pricing/pricing-support-team.avif",
    title: "Soporte operativo",
    description: "Soporte escalado por criticidad y acompanamiento de onboarding.",
  },
  {
    src: "/backgrounds/pricing/pricing-analytics.avif",
    title: "Analitica ejecutiva",
    description: "Dashboards y monitoreo con foco en KPIs de negocio.",
  },
  {
    src: "/backgrounds/pricing/pricing-logistics.avif",
    title: "Operacion y logistica",
    description: "Cobertura para flujos de inventario y trazabilidad de eventos.",
  },
  {
    src: "/backgrounds/pricing/pricing-collaboration.avif",
    title: "Colaboracion",
    description: "Equipos cross-funcionales trabajando sobre una sola base.",
  },
] as const;

function cellTone(value: ModuleRow["starter"]) {
  if (value === "Incluido") {
    return {
      className:
        "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/10 dark:text-emerald-300",
      icon: Check,
    };
  }

  if (value === "Limitado") {
    return {
      className:
        "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-400/35 dark:bg-amber-500/10 dark:text-amber-300",
      icon: CircleDot,
    };
  }

  return {
    className:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
    icon: X,
  };
}

function ModuleCell({ value }: { value: ModuleRow["starter"] }) {
  const tone = cellTone(value);
  const Icon = tone.icon;

  return (
    <span
      className={`inline-flex min-w-[116px] items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tone.className}`}
    >
      <Icon className="size-3.5" />
      {value}
    </span>
  );
}

export default function PricingPage() {
  return (
    <MarketingShell>
      <header className="mb-14 grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-[1.05fr_0.95fr] dark:border-slate-800 dark:bg-slate-900/50">
        <div>
          <Badge
            variant="outline"
            className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
          >
            Precios transparentes
          </Badge>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Planes claros para cada <span className="text-blue-700">etapa de crecimiento.</span>
          </h1>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Elija su plan por cobertura de modulos, nivel de soporte y exigencia operativa, sin
            cambios de arquitectura al escalar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact/plan"
              className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-6 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Solicitar propuesta
            </Link>
            <Link
              href="/contact/demo"
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Agendar demo
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <Image
            src="/backgrounds/pricing/hero-pricing-enterprise.avif"
            alt="Pricing hero"
            width={1200}
            height={800}
            className="h-full min-h-[300px] w-full object-cover"
            priority
           unoptimized />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/85 via-slate-900/40 to-transparent" />
          <div className="absolute left-4 bottom-4 right-4 rounded-xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-100 uppercase">
              Framework de decision
            </p>
            <p className="mt-2 text-sm text-slate-200">
              Mismo stack visual, mayor cobertura de modulos y soporte segun su carga operativa.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-8 md:grid-cols-3">
        {pricingPlans.map((plan, index) => {
          const tier = (index === 0 ? "starter" : index === 1 ? "pro" : "enterprise") as PlanTier;
          const tierLabel =
            tier === "starter"
              ? "Equipos iniciales"
              : tier === "pro"
                ? "Operacion en crecimiento"
                : "Escala corporativa";

          return (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                plan.popular
                  ? "border-blue-300 bg-white ring-2 ring-blue-700/70 dark:border-blue-800 dark:bg-slate-900"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
              }`}
            >
              {plan.popular ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-700 px-4 py-1 text-xs font-bold tracking-[0.12em] text-white uppercase">
                  Mas elegido
                </span>
              ) : null}

              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">{tierLabel}</p>
              <h2 className="mt-3 text-2xl font-bold">{plan.name}</h2>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">
                  {plan.price === "Custom" ? "" : "$"}
                  {plan.price}
                </span>
                {plan.price !== "Custom" ? (
                  <span className="font-medium text-slate-500">/mes</span>
                ) : (
                  <span className="font-medium text-slate-500">precio consultivo</span>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {plan.description}
              </p>

              <ul className="my-8 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-medium">
                    <Check className="size-5 shrink-0 text-blue-700" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Enterprise" ? "/contact/strategy" : "/contact/plan"}
                className={`inline-flex h-12 w-full items-center justify-center rounded-md text-base font-bold transition ${
                  plan.popular
                    ? "bg-blue-700 text-white hover:bg-blue-800"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          );
        })}
      </section>

      <section className="mt-16 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-800 sm:px-8">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <ShieldCheck className="size-5" />
            <p className="text-sm font-semibold tracking-[0.12em] uppercase">Cobertura por plan</p>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Modulos incluidos y niveles de acceso</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Vista rapida para decidir sin friccion. Incluido = acceso completo, Limitado = acceso
            parcial por capacidad, No incluido = disponible al subir de plan.
          </p>
        </div>

        <div className="overflow-x-auto px-4 py-4 sm:px-6">
          <table className="w-full min-w-[680px] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr>
                <th className="px-3 py-2 text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">Modulo</th>
                <th className="px-3 py-2 text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">Starter</th>
                <th className="px-3 py-2 text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">Business Pro</th>
                <th className="px-3 py-2 text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {moduleRows.map((row) => (
                <tr key={row.module} className="rounded-xl bg-slate-50/80 dark:bg-slate-950/40">
                  <td className="rounded-l-xl px-3 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {row.module}
                  </td>
                  <td className="px-3 py-3">
                    <ModuleCell value={row.starter} />
                  </td>
                  <td className="px-3 py-3">
                    <ModuleCell value={row.pro} />
                  </td>
                  <td className="rounded-r-xl px-3 py-3">
                    <ModuleCell value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {galleryCards.map((card) => (
          <article
            key={card.title}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="relative h-44 overflow-hidden">
              <Image
                src={card.src}
                alt={card.title}
                width={1200}
                height={700}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
               unoptimized />
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{card.description}</p>
            </div>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
