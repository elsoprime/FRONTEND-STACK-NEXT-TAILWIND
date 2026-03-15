import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TenantPageActionVariant = "default" | "outline";

export type TenantPageAction = {
  label: string;
  href: string;
  variant?: TenantPageActionVariant;
};

type TenantPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: readonly TenantPageAction[];
  className?: string;
  contentClassName?: string;
};

export function TenantPageShell({
  eyebrow,
  title,
  description,
  children,
  actions,
  className,
  contentClassName,
}: TenantPageShellProps) {
  return (
    <main className={cn("min-h-[calc(100dvh-4.5rem)] px-4 py-6 sm:px-6 lg:px-8", className)}>
      <section className="mx-auto w-full max-w-[1320px] space-y-5">
        <article className="surface-card relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/24 via-accent/18 to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative space-y-2">
            <p className="label-kicker text-primary/90">{eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>
          </div>
        </article>

        <article className={cn("surface-card border-border/85 bg-card/90 p-5 sm:p-6", contentClassName)}>
          {children}

          {actions && actions.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {actions.map((action) => (
                <Link key={`${action.href}:${action.label}`} href={action.href}>
                  <Button size="sm" variant={action.variant ?? "outline"} className="rounded-lg">
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
