"use client";

import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingScreenVariant = "fullscreen" | "inline";

type LoadingScreenProps = {
  label?: string;
  hint?: string;
  variant?: LoadingScreenVariant;
  className?: string;
  showSkeleton?: boolean;
};

export function LoadingScreen({
  label = "Cargando datos...",
  hint,
  variant = "fullscreen",
  className,
  showSkeleton = true,
}: LoadingScreenProps) {
  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "w-full",
        variant === "fullscreen"
          ? "grid min-h-[calc(100dvh-4.5rem)] place-items-center px-4"
          : "grid place-items-center",
        className,
      )}
    >
      <article className="surface-card w-full max-w-lg border-border/85 bg-card/90 p-6 text-center sm:p-7">
        <div className="mx-auto flex size-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 text-primary">
          <LoaderCircle className="size-5 animate-spin" />
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>

        {showSkeleton ? (
          <div className="mx-auto mt-5 w-full max-w-sm space-y-2">
            <div className="h-3.5 w-full animate-pulse rounded bg-muted/72" />
            <div className="h-3.5 w-9/12 animate-pulse rounded bg-muted/72" />
            <div className="h-3.5 w-10/12 animate-pulse rounded bg-muted/72" />
          </div>
        ) : null}
      </article>
    </section>
  );
}
