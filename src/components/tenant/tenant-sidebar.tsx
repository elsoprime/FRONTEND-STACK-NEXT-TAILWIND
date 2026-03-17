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
  ShieldAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantStore } from "@/store/tenant-store";
import { resolveTenantModuleState } from "@/features/tenant/tenant-runtime-guards";
import { hasTenantPermission, TENANT_PERMISSION_KEYS } from "@/features/tenant/tenant-permissions";
import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";

type AppRoute =
  | "/app"
  | "/app/tenants/select"
  | "/app/inventory"
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

type NavItem = {
  label: string;
  href: AppRoute;
  icon: ComponentType<{ className?: string }>;
  match: "exact" | "prefix";
  moduleKey?: ModuleKey;
  permissionKey?: string;
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
    title: "Inventory",
    items: [
      {
        label: "Inventory",
        href: "/app/inventory",
        icon: Boxes,
        match: "prefix",
        moduleKey: "inventory",
        permissionKey: TENANT_PERMISSION_KEYS.MODULE_INVENTORY_USE,
      },
    ],
  },
  {
    title: "CRM",
    items: [
      {
        label: "CRM",
        href: "/app/crm",
        icon: BriefcaseBusiness,
        match: "prefix",
        moduleKey: "crm",
        permissionKey: TENANT_PERMISSION_KEYS.MODULE_CRM_USE,
      },
    ],
  },
  {
    title: "HR",
    items: [
      {
        label: "HR",
        href: "/app/hr",
        icon: Users,
        match: "prefix",
        moduleKey: "hr",
        permissionKey: TENANT_PERMISSION_KEYS.MODULE_HR_USE,
      },
    ],
  },
  {
    title: "Audit",
    items: [
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

function isItemActive(pathname: string, item: NavItem): boolean {
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

export function TenantSidebar({ isOpen, collapsed, onClose }: TenantSidebarProps) {
  const pathname = usePathname();
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);
  const effectiveRuntime = useTenantStore((state) => state.effectiveRuntime);

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
                        <div
                          key={item.href}
                          aria-disabled="true"
                          className={baseClass}
                          title={item.label}
                        >
                          <item.icon className="size-4" />
                          {!collapsed ? <span>{item.label}</span> : null}
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
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
}
