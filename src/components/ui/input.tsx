import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, ...props },
  ref,
) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-input/80 bg-background/80 px-3.5 py-2 text-sm shadow-sm ring-offset-background transition-[border-color,box-shadow,background-color] duration-200",
        "placeholder:text-muted-foreground/90 hover:border-ring/45 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
