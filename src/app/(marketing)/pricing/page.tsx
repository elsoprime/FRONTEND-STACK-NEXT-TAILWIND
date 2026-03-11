"use client";

import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CorporatePortalHeader } from "@/components/landing/corporate-portal-header";

const plans = [
  {
    name: "Starter",
    price: "49",
    description: "Ideal para pequeñas empresas que inician su transformación digital.",
    features: ["Hasta 5 usuarios", "Dashboard básico", "Soporte vía email", "Seguridad estándar"],
    cta: "Comenzar Gratis",
    popular: false,
  },
  {
    name: "Business Pro",
    price: "149",
    description: "La solución completa para empresas en crecimiento con necesidades avanzadas.",
    features: ["Usuarios ilimitados", "IA Predictiva básica", "Soporte 24/7", "Cumplimiento SOC2"],
    cta: "Prueba Pro Gratis",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Infraestructura dedicada y gobernanza total para corporaciones globales.",
    features: ["Soberanía de datos", "SSO Personalizado", "Account Manager", "SLA del 99.99%"],
    cta: "Contactar Ventas",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="text-center mb-20">
          <Badge
            variant="outline"
            className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
          >
            Precios Transparentes
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
            Planes adaptados a su <span className="text-blue-700">escala operativa.</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Elija el nivel de infraestructura y seguridad que su organización requiere para operar
            con total confianza y cumplimiento.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-lg ${
                plan.popular
                  ? "border-blue-200 bg-white dark:border-blue-900 dark:bg-slate-900 ring-2 ring-blue-700"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-700 px-4 py-1 text-xs font-bold text-white uppercase tracking-widest">
                  Más Recomendado
                </span>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight">
                    {plan.price === "Custom" ? "" : "$"}
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-slate-500 font-medium">/mes</span>
                  )}
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-10 space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-medium">
                    <Check className="size-5 text-blue-700 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full py-6 text-base font-bold transition ${
                  plan.popular
                    ? "bg-blue-700 text-white hover:bg-blue-800 shadow-md"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
