"use client";

import { CorporatePortalHeader } from "@/components/landing/corporate-portal-header";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

const securityFeatures = [
  {
    title: "Cifrado AES-256",
    description: "Datos cifrados en reposo y en tránsito mediante protocolos de grado bancario.",
    icon: Lock,
  },
  {
    title: "Aislamiento de Tenants",
    description:
      "Cada organización opera en un entorno lógico separado, garantizando la privacidad absoluta.",
    icon: Eye,
  },
  {
    title: "Cumplimiento SOC2 & GDPR",
    description:
      "Auditorías anuales para asegurar los más altos estándares de gobernanza y privacidad.",
    icon: FileText,
  },
  {
    title: "Monitoreo 24/7",
    description: "Sistemas de detección de intrusiones y respuesta ante incidentes automatizados.",
    icon: ShieldCheck,
  },
];

const compliances = [
  "SOC 2 Type II Certified",
  "GDPR Compliance",
  "ISO/IEC 27001",
  "HIPAA (Healthcare Ready)",
  "PCI-DSS Level 1",
  "CCPA Compliant",
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <header className="mb-20 text-center">
          <Badge className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
            Trust & Security Center
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
            Su Confianza es Nuestra <br />
            <span className="text-blue-700">Mayor Prioridad.</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Diseñamos ERP Solutions Media bajo el principio de Seguridad por Diseño. Operamos con
            rigor absoluto para proteger el activo más valioso de su empresa: sus datos.
          </p>
        </header>

        {/* Pilares de Seguridad */}
        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-24">
          {securityFeatures.map((feat) => (
            <div
              key={feat.title}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <feat.icon className="size-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">{feat.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </section>

        {/* Compliance Grid */}
        <section className="rounded-3xl bg-slate-900 p-12 lg:p-16 text-white mb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Certificaciones y Cumplimiento</h2>
              <p className="text-slate-400 mb-10 text-lg leading-relaxed">
                Sometemos nuestra infraestructura a auditorías externas exhaustivas para garantizar
                que cumplimos con los estándares internacionales más estrictos.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {compliances.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-blue-500" />
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-video rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="size-32 text-blue-500 opacity-20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-4xl font-extrabold mb-2">SOC 2</div>
                <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">
                  Certified Infrastructure
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ de Seguridad */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Preguntas sobre Privacidad</h2>
          <div className="space-y-6">
            {[
              {
                q: "¿Dónde se almacenan mis datos?",
                a: "Ofrecemos soberanía de datos con opciones de almacenamiento en AWS (Regiones US, EU y Latam).",
              },
              {
                q: "¿Quién tiene acceso a la información?",
                a: "Solo personal autorizado mediante protocolos de acceso 'Zero Trust' y MFA obligatorio.",
              },
              {
                q: "¿Cómo manejan las brechas de seguridad?",
                a: "Contamos con un equipo de respuesta ante incidentes 24/7 y una política de notificación inmediata.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <h4 className="font-bold mb-2">{faq.q}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
