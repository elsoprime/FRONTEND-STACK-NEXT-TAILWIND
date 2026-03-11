"use client";

import React, { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Users2,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  MousePointer2,
  Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Automatización Inteligente",
    description:
      "Elimina tareas repetitivas con flujos de trabajo potenciados por IA que aprenden de tu equipo.",
    icon: Zap,
    gradient: "from-amber-400 to-orange-600",
    delay: "100ms",
  },
  {
    title: "Analíticas en Tiempo Real",
    description:
      "Visualiza el rendimiento de tu negocio con paneles interactivos y predicciones precisas.",
    icon: BarChart3,
    gradient: "from-indigo-400 to-cyan-500",
    delay: "200ms",
  },
  {
    title: "Colaboración Sin Fronteras",
    description:
      "Conecta a tu equipo globalmente con herramientas de co-edición y comunicación integrada.",
    icon: Users2,
    gradient: "from-purple-400 to-pink-600",
    delay: "300ms",
  },
];

export function SaasVibrant() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white text-slate-950 selection:bg-indigo-100 dark:bg-slate-950 dark:text-white">
      {/* Elementos Decorativos de Fondo */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[60%] w-[60%] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5" />
        <div className="absolute top-[20%] -right-[5%] h-[40%] w-[40%] rounded-full bg-orange-400/10 blur-[100px] dark:bg-orange-500/5" />
        <div className="absolute -bottom-[10%] left-[20%] h-[50%] w-[50%] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-600/5" />

        {/* Patrón de puntos sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <Infinity className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">VORTEX</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400 md:flex">
            <a href="#" className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
              Producto
            </a>
            <a href="#" className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
              Soluciones
            </a>
            <a href="#" className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
              Precios
            </a>
            <a href="#" className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
              Recursos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white sm:block"
            >
              Iniciar Sesión
            </Link>
            <Button className="rounded-full bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30">
              Prueba Gratis
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center sm:px-10 lg:pt-32">
          <div className="reveal-up inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-1.5 backdrop-blur-sm dark:border-indigo-900/30 dark:bg-indigo-900/20">
            <Sparkles className="size-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold tracking-wide text-indigo-700 dark:text-indigo-300">
              NUEVO: Generador de flujos con IA
            </span>
            <div className="ml-1 h-3 w-px bg-indigo-200 dark:bg-indigo-800" />
            <Link
              href="#"
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Saber más <ChevronRight className="size-3" />
            </Link>
          </div>

          <h1
            className="reveal-up font-display mx-auto mt-8 max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-950 sm:text-7xl lg:text-8xl dark:text-white"
            style={{ "--reveal-delay": "100ms" } as CSSProperties}
          >
            Escala tu negocio <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
              sin límites.
            </span>
          </h1>

          <p
            className="reveal-up mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-slate-400"
            style={{ "--reveal-delay": "200ms" } as CSSProperties}
          >
            Vortex es la plataforma &quot;todo-en-uno&quot; que centraliza tus operaciones, potencia
            la creatividad de tu equipo y acelera el crecimiento con datos inteligentes.
          </p>

          <div
            className="reveal-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ "--reveal-delay": "300ms" } as CSSProperties}
          >
            <Button
              size="lg"
              className="h-14 w-full rounded-2xl bg-slate-950 px-8 text-base font-bold text-white transition-all hover:scale-105 hover:bg-slate-800 hover:shadow-xl dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:w-auto"
            >
              Empieza ahora — Es gratis
              <ArrowRight className="ml-2 size-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-full rounded-2xl border-slate-200 bg-white/50 px-8 text-base font-bold backdrop-blur-md transition-all hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 sm:w-auto"
            >
              Ver Demo Interactiva
            </Button>
          </div>

          {/* Elemento Visual Central */}
          <div
            className="reveal-up relative mt-20"
            style={{ "--reveal-delay": "400ms" } as CSSProperties}
          >
            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500 opacity-20 blur-2xl dark:opacity-40" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="size-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="size-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="h-5 w-48 rounded-md bg-slate-200/50 dark:bg-slate-700/50" />
                <div className="flex gap-2">
                  <div className="size-5 rounded-md bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
              <div className="aspect-[16/10] md:aspect-[21/9] p-8">
                <div className="grid h-full grid-cols-12 gap-6">
                  <div className="col-span-3 space-y-4">
                    <div className="h-32 w-full rounded-2xl bg-indigo-50 dark:bg-indigo-900/20" />
                    <div className="h-20 w-full rounded-2xl bg-slate-50 dark:bg-slate-800/50" />
                    <div className="h-20 w-full rounded-2xl bg-slate-50 dark:bg-slate-800/50" />
                  </div>
                  <div className="col-span-6 flex flex-col gap-4">
                    <div className="flex-1 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50">
                      <div className="h-full w-full rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <Layers className="size-12 text-slate-200 dark:text-slate-700" />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 space-y-4">
                    <div className="h-full w-full rounded-2xl bg-orange-50/50 dark:bg-orange-900/10" />
                  </div>
                </div>
              </div>
            </div>

            {/* Flotantes */}
            <div className="absolute -left-12 top-1/2 hidden -translate-y-1/2 lg:block">
              <div
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-bounce dark:border-slate-800 dark:bg-slate-900"
                style={{ animationDuration: "3s" }}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400">Seguridad</div>
                  <div className="text-sm font-bold">100% Encriptado</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-8 bottom-12 hidden lg:block">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-pulse dark:border-slate-800 dark:bg-slate-900">
                <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30">
                  <MousePointer2 className="size-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400">Usuarios</div>
                  <div className="text-sm font-bold">12 en línea</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto mt-24 max-w-7xl px-6 pb-32 sm:px-10 lg:mt-40">
          <div className="flex flex-col items-center text-center">
            <Badge className="bg-indigo-600/10 text-indigo-600 border-indigo-200 mb-6 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
              Características Elite
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
              Diseñado para el futuro del <br />
              <span className="italic text-indigo-600">trabajo moderno.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              No es solo otra herramienta. Es el motor que impulsa la eficiencia de las empresas que
              lideran el mercado.
            </p>
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:border-transparent hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div
                  className={cn(
                    "mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                    feature.gradient,
                  )}
                >
                  <feature.icon className="size-7" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-slate-950 dark:text-white">
                  {feature.title}
                </h3>
                <p className="flex-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-8 flex items-center gap-2 text-sm font-bold text-indigo-600 opacity-0 transition-all group-hover:opacity-100 dark:text-indigo-400">
                  Explorar función <ChevronRight className="size-4" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="group relative mt-24 overflow-hidden rounded-[3rem] bg-indigo-600 p-12 text-white shadow-2xl lg:p-20">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 size-[500px] rounded-full bg-white/10 blur-[100px]" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 size-[500px] rounded-full bg-orange-500/20 blur-[100px]" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
                ¿Listo para transformar <br className="hidden sm:block" /> tu flujo de trabajo?
              </h2>
              <p className="mt-8 max-w-xl text-lg text-indigo-100 sm:text-xl">
                Únete a más de 10,000 equipos que ya están optimizando sus procesos con Vortex. Sin
                tarjetas de crédito, sin compromiso.
              </p>
              <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-14 rounded-2xl bg-white px-10 text-base font-bold text-indigo-600 hover:bg-indigo-50 hover:scale-105 transition-all"
                >
                  Empezar ahora gratis
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 rounded-2xl border-white/20 bg-transparent px-10 text-base font-bold text-white hover:bg-white/10"
                >
                  Hablar con ventas
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-16 dark:border-slate-800 dark:bg-slate-950 sm:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Infinity className="size-6 text-indigo-600" />
              <span className="text-xl font-bold tracking-tight uppercase">Vortex</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              La plataforma de inteligencia operativa líder para equipos modernos y ambiciosos.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Producto</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Funciones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Integraciones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Seguridad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Compañía</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Sobre nosotros
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Carreras
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Términos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-16 max-w-7xl border-t border-slate-200 pt-8 dark:border-slate-800 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-slate-500">
            © 2026 Vortex Technologies S.L. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <div className="size-5 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="size-5 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="size-5 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </footer>
    </div>
  );
}
