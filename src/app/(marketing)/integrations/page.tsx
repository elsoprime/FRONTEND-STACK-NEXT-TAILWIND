"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Database, Zap, Server } from "lucide-react";

const integrationCategories = [
  {
    name: "Infraestructura Cloud",
    icon: Server,
    integrations: [
      {
        name: "AWS",
        description: "Almacenamiento y computación escalable.",
        color: "text-orange-500",
      },
      {
        name: "Azure",
        description: "Servicios cloud empresariales de Microsoft.",
        color: "text-blue-500",
      },
      {
        name: "Google Cloud",
        description: "Infraestructura de datos e IA avanzada.",
        color: "text-blue-400",
      },
    ],
  },
  {
    name: "Productividad & CRM",
    icon: MessageSquare,
    integrations: [
      {
        name: "Slack",
        description: "Notificaciones operativas en tiempo real.",
        color: "text-purple-500",
      },
      {
        name: "Salesforce",
        description: "Sincronización bidireccional de clientes.",
        color: "text-blue-600",
      },
      {
        name: "Microsoft 365",
        description: "Integración nativa con Excel y Teams.",
        color: "text-red-500",
      },
    ],
  },
  {
    name: "Operaciones & Datos",
    icon: Database,
    integrations: [
      {
        name: "SAP S/4HANA",
        description: "Conector nativo para procesos ERP core.",
        color: "text-blue-800",
      },
      {
        name: "Snowflake",
        description: "Data warehousing para analítica avanzada.",
        color: "text-blue-300",
      },
      {
        name: "Datadog",
        description: "Monitoreo y observabilidad de sistema.",
        color: "text-purple-600",
      },
    ],
  },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <header className="mb-20 max-w-3xl">
          <Badge className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
            Ecosistema NexoStack
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
            Conecte su Negocio al <br />
            <span className="text-blue-700">Mundo Digital.</span>
          </h1>
          <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400">
            NexoStack no es una isla. Nuestra plataforma se integra con las herramientas que su
            organización ya utiliza para maximizar la eficiencia y centralizar los datos.
          </p>
        </header>

        {/* Categories & Grid */}
        <section className="space-y-20">
          {integrationCategories.map((category) => (
            <div key={category.name}>
              <div className="flex items-center gap-3 mb-10 border-b border-slate-200 pb-4 dark:border-slate-800">
                <category.icon className="size-6 text-blue-700 dark:text-blue-400" />
                <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {category.integrations.map((app) => (
                  <article
                    key={app.name}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:shadow-xl hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-xs text-slate-400 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 group-hover:bg-white transition-colors">
                        {app.name.substring(0, 2)}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold text-slate-400"
                      >
                        Certificada
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-700 transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                      {app.description}
                    </p>
                    <Link
                      href={`/contact/connectors?integration=${encodeURIComponent(app.name)}`}
                      className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center gap-2 group-hover:gap-3 transition-all"
                    >
                      Configurar Conector
                      <Zap className="size-3 fill-current" />
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Custom Integration CTA */}
        <section className="mt-32 rounded-3xl bg-blue-700 p-12 lg:p-20 text-white text-center shadow-2xl shadow-blue-700/20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 sm:text-4xl">¿No encuentra su herramienta?</h2>
            <p className="text-blue-100 text-lg mb-10">
              Nuestro equipo de ingeniería puede desarrollar conectores personalizados para sistemas
              legados o propietarios, garantizando el cumplimiento de los contratos de API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact/custom-connector"
                className="bg-white text-blue-700 px-10 py-4 rounded-md font-bold hover:bg-blue-50 transition shadow-lg"
              >
                Solicitar Conector Propio
              </Link>
              <Link
                href="/developers#api-docs"
                className="border border-blue-400 text-white px-10 py-4 rounded-md font-bold hover:bg-blue-800 transition"
              >
                Ver API Docs
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
