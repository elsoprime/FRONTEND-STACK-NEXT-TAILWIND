import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccessDeniedPanelProps = {
  title?: string;
  message: string;
  code?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function AccessDeniedPanel({
  title = "Acceso restringido",
  message,
  code,
  actionLabel,
  actionHref,
  className,
}: AccessDeniedPanelProps) {
  return (
    <article
      className={cn(
        "rounded-xl border border-red-300/80 bg-red-100/70 p-4 text-red-900 dark:border-destructive/45 dark:bg-destructive/14 dark:text-red-200",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-4" />
        <div className="space-y-2">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm">{message}</p>
          {code ? <p className="text-xs opacity-75">Codigo: {code}</p> : null}
          {actionHref && actionLabel ? (
            <a
              href={actionHref}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "rounded-lg border-current/35",
              )}
            >
              {actionLabel}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

