"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CorporatePortalHeader } from "@/components/landing/corporate-portal-header";
import { Truck, Globe2, ShieldCheck, Box, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Optimización de Rutas",
    description: "Algoritmos avanzados para reducir tiempos de entrega y costos operativos.",
    icon: Truck,
  },
  {
    title: "Logística Global",
    description: "Gestión unificada de almacenes en múltiples regiones geográficas.",
    icon: Globe2,
  },
  {
    title: "Seguridad de Carga",
    description: "Monitoreo constante y auditorías automáticas de integridad de inventario.",
    icon: ShieldCheck,
  },
  {
    title: "Control de Stock",
    description: "Sincronización en tiempo real entre demanda y niveles de existencias.",
    icon: Box,
  },
];

export default function LogisticsSolutionPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main>
        {/* Hero de Solución */}
        <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <Image
            src="/backgrounds/hero-logistics-desktop.avif"
            alt="Logistics Operations"
            fill
            className="object-cover brightness-[0.35]"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent" />

          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 lg:px-8">
            <Badge className="mb-6 w-fit border-blue-200 bg-blue-700 text-white shadow-lg shadow-blue-700/20 uppercase tracking-widest text-[10px] font-extrabold">
              Vertical: Supply Chain
            </Badge>
            <h1 className="max-w-4xl text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-7xl">
              Infraestructura Crítica para <br />
              <span className="text-blue-500">Logística Global.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-300 font-medium">
              Transforme su cadena de suministro con una plataforma que prioriza la visibilidad
              total, el cumplimiento normativo y la eficiencia operativa a escala empresarial.
            </p>
            <div className="mt-12 flex gap-4">
              <Button
                size="lg"
                className="rounded-md bg-blue-700 px-8 py-6 text-base font-bold text-white hover:bg-blue-800 shadow-xl"
              >
                Agendar Consultoría Técnica
              </Button>
            </div>
          </div>
        </section>

        {/* Malla de Capacidades Logísticas */}
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="mb-20 grid lg:grid-cols-2 gap-12 items-end">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Capacidades de Misión Crítica
              </h2>
              <h3 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                Visibilidad absoluta en cada <br /> etapa del proceso físico.
              </h3>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Nuestra solución vertical para logística se integra perfectamente con su stack de ERP
              Media, proporcionando capas adicionales de seguridad y análisis predictivo.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="group rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="mb-6 flex size-12 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 transition-colors group-hover:bg-blue-700 group-hover:text-white">
                  <feat.icon className="size-6" />
                </div>
                <h4 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
                  {feat.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
