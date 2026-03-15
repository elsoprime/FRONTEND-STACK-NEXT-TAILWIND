"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { LogoutConfirmDialog } from "@/components/auth/logout-confirm-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";
import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  onOpenSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
};

type SearchItem = {
  label: string;
  href: string;
  group: string;
  keywords?: string[];
};

const SEARCH_INDEX: SearchItem[] = [
  {
    label: "Dashboard principal",
    href: "/app",
    group: "General",
    keywords: ["inicio", "home", "control"],
  },
  {
    label: "Seleccionar tenant",
    href: "/app/tenants/select",
    group: "Tenant",
    keywords: ["switch", "cambiar", "contexto"],
  },
  {
    label: "Crear tenant",
    href: "/app/tenants/create",
    group: "Tenant",
    keywords: ["nuevo", "onboarding", "tenant"],
  },
  {
    label: "Plan y suscripcion",
    href: "/app/settings/billing",
    group: "Billing",
    keywords: ["pago", "invoice", "upgrade", "suscripcion"],
  },
  {
    label: "Configuracion de tenant",
    href: "/app/settings/tenant",
    group: "Tenant",
    keywords: ["branding", "ajustes", "nombre", "slug"],
  },
  {
    label: "Mi Perfil",
    href: "/app/settings/profile",
    group: "Usuario",
    keywords: ["cuenta", "datos"],
  },
  {
    label: "Seguridad y 2FA",
    href: "/app/settings/security",
    group: "Usuario",
    keywords: ["password", "autenticacion", "dos factores"],
  },
  {
    label: "Modulo Inventory",
    href: "/app/inventory",
    group: "Modulos",
    keywords: ["stock", "productos", "almacen"],
  },
  {
    label: "Modulo CRM",
    href: "/app/crm",
    group: "Modulos",
    keywords: ["ventas", "clientes", "pipeline"],
  },
  {
    label: "Modulo HR",
    href: "/app/hr",
    group: "Modulos",
    keywords: ["empleados", "nomina", "talento"],
  },
  {
    label: "Auditoria de eventos",
    href: "/app/audit",
    group: "Seguridad",
    keywords: ["logs", "trazabilidad"],
  },
  {
    label: "Invitaciones de miembros",
    href: "/app/members/invitations",
    group: "Tenant",
    keywords: ["invitar", "usuarios", "equipo"],
  },
  {
    label: "Propiedad del tenant",
    href: "/app/tenant/ownership",
    group: "Seguridad",
    keywords: ["owner", "transferir", "titular"],
  },
];

function resolveInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.trim();
  return initials.length > 0 ? initials.toUpperCase() : "U";
}

export function DashboardHeader({
  onOpenSidebar,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
}: DashboardHeaderProps) {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchIndex, setSearchIndex] = useState(-1);

  const headerRef = useRef<HTMLElement | null>(null);

  const initials = useMemo(
    () => resolveInitials(user?.firstName ?? null, user?.lastName ?? null),
    [user?.firstName, user?.lastName],
  );

  const filteredResults = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) {
      return [] as SearchItem[];
    }

    return SEARCH_INDEX.filter((item) => {
      const haystack = [item.label, item.group, ...(item.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(term);
    }).slice(0, 7);
  }, [searchValue]);

  const activeSearchIndex =
    searchIndex >= 0 && searchIndex < filteredResults.length
      ? searchIndex
      : filteredResults.length > 0
        ? 0
        : -1;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!headerRef.current) {
        return;
      }
      if (!headerRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
        setTenantMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleNavigate = (href: string) => {
    setSearchValue("");
    setSearchIndex(-1);
    setUserMenuOpen(false);
    setTenantMenuOpen(false);
    router.push(href);
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-border/70 bg-card/78 backdrop-blur-2xl"
    >
      <div className="mx-auto  px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 lg:gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border/70 bg-card/80 lg:hidden"
              onClick={() => onOpenSidebar?.()}
            >
              <Menu className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="hidden rounded-full border-border/70 bg-card/80 lg:inline-flex"
              onClick={() => onToggleSidebarCollapse?.()}
              aria-label={isSidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </Button>

            <div className="flex flex-wrap items-center gap-2 ">
              <Badge
                variant="outline"
                className="border-primary/35 bg-primary/12 font-bold text-primary"
              >
                Contexto Activo
              </Badge>
              <div className="flex items-center gap-2 rounded-full border border-border/75 bg-background/72 px-3 py-1.5">
                <Building2 className="size-3.5 text-primary" />
                <h2 className="text-xs font-bold text-foreground">
                  {activeTenant?.name ?? "Sin tenant"}
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {activeMembership?.roleKey ?? "Sin rol"}
                </span>
              </div>
            </div>

            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setSearchIndex(0);
                }}
                placeholder="Buscar modulos, recursos..."
                className="h-10 rounded-xl border-border/75 bg-background/75 pl-10 pr-4 text-sm shadow-sm transition-all focus:ring-primary/20"
                role="combobox"
                aria-expanded={filteredResults.length > 0}
                aria-controls="dashboard-search-results"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchValue("");
                    setSearchIndex(-1);
                    return;
                  }

                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSearchIndex((current) => {
                      if (filteredResults.length === 0) {
                        return -1;
                      }
                      return current >= filteredResults.length - 1 ? 0 : current + 1;
                    });
                    return;
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSearchIndex((current) => {
                      if (filteredResults.length === 0) {
                        return -1;
                      }
                      return current <= 0 ? filteredResults.length - 1 : current - 1;
                    });
                    return;
                  }

                  if (event.key === "Enter") {
                    const target =
                      activeSearchIndex >= 0
                        ? filteredResults[activeSearchIndex]
                        : filteredResults[0];
                    if (target) {
                      event.preventDefault();
                      handleNavigate(target.href);
                    }
                  }
                }}
              />

              {filteredResults.length > 0 ? (
                <div
                  id="dashboard-search-results"
                  role="listbox"
                  className="absolute left-0 right-0 top-12 z-50 rounded-2xl border border-border/75 bg-card/95 p-2 shadow-2xl"
                >
                  {filteredResults.map((item, index) => (
                    <button
                      key={item.href}
                      type="button"
                      role="option"
                      aria-selected={activeSearchIndex === index}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium",
                        activeSearchIndex === index ? "bg-muted" : "hover:bg-muted/70",
                      )}
                      onMouseDown={() => handleNavigate(item.href)}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {item.group}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full border-border/75 bg-card/80"
              aria-label="Notificaciones"
            >
              <Bell className="size-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-primary" />
            </Button>

            <ThemeToggle />

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "hidden gap-2 rounded-xl border-border/75 bg-card/80 px-3 sm:flex",
                  tenantMenuOpen && "border-primary/40 bg-muted/70",
                )}
                onClick={() => {
                  setTenantMenuOpen(!tenantMenuOpen);
                  setUserMenuOpen(false);
                }}
                aria-expanded={tenantMenuOpen}
                aria-haspopup="menu"
              >
                <Building2 className="size-4 text-primary" />
                <span className="text-xs font-semibold">Tenant Settings</span>
                <ChevronDown
                  className={cn("size-3.5 transition-transform", tenantMenuOpen && "rotate-180")}
                />
              </Button>

              {tenantMenuOpen ? (
                <div
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-border/75 bg-card/95 p-2 shadow-2xl"
                  role="menu"
                >
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Gestion de Tenant
                  </p>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
                    onMouseDown={() => handleNavigate("/app/settings/tenant")}
                  >
                    <Settings className="size-4 text-primary" />
                    Configuracion General
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
                    onMouseDown={() => handleNavigate("/app/settings/billing")}
                  >
                    <CreditCard className="size-4 text-primary" />
                    Plan y Billing
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
                    onMouseDown={() => handleNavigate("/app/members/invitations")}
                  >
                    <UserPlus className="size-4 text-primary" />
                    Miembros y Equipo
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
                    onMouseDown={() => handleNavigate("/app/tenants/create")}
                  >
                    <Building2 className="size-4 text-primary" />
                    Crear Tenant
                  </button>
                  <div className="my-1 h-px bg-border/50" />
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
                    onMouseDown={() => handleNavigate("/app/tenants/select")}
                  >
                    <Building2 className="size-4 text-muted-foreground" />
                    Cambiar Tenant
                  </button>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border border-border/75 bg-primary/10 transition-all hover:ring-4 hover:ring-primary/10",
                  userMenuOpen && "ring-4 ring-primary/20",
                )}
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setTenantMenuOpen(false);
                }}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="Menu de usuario"
              >
                <span className="text-sm font-bold text-primary">{initials}</span>
              </button>

              {userMenuOpen ? (
                <div
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-border/75 bg-card/95 p-2 shadow-2xl"
                  role="menu"
                >
                  <div className="mb-1 border-b border-border/50 px-3 py-2">
                    <p className="truncate text-sm font-bold text-foreground">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
                  </div>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
                    onMouseDown={() => handleNavigate("/app/settings/profile")}
                  >
                    <UserRound className="size-4" />
                    Mi Perfil
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
                    onMouseDown={() => handleNavigate("/app/settings/security")}
                  >
                    <ShieldCheck className="size-4" />
                    Seguridad y 2FA
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
                    onMouseDown={() => handleNavigate("/app/settings/tenant")}
                  >
                    <LifeBuoy className="size-4" />
                    Soporte Tecnico
                  </button>
                  <div className="my-1 h-px bg-border/50" />
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                    onClick={() => setLogoutOpen(true)}
                  >
                    <LogOut className="size-4" />
                    Cerrar Sesion
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={(open) => {
          setLogoutOpen(open);
          if (!open) {
            setUserMenuOpen(false);
          }
        }}
        onConfirm={() => {
          setUserMenuOpen(false);
          router.push("/logout");
        }}
      />
    </header>
  );
}

