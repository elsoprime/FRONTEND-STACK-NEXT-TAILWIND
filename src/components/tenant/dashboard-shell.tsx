"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/tenant/dashboard-header";
import { TenantSidebar } from "@/components/tenant/tenant-sidebar";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("tenant.sidebar.collapsed") === "1";
  });

  const handleToggleSidebarCollapse = () => {
    setSidebarCollapsed((current) => {
      const nextValue = !current;
      window.localStorage.setItem("tenant.sidebar.collapsed", nextValue ? "1" : "0");
      return nextValue;
    });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <TenantSidebar
        isOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={cn(
          "relative transition-[padding] duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_82%_0%,oklch(0.66_0.08_214/0.1),transparent_42%),radial-gradient(circle_at_12%_0%,oklch(0.68_0.08_42/0.08),transparent_34%)]",
          sidebarCollapsed ? "lg:pl-24" : "lg:pl-72",
        )}
      >
        <DashboardHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={handleToggleSidebarCollapse}
        />
        <main className="relative min-h-[calc(100dvh-4.5rem)]">{children}</main>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-30 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.24),rgba(15,23,42,0.62))] opacity-0 transition-opacity lg:hidden",
          sidebarOpen && "pointer-events-auto opacity-100",
          !sidebarOpen && "pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
}
