"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  BellRing,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  GemIcon,
  LayoutGrid,
  Layers3,
  ScanSearch,
  Settings2,
  Package,
  ScrollText,
  Warehouse,
  Settings,
  ShieldAlert,
  Tags,
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
          { label: "Items", href: "/app/inventory/items", icon: Package },
          { label: "Categorias", href: "/app/inventory/categories", icon: Tags },
          { label: "Bodegas", href: "/app/inventory/warehouses", icon: Warehouse },
          { label: "Lotes", href: "/app/inventory/lots", icon: Layers3 },
          { label: "Conteos", href: "/app/inventory/stocktakes", icon: ClipboardCheck },
          { label: "Stock", href: "/app/inventory/stock", icon: ArrowRightLeft },
          { label: "Alertas", href: "/app/inventory/alerts", icon: BellRing },
          { label: "Reconciliacion", href: "/app/inventory/reconciliation", icon: ScanSearch },
          { label: "Settings", href: "/app/inventory/settings", icon: Settings2 },
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
        "fixed inset-y-0 left-0 z-40 -translate-x-full border-r border-sidebar-border/90 bg-sidebar/96 text-sidebar-foreground shadow-[0_24px_52px_-30px_oklch(0.2_0.02_58/0.34)] backdrop-blur-md transition-all duration-300 lg:translate-x-0",
        collapsed ? "w-[5.5rem]" : "w-72",
        isOpen && "translate-x-0",
      )}
      aria-label="Sidebar tenant"
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border/85 p-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center gap-6">
                <GemIcon className="size-6 text-sidebar-primary" />
                <div className="space-y-1">
                  <p className="text-base font-semibold tracking-tight">Modulo Saas</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/72">
                    Tenant Control
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar sidebar"
                className="inline-flex size-9 items-center justify-center rounded-full border border-sidebar-border/80 bg-sidebar-accent/82 text-sidebar-foreground transition hover:border-sidebar-primary/60 hover:bg-sidebar-accent hover:text-sidebar-primary lg:hidden"
                onClick={onClose}
              >
                <X className="size-4" />
              </button>
            </>
          ) : (
            <GemIcon className="hidden size-6 text-sidebar-primary lg:block" />
          )}
        </div>

        <nav className={cn("mt-4 flex-1 overflow-y-auto pb-6", collapsed ? "px-3" : "px-5")}>
          <div className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                {!collapsed ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/68">
                    {section.title}
                  </p>
                ) : null}

                <div className="space-y-1">
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
                      "group flex items-center rounded-xl border text-sm font-medium transition-all duration-200",
                      collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                      isActive
                        ? "border-sidebar-primary/45 bg-sidebar-primary/16 text-sidebar-foreground shadow-[0_14px_30px_-24px_oklch(0.58_0.16_42/0.62)]"
                        : "border-transparent text-sidebar-foreground/76 hover:border-sidebar-border/75 hover:bg-sidebar-accent/82 hover:text-sidebar-foreground",
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
                      <div key={item.href} className="space-y-1">
                        {!collapsed && hasChildren ? (
                          <div className="flex items-center gap-1">
                            <Link
                              href={item.href}
                              onClick={onClose}
                              aria-current={isActive ? "page" : undefined}
                              className={cn(baseClass, "min-w-0 flex-1")}
                              title={item.label}
                            >
                              <item.icon className="size-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>

                            <button
                              type="button"
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-sidebar-border/70 bg-sidebar-accent/72 text-sidebar-foreground/80 transition hover:border-sidebar-primary/50 hover:text-sidebar-foreground"
                              aria-label={
                                isExpanded ? `Colapsar ${item.label}` : `Expandir ${item.label}`
                              }
                              onClick={() =>
                                setExpandedItems((current) => ({
                                  ...current,
                                  [item.href]: !isExpanded,
                                }))
                              }
                            >
                              <ChevronDown
                                className={cn(
                                  "size-4 transition-transform duration-200",
                                  isExpanded && "rotate-180",
                                )}
                              />
                            </button>
                          </div>
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
                          <div className="ml-3 space-y-1 border-l border-sidebar-border/70 pl-3">
                            {item.children?.map((child) => {
                              const childActive = isChildActive(pathname, child.href);

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                                    childActive
                                      ? "border-sidebar-primary/45 bg-sidebar-accent/88 text-sidebar-primary"
                                      : "border-transparent text-sidebar-foreground/72 hover:border-sidebar-border/70 hover:bg-sidebar-accent/78 hover:text-sidebar-foreground",
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
