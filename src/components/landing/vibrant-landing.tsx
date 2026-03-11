import Link from "next/link";
import { ArrowRight, Zap, Globe, Lock, Box, ChevronRight, Monitor, Command } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Performance Extreme",
    description: "Built for speed. Optimized for the next generation of web applications.",
    icon: Zap,
    color: "oklch(0.65 0.25 350)",
  },
  {
    title: "Global Scale",
    description: "Deploy everywhere. Low latency, high availability, edge-first infrastructure.",
    icon: Globe,
    color: "oklch(0.6 0.2 240)",
  },
  {
    title: "Secure by Default",
    description: "Military-grade encryption and tenant isolation built into the core.",
    icon: Lock,
    color: "oklch(0.65 0.15 150)",
  },
];

export function VibrantLanding() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-white selection:bg-white/30">
      {/* Background Mesh Gradient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[oklch(0.5_0.2_300/0.15)] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[oklch(0.6_0.2_30/0.15)] blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] h-[30%] w-[30%] rounded-full bg-[oklch(0.55_0.2_240/0.1)] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 pt-8 sm:px-10">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-white/60 text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform duration-300 group-hover:scale-110">
            <Command className="size-6" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tighter">NEXO</span>
        </div>

        <nav className="hidden items-center gap-8 text-[13px] font-medium tracking-wide uppercase text-white/60 md:flex">
          <a href="#" className="transition hover:text-white">
            Product
          </a>
          <a href="#" className="transition hover:text-white">
            Features
          </a>
          <a href="#" className="transition hover:text-white">
            Pricing
          </a>
          <a href="#" className="transition hover:text-white">
            Docs
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            Log in
          </Link>
          <Button
            variant="default"
            className="rounded-full bg-white px-6 text-black hover:bg-white/90"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto mt-24 max-w-7xl px-6 text-center sm:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md transition-all hover:border-white/20">
          <span className="flex size-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium tracking-wide text-white/80">
            Version 4.0 is now live
          </span>
          <ChevronRight className="size-3 text-white/40" />
        </div>

        <h1 className="font-display mx-auto mt-8 max-w-4xl text-6xl font-bold leading-[0.9] tracking-tighter text-balance sm:text-8xl lg:text-9xl">
          Future-proof <br />
          <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
            Digital Identity
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/50 sm:text-xl">
          Unified authentication, real-time analytics, and modular infrastructure for teams that
          build the future. Experience the most vibrant developer stack ever made.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="h-14 w-full rounded-2xl bg-white px-8 text-base font-bold text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] sm:w-auto"
          >
            Start Building Now
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 w-full rounded-2xl border-white/10 bg-white/5 px-8 text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/10 sm:w-auto"
          >
            Book a Demo
          </Button>
        </div>

        {/* Visual Element */}
        <div className="relative mt-20 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-2 backdrop-blur-2xl sm:mt-32">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60" />
          <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-px">
            <div className="h-full w-full rounded-2xl bg-[#080808] p-8">
              <div className="flex h-full flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="size-3 rounded-full bg-white/20" />
                    <div className="size-3 rounded-full bg-white/20" />
                    <div className="size-3 rounded-full bg-white/20" />
                  </div>
                  <div className="h-6 w-32 rounded-lg bg-white/5" />
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="grid w-full grid-cols-2 gap-8 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-24 w-full rounded-xl bg-white/5" />
                        <div className="h-3 w-2/3 rounded bg-white/10" />
                        <div className="h-3 w-1/2 rounded bg-white/5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 mx-auto mt-32 max-w-7xl px-6 pb-32 sm:px-10">
        <div className="mb-16 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-xl">
            <Badge className="bg-white/10 text-white/80 border-white/5 mb-4">
              Core Infrastructure
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Engineered for the elite. <br />
              <span className="text-white/40">Powered by Nexo Core.</span>
            </h2>
          </div>
          <Link
            href="#"
            className="group flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white"
          >
            Explore all features
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 transition-all hover:bg-white/[0.04] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div
                className="absolute -right-4 -top-4 size-32 opacity-10 blur-3xl transition-opacity group-hover:opacity-20"
                style={{ backgroundColor: feature.color }}
              />
              <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-white/5 text-white transition-transform duration-500 group-hover:scale-110">
                <feature.icon className="size-7" />
              </div>
              <h3 className="font-display mb-3 text-2xl font-bold tracking-tight">
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed text-white/50">{feature.description}</p>

              <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                Learn more <ChevronRight className="size-3" />
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Card */}
        <div className="group relative mt-12 overflow-hidden rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-12">
          <div className="relative z-10 grid gap-12 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
                Experience <br />
                <span className="text-orange-500 italic">velocity.</span>
              </h2>
              <p className="mt-6 text-lg text-white/50">
                Our platform is optimized for sub-100ms response times globally. Built on top of a
                revolutionary architecture that prioritizes developer experience.
              </p>
              <div className="mt-8 flex gap-4">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold">99.99%</span>
                  <span className="text-xs font-bold uppercase tracking-tighter text-white/30">
                    Uptime SLAs
                  </span>
                </div>
                <div className="w-px bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-3xl font-bold">120ms</span>
                  <span className="text-xs font-bold uppercase tracking-tighter text-white/30">
                    Avg. Latency
                  </span>
                </div>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 blur-3xl" />
              <div className="relative size-64 rounded-full border border-white/10 bg-white/5 backdrop-blur-3xl animate-[spin_20s_linear_infinite] flex items-center justify-center">
                <Monitor className="size-24 text-white/20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                  <Zap className="size-6 text-black" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050505] px-6 py-12 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <Command className="size-6 text-white" />
            <span className="font-display text-xl font-bold tracking-tighter uppercase">Nexo</span>
          </div>
          <p className="text-sm text-white/40">
            © 2026 Nexo Stack. All rights reserved. Designed for the bold.
          </p>
          <div className="flex gap-6 text-sm font-medium text-white/40">
            <a href="#" className="hover:text-white">
              Twitter
            </a>
            <a href="#" className="hover:text-white">
              GitHub
            </a>
            <a href="#" className="hover:text-white">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
