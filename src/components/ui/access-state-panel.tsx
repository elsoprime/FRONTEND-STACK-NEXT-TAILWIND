import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccessStateAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "outline" | "destructive";
};

type AccessStatePanelProps = {
  title?: string;
  description: string;
  code?: string;
  primaryAction?: AccessStateAction;
  secondaryAction?: AccessStateAction;
  className?: string;
};

export function AccessStatePanel({
  title = "Acceso restringido",
  description,
  code,
  primaryAction,
  secondaryAction,
  className,
}: AccessStatePanelProps) {
  return (
    <article
      className={cn(
        "surface-card rounded-[1.5rem] border border-destructive/35 bg-destructive/10 p-5 text-red-100",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10 text-red-200">
          <ShieldAlert className="size-4" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="max-w-2xl text-sm text-red-100/85">{description}</p>
          {code ? <p className="text-xs text-red-100/70">Codigo: {code}</p> : null}
        </div>
      </div>

      {primaryAction || secondaryAction ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {primaryAction ? (
            <Link href={primaryAction.href}>
              <Button variant={primaryAction.variant ?? "secondary"}>{primaryAction.label}</Button>
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link href={secondaryAction.href}>
              <Button variant={secondaryAction.variant ?? "outline"}>
                {secondaryAction.label}
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
