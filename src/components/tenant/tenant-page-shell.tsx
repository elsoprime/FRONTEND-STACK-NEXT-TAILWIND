import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, House, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TenantPageActionVariant =
  | "default"
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "toolbar"
  | "destructive";

export type TenantPageAction = {
  label: string;
  href: string;
  variant?: TenantPageActionVariant;
};

export type TenantPageBreadcrumbItem = {
  label: string;
  href?: string;
};

type TenantPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: readonly TenantPageAction[];
  className?: string;
  contentClassName?: string;
  breadcrumbItems?: readonly TenantPageBreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
};

export function TenantPageShell({
  eyebrow,
  title,
  description,
  children,
  actions,
  className,
  contentClassName,
  breadcrumbItems,
  backHref,
  backLabel,
}: TenantPageShellProps) {
  const hasContextHeader = Boolean(
    (breadcrumbItems && breadcrumbItems.length > 0) || (backHref && backLabel),
  );

  return (
    <main className={cn("min-h-[calc(100dvh-4.5rem)] px-4 py-7 sm:px-6 xl:px-2", className)}>
      <section className="mx-auto w-full max-w-[1320px] space-y-6">
        <article className="surface-card relative overflow-hidden p-7 sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/20 via-accent/15 to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative space-y-3">
            <p className="label-kicker text-primary/90">{eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm sm:text-base dashboard-text-muted">{description}</p>
          </div>
        </article>

        <article
          className={cn("surface-card border-border/90 bg-card/95 p-6 sm:p-7", contentClassName)}
        >
          {hasContextHeader ? (
            <div className="mb-7 flex flex-col gap-3 rounded-xl border border-border/80 bg-background/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              {breadcrumbItems && breadcrumbItems.length > 0 ? (
                <nav
                  className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
                  aria-label="Ruta activa"
                >
                  <House className="size-4 text-primary" />
                  {breadcrumbItems.map((item, index) => {
                    const isLast = index === breadcrumbItems.length - 1;

                    return (
                      <div key={`${item.label}:${index}`} className="flex items-center gap-2">
                        <ChevronRight className="size-3.5 text-muted-foreground/70" />
                        {item.href && !isLast ? (
                          <Link
                            href={item.href}
                            className="transition-colors hover:text-foreground"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <span className={cn(isLast && "font-semibold text-foreground")}>
                            {item.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </nav>
              ) : (
                <div />
              )}

              {backHref && backLabel ? (
                <Link href={backHref}>
                  <Button variant="toolbar" className="w-full sm:w-auto">
                    <Undo2 className="size-4" />
                    {backLabel}
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : null}

          {children}

          {actions && actions.length > 0 ? (
            <div className="mt-9 flex flex-wrap gap-2.5">
              {actions.map((action) => (
                <Link key={`${action.href}:${action.label}`} href={action.href}>
                  <Button variant={action.variant ?? "secondary"}>{action.label}</Button>
                </Link>
              ))}
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
