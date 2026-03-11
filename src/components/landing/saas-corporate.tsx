"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  BarChart,
  Users,
  CheckCircle2,
  Globe2,
  Lock,
  PieChart,
  Cloud,
  Code2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Infraestructura Segura",
    description:
      "Protección de datos de nivel empresarial con encriptación AES-256 y cumplimiento normativo global.",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    title: "Análisis Predictivo",
    description:
      "Tome decisiones basadas en datos con nuestros modelos de IA que anticipan tendencias de mercado.",
    icon: BarChart,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    title: "Gestión de Equipos",
    description:
      "Optimice la colaboración entre departamentos con herramientas de permisos granulares.",
    icon: Users,
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
];

const stats = [
  { label: "Empresas", value: "500+" },
  { label: "Uptime", value: "99.99%" },
  { label: "Soporte", value: "24/7" },
  { label: "Seguridad", value: "SOC2" },
];

const backgroundImages = [
  "/backgrounds/hero-hr-desktop.avif",
  "/backgrounds/hero-operations-desktop.avif",
  "/backgrounds/hero-office-desktop.avif",
  "/backgrounds/hero-logistics-desktop.avif",
  "/backgrounds/hero-financial-desktop.avif",
];

export function SaasCorporate() {
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 dark:bg-slate-950 dark:text-slate-100">
      <main>
        {/* Hero Section con Slide Fade Out de imágenes AVIF */}
        <section className="relative min-h-[600px] overflow-hidden border-b border-slate-200 px-6 pt-24 pb-20 dark:border-slate-800 lg:px-8 lg:pt-32 flex items-center">
          {/* Background Images Layer */}
          <div className="absolute inset-0 z-0">
            {backgroundImages.map((src, index) => (
              <div
                key={src}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[3000ms] ease-in-out",
                  index === currentBg ? "opacity-100 z-10" : "opacity-0 z-0",
                )}
              >
                <div className="relative h-full w-full animate-ken-burns">
                  <Image
                    src={src}
                    alt="Hero background"
                    fill
                    className="object-cover"
                    priority={index <= 1}
                    unoptimized
                  />
                  {/* Overlay para legibilidad - Gradiente de claro a oscuro */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent dark:from-slate-950/95 dark:via-slate-950/80 z-20" />
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 mx-auto max-w-7xl w-full">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div className="flex flex-col items-start text-left">
                <Badge
                  variant="outline"
                  className="mb-6 border-blue-200 bg-blue-50/50 backdrop-blur-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400"
                >
                  Certificación SOC2 Tipo II
                </Badge>
                <h1 className="mb-8 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                  Gestión Inteligente para <br />
                  <span className="text-blue-700">Empresas Modernas.</span>
                </h1>
                <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-800 dark:text-slate-300 font-medium">
                  Optimice sus flujos de trabajo críticos con una plataforma diseñada para la
                  escalabilidad, la seguridad y el cumplimiento normativo riguroso.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href="/contact/demo">
                    <Button
                      size="lg"
                      className="rounded-md bg-blue-700 px-8 py-6 text-base font-bold text-white hover:bg-blue-800 shadow-lg shadow-blue-700/20"
                    >
                      Comience su Evaluacion Gratis
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-md border-slate-300 bg-white/50 backdrop-blur-md px-8 py-6 text-base font-bold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-900/50"
                  >
                    Ver PDF de Capacidades
                  </Button>
                </div>

                <div className="mt-12 flex items-center gap-6 grayscale opacity-70 dark:invert dark:opacity-50">
                  <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs">
                    Con la confianza de:
                  </div>
                  <div className="flex gap-8 items-center">
                    <div className="h-6 w-20 bg-slate-400/30 rounded" />
                    <div className="h-6 w-24 bg-slate-400/30 rounded" />
                    <div className="h-6 w-16 bg-slate-400/30 rounded" />
                  </div>
                </div>
              </div>

              {/* Visualización Profesional del Dashboard con Glassmorphism */}
              <div className="relative hidden lg:block">
                <div className="absolute -inset-4 rounded-xl bg-blue-500/5 blur-2xl" />
                <div className="relative rounded-lg border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-2xl dark:border-slate-800/50 dark:bg-slate-900/80">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800/50 dark:bg-slate-800/50">
                    <div className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-20 rounded border border-slate-100/50 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-800/30 p-3"
                        >
                          <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                          <div className="h-4 w-3/4 bg-slate-300 dark:bg-slate-600 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="h-48 rounded border border-slate-100/50 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-800/30 p-4">
                      <div className="flex items-end h-full gap-2">
                        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-blue-600/20 dark:bg-blue-400/10 rounded-t"
                            style={{ height: `${h}%` }}
                          >
                            <div
                              className="w-full bg-blue-600 dark:bg-blue-500 rounded-t"
                              style={{ height: "30%" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicador de Status */}
                <div className="absolute -bottom-6 -right-6 rounded-lg border border-slate-200/50 bg-white/90 backdrop-blur-md p-4 shadow-xl dark:border-slate-800/50 dark:bg-slate-900/90">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Sistema</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Operativo (100%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Malla de Características - Enfocado en Valor de Negocio */}
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="mb-20 max-w-2xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Eficiencia Operativa
            </h2>
            <h3 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Herramientas diseñadas para <br /> equipos de alto rendimiento.
            </h3>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
              Nuestra plataforma integra verticalmente todas las necesidades operativas de su
              organización bajo una única interfaz segura y auditable.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-lg border border-slate-200 bg-white p-8 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div
                  className={cn(
                    "mb-6 flex size-12 items-center justify-center rounded-md",
                    feature.bgColor,
                    feature.color,
                  )}
                >
                  <feature.icon className="size-6" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sección de Estadísticas / Trust */}
        <section className="bg-slate-900 py-16 text-white dark:bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciadores Clave */}
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-12">
              <div>
                <div className="flex size-10 items-center justify-center rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                  <Globe2 className="size-6" />
                </div>
                <h4 className="text-2xl font-bold mb-4">Alcance Global, Datos Locales</h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Soberanía de datos garantizada con más de 12 regiones de almacenamiento para
                  cumplir con normativas locales como GDPR, LGPD y CCPA.
                </p>
              </div>
              <div>
                <div className="flex size-10 items-center justify-center rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 mb-4">
                  <Lock className="size-6" />
                </div>
                <h4 className="text-2xl font-bold mb-4">Seguridad End-to-End</h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Autenticación multifactor obligatoria, SSO empresarial (SAML/OIDC) y registros de
                  auditoría inmutables para cada acción.
                </p>
              </div>
              <div>
                <div className="flex size-10 items-center justify-center rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mb-4">
                  <PieChart className="size-6" />
                </div>
                <h4 className="text-2xl font-bold mb-4">Reportes de Grado Ejecutivo</h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Genere informes listos para juntas directivas con un solo clic, visualizando KPIs
                  operativos y ROI de infraestructura en tiempo real.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-blue-700 p-12 text-white shadow-xl lg:p-16">
              <h3 className="text-3xl font-bold mb-6">Pruebe ERP Solutions Media hoy mismo</h3>
              <p className="text-blue-100 text-lg mb-8">
                Descubra por qué los CTOs de las empresas Fortune 500 confían en nuestra
                infraestructura para sus operaciones críticas.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Configuración asistida en 24h",
                  "Acuerdo de Nivel de Servicio (SLA) del 99.9%",
                  "Gerente de Éxito de Cuenta dedicado",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-blue-300" />
                    <span className="font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact/strategy" className="block">
                <Button className="w-full rounded-md bg-white py-6 text-lg font-bold text-blue-700 hover:bg-blue-50">
                  Agendar Reunion Estrategica
                </Button>
              </Link>
              <p className="mt-6 text-center text-sm text-blue-200">
                Sin compromiso inicial. Planes adaptados a su volumen de transacciones.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Estilo Corporativo con Desarrolladora */}
      <footer className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4 lg:grid-cols-5">
            <div className="md:col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Cloud className="size-6 text-blue-700" />
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                  ERP Solutions Media
                </span>
              </div>
              <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Plataforma de infraestructura inteligente para la gestión de datos y operaciones
                empresariales a escala global.
              </p>

              <div className="mt-8 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Code2 className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Desarrollado por
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ELSOMEDIA
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Esteban Soto Ojeda — @elsoprimeDev
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white mb-6">Soluciones</h5>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Soberanía de Datos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Cumplimiento SOC2
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Integración ERP
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    IA Predictiva
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white mb-6">Compañía</h5>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Prensa
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Carreras
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white mb-6">Legal</h5>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Términos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition">
                    Seguridad
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-16 border-t border-slate-100 pt-8 dark:border-slate-800 flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-slate-400">
              © 2026 ERP Solutions Media. Todos los derechos reservados. Certificado SOC2.
            </p>
            <div className="flex gap-6 text-slate-400">
              <a href="#" className="hover:text-slate-600">
                <Globe2 className="size-5" />
              </a>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="text-xs font-bold uppercase tracking-widest">ELSOMEDIA</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
