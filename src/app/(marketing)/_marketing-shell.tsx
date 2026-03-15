import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
};

export function MarketingShell({ children, className, mainClassName }: MarketingShellProps) {
  return (
    <div className={cn("min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100", className)}>
      <main className={cn("mx-auto w-full max-w-7xl px-6 py-24 lg:px-8", mainClassName)}>{children}</main>
    </div>
  );
}
