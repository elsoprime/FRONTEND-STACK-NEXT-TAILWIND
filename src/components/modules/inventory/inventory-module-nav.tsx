"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BellRing, ScanSearch, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type InventoryModuleTab = "alerts" | "reconciliation" | "settings";

const INVENTORY_NAV_ITEMS: ReadonlyArray<{
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tab: InventoryModuleTab;
}> = [
  { label: "Alertas", href: "/app/inventory?tab=alerts", icon: BellRing, tab: "alerts" },
  {
    label: "Reconciliacion",
    href: "/app/inventory?tab=reconciliation",
    icon: ScanSearch,
    tab: "reconciliation",
  },
  {
    label: "Configuracion",
    href: "/app/inventory?tab=settings",
    icon: Settings2,
    tab: "settings",
  },
] as const;

function isActive(pathname: string, activeTab: string | null, tab: InventoryModuleTab): boolean {
  return pathname === "/app/inventory" && activeTab === tab;
}

export function InventoryModuleNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  return (
    <nav className="flex flex-wrap gap-2.5" aria-label="Navegacion modulo inventory">
      {INVENTORY_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, activeTab, item.tab);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "dashboard-nav-pill",
              active && "border-primary/45 bg-primary/14 text-primary",
            )}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
