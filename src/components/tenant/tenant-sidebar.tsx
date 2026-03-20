"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  GemIcon,
  LayoutGrid,
  ScrollText,
  Settings,
  Users,
  X,
} from "lucide-react";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { resolveTenantModuleState } from "@/features/tenant/tenant-runtime-guards";
import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import { useTenantStore } from "@/store/tenant-store";

type AppRoute =
  | "/app"
  | "/app/tenants/select"
  | "/app/inventory"
  | "/app/inventory/items"
  | "/app/inventory/categories"
  | "/app/inventory/warehouses"
  | "/app/inventory/lots"
  | "/app/inventory/stocktakes"
  | "/app/inventory/stock"
  | "/app/crm"
  | "/app/hr"
  | "/app/audit"
  | "/app/settings/billing"
  | "/app/settings/profile"
  | "/app/settings/security"
  | "/app/settings/tenant"
  | "/app/members";

type ModuleKey = "inventory" | "crm" | "hr" | "audit";

type NavItem = {
  label: string;
  href: AppRoute;
  icon: ComponentType<{ className?: string }>;
  match: "exact" | "prefix";
  moduleKey?: ModuleKey;
  permissionKey?: string;
  tenantRequired?: boolean;
};

type NavSection = {
  title: string;
  items: readonly NavItem[];
};

const navSections: readonly NavSection[] = [
  {
    title: "Tenant",
    items: [
      { label: "Dashboard", href: "/app", icon: LayoutGrid, match: "exact" },
      { label: "Switch tenant", href: "/app/tenants/select", icon: Building2, match: "prefix" },
      {
        label: "Ajustes tenant",
        href: "/app/settings/tenant",
        icon: Settings,
        match: "prefix",
        permissionKey: TENANT_PERMISSION_KEYS.SETTINGS_READ,
        tenantRequired: true,
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        label: "Plan y suscripcion",
        href: "/app/settings/billing",
        icon: CreditCard,
        match: "prefix",
        permissionKey: TENANT_PERMISSION_KEYS.SETTINGS_UPDATE,
        tenantRequired: true,
      },
    ],
  },
  {
    title: "Modulos",
    items: [
      {
        label: "Inventario",
        href: "/app/inventory",
        icon: Boxes,
        match: "prefix",
        moduleKey: "inventory",
        permissionKey: TENANT_PERMISSION_KEYS.MODULE_INVENTORY_USE,
        tenantRequired: true,
      },
      {
        label: "CRM",
        href: "/app/crm",
        icon: BriefcaseBusiness,
        match: "prefix",
        moduleKey: "crm",
        permissionKey: TENANT_PERMISSION_KEYS.MODULE_CRM_USE,
        tenantRequired: true,
      },
      {
        label: "HR",
        href: "/app/hr",
        icon: Users,
        match: "prefix",
        moduleKey: "hr",
        permissionKey: TENANT_PERMISSION_KEYS.MODULE_HR_USE,
        tenantRequired: true,
      },
      {
        label: "Audit",
        href: "/app/audit",
        icon: ScrollText,
        match: "prefix",
        moduleKey: "audit",
        permissionKey: TENANT_PERMISSION_KEYS.AUDIT_READ,
        tenantRequired: true,
      },
    ],
  },
  {
    title: "Administracion",
    items: [
      {
        label: "Miembros",
        href: "/app/members",
        icon: Users,
        match: "prefix",
        permissionKey: TENANT_PERMISSION_KEYS.MEMBERSHIPS_READ,
        tenantRequired: true,
      },
    ],
  },
];

type TenantSidebarProps = {
  isOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
};

function isItemActive(
  pathname: string,
  item: { href: string; match: "exact" | "prefix" },
): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function resolveModuleState(
  moduleKey: ModuleKey,
  runtime: TenantRuntime | null,
  tenantActiveModuleKeys: string[],
  tenantPlanId: string | null,
): "active" | "enabled" | "disabled" {
  if (moduleKey === "audit") {
    return tenantPlanId ? "active" : "disabled";
  }

  if (runtime) {
    return resolveTenantModuleState(runtime, moduleKey);
  }

  return tenantActiveModuleKeys.includes(moduleKey) ? "active" : "disabled";
}

function resolveInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.trim();
  return initials.length > 0 ? initials.toUpperCase() : "U";
}

function resolveUserStatusLabel(status?: string | null, isEmailVerified?: boolean): string {
  if (status === "pending_verification" || !isEmailVerified) {
    return "Verificacion pendiente";
  }

  return "Sesion activa";
}

export function TenantSidebar({ isOpen, collapsed, onClose }: TenantSidebarProps) {
  const pathname = usePathname();
  const user = useSessionStore((state) => state.user);
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const effectiveRuntime = useTenantStore((state) => state.effectiveRuntime);

  const hasTenantContext = Boolean(activeTenant && activeMembership);
  const initials = resolveInitials(user?.firstName ?? null, user?.lastName ?? null);
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const userStatusLabel = resolveUserStatusLabel(user?.status, user?.isEmailVerified);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 -translate-x-full border-r border-sidebar-border/80 bg-[linear-gradient(180deg,rgba(253,251,248,0.96)_0%,rgba(244,238,231,0.98)_100%)] text-sidebar-foreground shadow-[0_24px_52px_-30px_oklch(0.2_0.02_58/0.34)] backdrop-blur-xl transition-all duration-300 dark:bg-[linear-gradient(180deg,rgba(36,33,31,0.98)_0%,rgba(28,26,24,0.98)_100%)] lg:translate-x-0",
        collapsed ? "w-[5.5rem]" : "w-72",
        isOpen && "translate-x-0",
      )}
      aria-label="Sidebar tenant"
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "border-b border-sidebar-border/72 p-4",
            collapsed ? "flex justify-center" : "space-y-4",
          )}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-sidebar-primary/24 bg-sidebar-primary/10 text-sidebar-primary shadow-inner">
                    <GemIcon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold tracking-tight">Modulo SaaS</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/58">
                      Tenant Control
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar sidebar"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-sidebar-border/70 bg-white/70 text-sidebar-foreground transition hover:border-sidebar-primary/40 hover:text-sidebar-primary dark:bg-sidebar-accent/60 lg:hidden"
                  onClick={onClose}
                >
                  <X className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex size-11 items-center justify-center rounded-2xl border border-sidebar-primary/24 bg-sidebar-primary/10 text-sidebar-primary shadow-inner">
              <GemIcon className="size-5" />
            </div>
          )}
        </div>

        <nav className={cn("mt-4 flex-1 overflow-y-auto pb-6", collapsed ? "px-3" : "px-4")}>
          <div className="space-y-6">
            {navSections.map((section) => {
              const visibleItems = section.items.filter(
                (item) => hasTenantContext || !item.tenantRequired,
              );

              if (visibleItems.length === 0) {
                return null;
              }

              return (
                <div key={section.title} className="space-y-2">
                  {!collapsed ? (
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/56">
                      {section.title}
                    </p>
                  ) : null}

                  <div className="space-y-1.5">
                    {visibleItems.map((item) => {
                      const isActive = isItemActive(pathname, item);
                      const moduleState =
                        item.moduleKey && activeTenant
                          ? resolveModuleState(
                              item.moduleKey,
                              effectiveRuntime,
                              activeTenant.activeModuleKeys,
                              effectiveRuntime?.planId ?? activeTenant.planId,
                            )
                          : "active";

                      const hasPermission = item.permissionKey
                        ? hasTenantPermission(
                            activeMembership?.roleKey ?? "tenant:member",
                            item.permissionKey,
                          )
                        : true;

                      const isDisabled =
                        (item.moduleKey && moduleState !== "active") ||
                        (item.permissionKey && !hasPermission);

                      const baseClass = cn(
                        "group flex items-center border text-sm font-medium transition-all duration-200",
                        collapsed
                          ? "justify-center rounded-2xl px-2 py-3"
                          : "gap-3 rounded-2xl px-3 py-3",
                        isActive
                          ? "border-sidebar-primary/22 bg-white/10 dark:bg-gray-800/90 text-sidebar-foreground shadow-[0_16px_32px_-26px_oklch(0.58_0.16_42/0.42)]"
                          : "border-transparent text-sidebar-foreground/72 hover:border-sidebar-border/65 hover:bg-white/58 hover:text-sidebar-foreground dark:hover:bg-sidebar-accent/48",
                        isDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                      );

                      if (isDisabled) {
                        return (
                          <div key={item.href} className="space-y-1" title={item.label}>
                            <div aria-disabled="true" className={baseClass}>
                              <item.icon className="size-4" />
                              {!collapsed ? <span>{item.label}</span> : null}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          aria-current={isActive ? "page" : undefined}
                          className={baseClass}
                          title={item.label}
                        >
                          <item.icon className="size-4" />
                          {!collapsed ? <span>{item.label}</span> : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <div className={cn("mt-auto", collapsed ? "p-3" : "px-4 pb-4 pt-3")}>
          {collapsed ? (
            <div
              className="flex size-12 items-center justify-center rounded-2xl bg-sidebar-primary/10 text-sidebar-primary"
              title={fullName || user?.email || "Usuario autenticado"}
            >
              <span className="text-sm font-bold">{initials}</span>
            </div>
          ) : (
            <div className="px-1 py-2">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary/10 text-sidebar-primary">
                  <span className="text-sm font-bold">{initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-sidebar-foreground">
                    {fullName || "Usuario autenticado"}
                  </p>
                  <p className="truncate text-xs text-sidebar-foreground/58">
                    {user?.email ?? "Sin email"}
                  </p>
                </div>
              </div>

              <div className="mt-3 p-2 flex flex-col items-center gap-3 bg-white/10 rounded-2xl">
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/52">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {userStatusLabel}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/44">
                  {hasTenantContext ? activeMembership?.roleKey : "Sin tenant"}
                </span>
              </div>

              <p className="mt-3 text-xs text-sidebar-foreground/52 text-center">
                {hasTenantContext
                  ? `Tenant activo: ${activeTenant?.name}`
                  : "Selecciona un tenant para habilitar modulos y funciones operativas."}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
