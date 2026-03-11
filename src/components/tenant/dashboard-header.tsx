"use client";

import Link from "next/link";
import { Cloud, Building2, User, LogOut, Settings, Boxes, BriefcaseBusiness, Users } from "lucide-react";
import { useTenantStore } from "@/store/tenant-store";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const activeMembership = useTenantStore((state) => state.activeMembership);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/app" className="flex items-center gap-2 transition hover:opacity-80">
            <div className="flex size-8 items-center justify-center rounded bg-blue-700 text-white shadow-sm">
              <Cloud className="size-5" />
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:inline-block">
              ERP Solutions Media
            </span>
          </Link>

          {activeTenant && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-8 dark:border-slate-800">
              <div className="flex size-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                <Building2 className="size-4" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{activeTenant.name}</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  {activeMembership?.roleKey ?? "Member"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/app/modules/inventory">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                <Boxes className="mr-2 size-4" />
                Inventory
              </Button>
            </Link>
            <Link href="/app/modules/crm">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                <BriefcaseBusiness className="mr-2 size-4" />
                CRM
              </Button>
            </Link>
            <Link href="/app/modules/hr">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                <Users className="mr-2 size-4" />
                HR
              </Button>
            </Link>
            <Link href="/app/settings/tenant">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                <Settings className="mr-2 size-4" />
                Ajustes
              </Button>
            </Link>
            <Link href="/app/tenants/select">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                <Building2 className="mr-2 size-4" />
                Tenants
              </Button>
            </Link>
          </nav>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          <Link href="/app/settings/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="size-5 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>

          <Link href="/logout">
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
            >
              <LogOut className="size-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
