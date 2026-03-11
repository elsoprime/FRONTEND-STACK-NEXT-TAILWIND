"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Terminal, Code2, Globe2, Lock } from "lucide-react";

const technicalFeatures = [
  {
    title: "Documentación OpenAPI 3.1",
    description: "Contratos de API estrictos validados por esquemas Zod en tiempo real.",
    icon: Code2,
  },
  {
    title: "Trazabilidad Avanzada",
    description: "TraceID unificado para depuración distribuida en microservicios.",
    icon: Terminal,
  },
  {
    title: "Seguridad por Diseño",
    description: "Cumplimiento de estándares OWASP y protección nativa contra CSRF/XSS.",
    icon: Lock,
  },
  {
    title: "Infraestructura Cloud-Native",
    description: "Arquitectura escalable diseñada para entornos de nube híbrida.",
    icon: Globe2,
  },
];

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <header className="mb-20 max-w-3xl">
          <Badge className="mb-4 border-slate-200 bg-slate-900 text-white uppercase tracking-widest text-[10px] font-extrabold dark:bg-blue-900 dark:text-blue-100">
            Developer Ecosystem
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
            Ingeniería de <span className="text-blue-700">Misión Crítica.</span>
          </h1>
          <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400">
            Nuestra plataforma está construida por ingenieros para ingenieros, priorizando la
            extensibilidad, la seguridad y la experiencia del desarrollador (DX) en cada capa.
          </p>
        </header>

        <section id="api-docs" className="grid gap-12 lg:grid-cols-2 mb-24">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Estándares de Integración</h2>
            <div className="rounded-xl border border-slate-200 bg-slate-900 p-8 shadow-2xl dark:border-slate-800">
              <pre className="overflow-x-auto text-sm font-mono leading-relaxed text-slate-300">
                {`// Estándar de Cliente HTTP ERP Media
const client = await ERPClient.init({
  tenantId: 'enterprise-core-01',
  credentials: 'include',
  traceId: true // Auto-generated
});

const response = await client.inventory.getStats();`}
              </pre>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Nuestro SDK oficial permite una integración fluida con el ecosistema de ERP Solutions
              Media, garantizando tipos seguros y trazabilidad en cada llamada.
            </p>
          </div>

          <div className="grid gap-6">
            {technicalFeatures.map((feat) => (
              <div
                key={feat.title}
                className="flex gap-6 p-6 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  <feat.icon className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{feat.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-blue-700 p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para integrar?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Acceda a nuestro entorno de sandbox y comience a construir sobre la infraestructura más
            robusta del mercado para la gestión empresarial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact/technical-consulting"
              className="bg-white text-blue-700 px-8 py-3 rounded-md font-bold hover:bg-blue-50 transition"
            >
              Agendar Consultoria Tecnica
            </Link>
            <Link
              href="/developers#api-docs"
              className="border border-blue-400 text-white px-8 py-3 rounded-md font-bold hover:bg-blue-800 transition"
            >
              Ver API Docs
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
