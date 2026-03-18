"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, LayoutGrid, ScanSearch, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const INVENTORY_NAV_ITEMS = [
  { label: "Panel principal", href: "/app/inventory", icon: LayoutGrid },
  { label: "Alertas", href: "/app/inventory/alerts", icon: BellRing },
  { label: "Reconciliacion", href: "/app/inventory/reconciliation", icon: ScanSearch },
  { label: "Configuracion", href: "/app/inventory/settings", icon: Settings2 },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/app/inventory") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InventoryModuleNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Navegacion modulo inventory">
      {INVENTORY_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);

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
