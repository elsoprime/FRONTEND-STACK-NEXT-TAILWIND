"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Zap,
  Database,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Code2,
} from "lucide-react";

const implementationPhases = [
  {
    phase: "01",
    title: "Auditoría y Alineación",
    subtitle: "Discovery & Strategy",
    businessValue: "Mapeo de procesos críticos y definición de objetivos ROI para la organización.",
    technicalHitos: [
      "Definición de Arquitectura Lógica",
      "Matriz de Permisos RBAC inicial",
      "Análisis de Entornos Legacy",
    ],
    icon: Search,
    color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  },
  {
    phase: "02",
    title: "Integración de Infraestructura",
    subtitle: "Contract-First Connection",
    businessValue:
      "Conexión segura de sus sistemas mediante contratos de API estrictos y trazabilidad total.",
    technicalHitos: [
      "Validación de esquemas OpenAPI",
      "Configuración de Client SDK con traceId",
      "Activación de Guardas CSRF",
    ],
    icon: Zap,
    color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
  },
  {
    phase: "03",
    title: "Migración de Datos",
    subtitle: "Trust First Data Move",
    businessValue:
      "Traslado seguro de información histórica bajo soberanía de datos y cifrado empresarial.",
    technicalHitos: [
      "ETL con cifrado AES-256",
      "Verificación de Aislamiento de Tenants",
      "Auditoría de Integridad de Datos",
    ],
    icon: Database,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    phase: "04",
    title: "Despliegue y Capacitación",
    subtitle: "Enterprise Onboarding",
    businessValue:
      "Activación del portal corporativo y habilitación de equipos operativos en tiempo récord.",
    technicalHitos: [
      "Rollout de UI NexoStack V2",
      "Dashboard Config para Operaciones",
      "Training de Administradores IT",
    ],
    icon: Users,
    color: "bg-blue-700 text-white",
  },
  {
    phase: "05",
    title: "Gobernanza y Escala",
    subtitle: "Continuous Success",
    businessValue:
      "Monitoreo continuo del éxito y expansión modular de capacidades según la demanda.",
    technicalHitos: [
      "Auditoría de Logs Inmutables",
      "Activación de Módulos CRM/Inventory",
      "Roadmap de Crecimiento Trimestral",
    ],
    icon: TrendingUp,
    color: "bg-slate-900 text-white",
  },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <header className="mb-24 max-w-3xl">
          <Badge className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
            Metodología de Implementación
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
            Despliegue de Grado <span className="text-blue-700">Enterprise.</span>
          </h1>
          <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400">
            Nuestra metodología de 5 fases garantiza una transición fluida hacia ERP Solutions
            Media, priorizando la seguridad y la continuidad operativa.
          </p>
        </header>

        {/* Línea de Tiempo Vertical Interactiva */}
        <section className="relative space-y-24">
          {/* Línea central (decorativa) */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 lg:left-1/2" />

          {implementationPhases.map((phase, index) => (
            <div key={phase.phase} className="relative grid items-center gap-12 lg:grid-cols-2">
              {/* Círculo de Fase */}
              <div className="absolute left-8 -translate-x-1/2 flex size-10 items-center justify-center rounded-full border-4 border-slate-50 bg-blue-700 text-white shadow-xl dark:border-slate-950 lg:left-1/2 z-20">
                <span className="text-xs font-bold">{phase.phase}</span>
              </div>

              {/* Contenido Izquierda / Derecha */}
              <div
                className={`${index % 2 === 0 ? "lg:order-1 lg:text-right" : "lg:order-2 lg:text-left"} pl-16 lg:pl-0`}
              >
                <div
                  className={`inline-flex size-14 items-center justify-center rounded-2xl shadow-sm mb-6 ${phase.color}`}
                >
                  <phase.icon className="size-7" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-2">
                  {phase.subtitle}
                </h3>
                <h4 className="text-3xl font-extrabold mb-4">{phase.title}</h4>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md ml-auto mr-0">
                  {phase.businessValue}
                </p>
              </div>

              {/* Tarjeta Técnica (Doble Capa) */}
              <div className={`${index % 2 === 0 ? "lg:order-2" : "lg:order-1"} pl-16 lg:pl-0`}>
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 mb-6 text-slate-400">
                    <Code2 className="size-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Hitos Técnicos de la Fase
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {phase.technicalHitos.map((hito) => (
                      <li key={hito} className="flex items-center gap-3">
                        <CheckCircle2 className="size-5 text-blue-600 shrink-0" />
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {hito}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Success Metrics / Widgets */}
        <section className="mt-32 rounded-3xl bg-slate-900 p-12 lg:p-16 text-white text-center">
          <h2 className="text-3xl font-bold mb-12 uppercase tracking-widest text-blue-500 text-sm">
            Garantía de Despliegue
          </h2>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-5xl font-extrabold text-white">14 Días</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Promedio de Go-Live
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-extrabold text-white">0.0%</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Pérdida de Datos en Migración
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-extrabold text-white">24/7</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Soporte IT Dedicado
              </div>
            </div>
          </div>
          <div className="mt-16 flex justify-center">
            <Link
              href="/contact/plan"
              className="rounded-md bg-blue-700 px-10 py-4 font-bold text-white hover:bg-blue-800 transition shadow-xl shadow-blue-700/30 flex items-center gap-2"
            >
              Solicitar Plan Detallado
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
