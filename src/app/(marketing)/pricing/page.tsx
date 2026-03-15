import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/lib/marketing.content";
import { MarketingShell } from "../_marketing-shell";

export default function PricingPage() {
  return (
    <MarketingShell>
      <header className="mb-20 text-center">
        <Badge
          variant="outline"
          className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
        >
          Precios transparentes
        </Badge>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          Planes adaptados a su <span className="text-blue-700">escala operativa.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Elija el nivel de infraestructura y seguridad que su organizacion necesita para operar
          con confianza.
        </p>
      </header>

      <section className="grid gap-8 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <article
            key={plan.name}
            className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-lg ${
              plan.popular
                ? "border-blue-200 bg-white ring-2 ring-blue-700 dark:border-blue-900 dark:bg-slate-900"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50"
            }`}
          >
            {plan.popular ? (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-700 px-4 py-1 text-xs font-bold tracking-widest text-white uppercase">
                Recomendado
              </span>
            ) : null}

            <div className="mb-8">
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">
                  {plan.price === "Custom" ? "" : "$"}
                  {plan.price}
                </span>
                {plan.price !== "Custom" ? (
                  <span className="font-medium text-slate-500">/mes</span>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {plan.description}
              </p>
            </div>

            <ul className="mb-10 flex-1 space-y-4">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-medium">
                  <Check className="size-5 shrink-0 text-blue-700" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full py-6 text-base font-bold ${
                plan.popular
                  ? "bg-blue-700 text-white hover:bg-blue-800"
                  : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              }`}
            >
              {plan.cta}
            </Button>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
