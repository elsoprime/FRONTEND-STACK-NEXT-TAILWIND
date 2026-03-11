"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Cloud,
  LogOut,
  Settings,
  User,
  Users,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutConfirmDialog } from "@/components/auth/logout-confirm-dialog";
import { cn } from "@/lib/utils";
import { useTenantStore } from "@/store/tenant-store";

const moduleItems = [
  { label: "Inventory", href: "/app/modules/inventory", icon: Boxes },
  { label: "CRM", href: "/app/modules/crm", icon: BriefcaseBusiness },
  { label: "HR", href: "/app/modules/hr", icon: Users },
  { label: "Ajustes", href: "/app/settings/tenant", icon: Settings },
];

function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/65 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[4.4rem] items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href="/app"
              className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-primary/35 bg-primary text-primary-foreground shadow-lg shadow-primary/28">
                <Cloud className="size-5" />
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-base font-semibold tracking-tight text-foreground">
                  ERP Solutions Media
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Tenant Workspace
                </p>
              </div>
            </Link>

            {activeTenant ? (
              <div className="hidden min-w-0 items-center gap-2 rounded-full border border-border/80 bg-card/75 px-3 py-1.5 md:flex">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {activeTenant.name}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {activeMembership?.roleKey ?? "Member"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/app/tenants/select" className="hidden sm:block">
              <Button variant="outline" size="sm" className="rounded-full">
                <ArrowRightLeft className="size-4" />
                Tenant
              </Button>
            </Link>

            <Link href="/app/settings/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="size-4" />
              </Button>
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setIsLogoutDialogOpen(true)}
            >
              <LogOut className="size-4" />
            </Button>

            <button
              type="button"
              aria-label={isMobileMenuOpen ? "Cerrar menu de modulos" : "Abrir menu de modulos"}
              aria-expanded={isMobileMenuOpen}
              className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card/75 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65 sm:hidden"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        <nav
          aria-label="Navegacion de modulos"
          className="hidden items-center gap-1 overflow-x-auto pb-3 md:flex [&::-webkit-scrollbar]:hidden"
        >
          {moduleItems.map((item) => {
            const isActive = isPathActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "dashboard-nav-pill shrink-0",
                  isActive &&
                    "border-primary/35 bg-primary/14 text-foreground shadow-[0_8px_22px_-16px_oklch(0.58_0.16_42/0.75)]",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/app/tenants/select"
            aria-current={isPathActive(pathname, "/app/tenants/select") ? "page" : undefined}
            className={cn(
              "dashboard-nav-pill shrink-0 sm:hidden",
              isPathActive(pathname, "/app/tenants/select") &&
                "border-primary/35 bg-primary/14 text-foreground shadow-[0_8px_22px_-16px_oklch(0.58_0.16_42/0.75)]",
            )}
          >
            <Building2 className="size-4" />
            Tenants
          </Link>
        </nav>

        {isMobileMenuOpen ? (
          <div className="space-y-3 border-t border-border/70 py-3 sm:hidden">
            {activeTenant ? (
              <div className="rounded-xl border border-border/80 bg-card/75 px-3 py-2">
                <p className="text-sm font-semibold text-foreground">{activeTenant.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {activeMembership?.roleKey ?? "Member"}
                </p>
              </div>
            ) : null}

            <nav aria-label="Navegacion de modulos movil" className="grid grid-cols-2 gap-2">
              {moduleItems.map((item) => {
                const isActive = isPathActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-semibold uppercase tracking-[0.1em]",
                      isActive
                        ? "border-primary/35 bg-primary/14 text-foreground"
                        : "border-border/70 bg-card/70 text-muted-foreground",
                    )}
                  >
                    <item.icon className="size-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/app/tenants/select"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border/70 bg-card/70 text-xs font-semibold uppercase tracking-[0.1em] text-foreground"
            >
              <ArrowRightLeft className="size-3.5" />
              Cambiar tenant
            </Link>
          </div>
        ) : null}
      </div>

      <LogoutConfirmDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        onConfirm={() => {
          router.push("/logout");
        }}
      />
    </header>
  );
}
