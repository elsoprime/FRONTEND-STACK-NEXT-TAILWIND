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
    <header className="sticky top-0 z-50 w-full border-b border-border/75 bg-background/78 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[4.6rem] items-center justify-between gap-3 py-3">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Cloud className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
                ERP Solutions Media
              </p>
              <p className="hidden text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase sm:block">
                Enterprise Control Hub
              </p>
            </div>
          </Link>

          <nav aria-label="Navegacion principal" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "nav-link-pill",
                    isActive &&
                      "bg-primary/14 text-foreground shadow-[inset_0_0_0_1px_oklch(0.58_0.16_42/0.24)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-1.5 sm:gap-2 md:flex">
            <span className="hidden items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-emerald-700 uppercase lg:inline-flex dark:text-emerald-300">
              <ShieldCheck className="size-3.5" />
              SOC2
            </span>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border/80 bg-card/80 px-4 text-center text-sm leading-none font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
            >
              Acceso a clientes
            </Link>
            <Link
              href="/contact/plan"
              className="inline-flex h-10 items-center justify-center rounded-md border border-primary/35 bg-primary px-5 text-center text-sm leading-none font-semibold text-primary-foreground shadow-md shadow-primary/35 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
            >
              Solicitar demo
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/contact/plan"
              className="inline-flex h-9 items-center justify-center rounded-md border border-primary/35 bg-primary px-3 text-center text-xs leading-none font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all duration-200 hover:brightness-105"
            >
              Demo
            </Link>
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
              aria-expanded={isMobileMenuOpen}
              className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card/75 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="space-y-3 border-t border-border/70 py-3 md:hidden">
            <nav aria-label="Navegacion movil" className="grid grid-cols-2 gap-2">
              {mobileNavItems.map((item) => {
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center justify-center rounded-md border text-xs font-semibold uppercase tracking-[0.1em]",
                      isActive
                        ? "border-primary/35 bg-primary/14 text-foreground"
                        : "border-border/70 bg-card/70 text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-border/80 bg-card/80 text-center text-xs leading-none font-semibold uppercase tracking-[0.1em] text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/10"
              >
                Acceso clientes
              </Link>
              <span className="inline-flex h-9 items-center rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="mr-1.5 size-3.5" />
                SOC2
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
