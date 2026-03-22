"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, Menu, ShieldCheck, X } from "lucide-react";
import { marketingMobileNavItems, marketingNavItems } from "@/lib/marketing.content";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function MarketingHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const desktopNavItems = useMemo(
    () => marketingNavItems.filter((item) => item.href !== "/developers"),
    [],
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300",
        isScrolled
          ? "border-border/80 bg-background/95 shadow-sm"
          : "border-border/70 bg-background/85",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between gap-3 transition-all duration-300",
            isScrolled ? "min-h-[4.25rem] py-2" : "min-h-[4.75rem] py-3",
          )}
        >
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3 transition-opacity hover:opacity-95"
          >
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-all duration-300",
                isScrolled ? "size-9" : "size-10",
              )}
            >
              <Cloud className="size-4 transition-transform duration-200 group-hover:scale-105" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
                ELSOMEDIA One
              </p>
              <p
                className={cn(
                  "hidden text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase sm:block transition-opacity duration-200",
                  isScrolled ? "opacity-80" : "opacity-100",
                )}
              >
                SaaS Enterprise Platform
              </p>
            </div>
          </Link>

          <nav aria-label="Navegacion principal" className="hidden items-center gap-1 lg:flex">
            {desktopNavItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center justify-center rounded-md px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    isScrolled ? "h-9" : "h-10",
                    isActive && "bg-primary/12 text-foreground",
                  )}
                >
                  {item.label}
                  {isActive ? (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <span className="hidden items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-emerald-700 uppercase xl:inline-flex dark:text-emerald-300">
              <ShieldCheck className="size-3.5" />
              SOC2
            </span>

            <Link
              href="/login"
              className={cn(
                "inline-flex items-center justify-center rounded-md border border-border/85 bg-card/75 px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/10",
                isScrolled ? "h-9" : "h-10",
              )}
            >
              Acceso clientes
            </Link>

            <Link
              href="/contact/plan"
              className={cn(
                "inline-flex items-center justify-center rounded-md border border-primary/35 bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-all hover:-translate-y-0.5 hover:brightness-105",
                isScrolled ? "h-9" : "h-10",
              )}
            >
              Solicitar demo
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/contact/plan"
              className="inline-flex h-9 items-center justify-center rounded-md border border-primary/35 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition hover:brightness-105"
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
              {marketingMobileNavItems.map((item) => {
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center justify-center rounded-md border text-xs font-semibold uppercase tracking-[0.1em]",
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
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-border/80 bg-card/80 text-xs font-semibold uppercase tracking-[0.1em] text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/10"
              >
                Acceso clientes
              </Link>
              <span className="inline-flex h-10 items-center rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
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
