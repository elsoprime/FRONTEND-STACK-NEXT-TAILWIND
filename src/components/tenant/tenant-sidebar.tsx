"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CreditCard,
  GemIcon,
  LayoutGrid,
  ScanSearch,
  Settings2,
  ScrollText,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { resolveTenantModuleState } from "@/features/tenant/tenant-runtime-guards";
import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";
import { cn } from "@/lib/utils";
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
  | "/app/inventory/alerts"
  | "/app/inventory/reconciliation"
  | "/app/inventory/settings"
  | "/app/crm"
  | "/app/hr"
  | "/app/audit"
  | "/app/settings/billing"
  | "/app/settings/profile"
  | "/app/settings/security"
  | "/app/settings/tenant"
  | "/app/members/invitations"
  | "/app/tenant/ownership";

type ModuleKey = "inventory" | "crm" | "hr" | "audit";

type NavChildItem = {
  label: string;
  href: AppRoute;
  icon: ComponentType<{ className?: string }>;
};

type NavItem = {
  label: string;
  href: AppRoute;
  icon: ComponentType<{ className?: string }>;
  match: "exact" | "prefix";
  moduleKey?: ModuleKey;
  permissionKey?: string;
  children?: readonly NavChildItem[];
};

type NavSection = {
  title: string;
  items: readonly NavItem[];
};

const navSections: readonly NavSection[] = [
  {
    title: "Auth",
    items: [
      { label: "Perfil", href: "/app/settings/profile", icon: UserRound, match: "prefix" },
      { label: "Seguridad", href: "/app/settings/security", icon: ShieldAlert, match: "prefix" },
    ],
  },
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
        children: [
          { label: "Panel principal", href: "/app/inventory", icon: LayoutGrid },
          { label: "Alertas", href: "/app/inventory/alerts", icon: BellRing },
          { label: "Reconciliacion", href: "/app/inventory/reconciliation", icon: ScanSearch },
          { label: "Configuracion", href: "/app/inventory/settings", icon: Settings2 },
        ],
      },
      {
        label: "CRM",
        href: "/app/crm",
        icon: BriefcaseBusiness,
        match: "prefix",
        moduleKey: "crm",
        permissionKey: TENANT_PERMISSION_KEYS.MODULE_CRM_USE,
      },
      {
        label: "HR",
        href: "/app/hr",
        icon: Users,
        match: "prefix",
        moduleKey: "hr",
        permissionKey: TENANT_PERMISSION_KEYS.MODULE_HR_USE,
      },
      {
        label: "Audit",
        href: "/app/audit",
        icon: ScrollText,
        match: "prefix",
        moduleKey: "audit",
        permissionKey: TENANT_PERMISSION_KEYS.AUDIT_READ,
      },
    ],
  },
  {
    title: "Administracion",
    items: [
      {
        label: "Invitaciones",
        href: "/app/members/invitations",
        icon: Users,
        match: "prefix",
        permissionKey: TENANT_PERMISSION_KEYS.INVITATIONS_CREATE,
      },
      {
        label: "Ownership",
        href: "/app/tenant/ownership",
        icon: ShieldAlert,
        match: "prefix",
        permissionKey: TENANT_PERMISSION_KEYS.OWNERSHIP_TRANSFER,
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

function isChildActive(pathname: string, href: string): boolean {
  if (href === "/app/inventory") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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

export function TenantSidebar({ isOpen, collapsed, onClose }: TenantSidebarProps) {
  const pathname = usePathname();
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const effectiveRuntime = useTenantStore((state) => state.effectiveRuntime);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

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
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                {!collapsed ? (
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/56">
                    {section.title}
                  </p>
                ) : null}

                <div className="space-y-1.5">
                  {section.items.map((item) => {
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

                    const hasChildren = Boolean(item.children && item.children.length > 0);
                    const childRouteActive = hasChildren
                      ? Boolean(item.children?.some((child) => isChildActive(pathname, child.href)))
                      : false;
                    const isExpanded = hasChildren
                      ? (expandedItems[item.href] ?? childRouteActive)
                      : false;

                    const baseClass = cn(
                      "group flex items-center border text-sm font-medium transition-all duration-200",
                      collapsed
                        ? "justify-center rounded-2xl px-2 py-3"
                        : "gap-3 rounded-2xl px-3 py-3",
                      isActive || childRouteActive
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
                      <div key={item.href} className="space-y-1.5">
                        {!collapsed && hasChildren ? (
                          <Link
                            href={item.href}
                            onClick={(event) => {
                              if (isActive || childRouteActive) {
                                event.preventDefault();
                                setExpandedItems((current) => ({
                                  ...current,
                                  [item.href]: !isExpanded,
                                }));
                                return;
                              }

                              setExpandedItems((current) => ({
                                ...current,
                                [item.href]: true,
                              }));
                              onClose();
                            }}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(baseClass, "justify-between")}
                            title={item.label}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <item.icon className="size-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </span>
                            <ChevronDown
                              className={cn(
                                "size-4 shrink-0 transition-transform duration-200",
                                isExpanded && "rotate-180",
                              )}
                            />
                          </Link>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={onClose}
                            aria-current={isActive ? "page" : undefined}
                            className={baseClass}
                            title={item.label}
                          >
                            <item.icon className="size-4" />
                            {!collapsed ? <span>{item.label}</span> : null}
                          </Link>
                        )}

                        {!collapsed && hasChildren && isExpanded ? (
                          <div className="ml-4 space-y-1.5 border-l border-sidebar-border/62 pl-3.5">
                            {item.children?.map((child) => {
                              const childActive = isChildActive(pathname, child.href);

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                                    childActive
                                      ? "border-sidebar-primary/24 bg-sidebar-primary/10 text-sidebar-primary"
                                      : "border-transparent text-sidebar-foreground/68 hover:border-sidebar-border/62 hover:bg-white/58 hover:text-sidebar-foreground dark:hover:bg-sidebar-accent/44",
                                  )}
                                >
                                  <child.icon className="size-4" />
                                  <span>{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
}

