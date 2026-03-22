"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, Menu, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Seguridad", href: "/security" },
  { label: "Metodologia", href: "/methodology" },
  { label: "Integraciones", href: "/integrations" },
  { label: "Logistica", href: "/solutions/logistics" },
  { label: "Precios", href: "/pricing" },
  { label: "Developers", href: "/developers" },
];

const mobileNavOrder = [
  "/",
  "/pricing",
  "/security",
  "/integrations",
  "/solutions/logistics",
  "/methodology",
  "/developers",
];

const mobileNavItems = mobileNavOrder
  .map((href) => navItems.find((item) => item.href === href))
  .filter((item): item is (typeof navItems)[number] => item !== undefined);

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function CorporatePortalHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-300">
      {/* Accent Top Line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo Section */}
          <Link
            href="/"
            className="group flex flex-shrink-0 items-center gap-3 transition-all duration-300 hover:opacity-100"
          >
            <div className="relative flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-2 shadow-sm transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-md group-hover:shadow-primary/10">
              <Cloud className="size-5 text-primary transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute -inset-1 rounded-xl bg-primary/5 opacity-0 blur-sm transition-opacity group-hover:opacity-100" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                ELSOMEDIA One
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase opacity-70">
                SaaS Platform
              </span>
            </div>
          </Link>

          {/* Center Navigation - Desktop */}
          <nav
            aria-label="Navegación principal"
            className="hidden items-center justify-center gap-1 lg:flex"
          >
            {navItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative px-4 py-2 text-sm font-semibold transition-all duration-300 hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-primary/60 shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions - Desktop */}
          <div className="hidden items-center gap-3 md:flex lg:gap-4">
            <div className="mr-2 hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-bold tracking-widest text-emerald-600 uppercase xl:flex dark:text-emerald-400">
              <ShieldCheck className="size-3.5" />
              SOC2 Compliant
            </div>

            <Link
              href="/login"
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Acceso clientes
            </Link>

            <Link
              href="/contact/plan"
              className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
            >
              <span className="relative z-10">Solicitar demo</span>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          </div>

          {/* Mobile Actions/Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/contact/plan"
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all active:scale-95"
            >
              Demo
            </Link>
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMobileMenuOpen}
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card/50 text-foreground transition-all hover:bg-muted active:scale-90"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="mt-2 space-y-4 border-t border-border/50 pb-6 pt-4 md:hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <nav aria-label="Navegación móvil" className="grid grid-cols-2 gap-3">
              {mobileNavItems.map((item) => {
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.97]",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                        : "border-border/60 bg-card/40 text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-12 items-center justify-center rounded-xl border border-border/80 bg-card/80 text-sm font-bold uppercase tracking-widest text-foreground shadow-sm active:scale-[0.97]"
              >
                Acceso clientes
              </Link>
              <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500/5 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-4" />
                Certificación SOC2
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
