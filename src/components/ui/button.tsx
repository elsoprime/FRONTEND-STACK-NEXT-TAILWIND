"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border text-sm font-semibold whitespace-nowrap transition-[transform,background-color,color,border-color,box-shadow,opacity] duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-[0_18px_34px_-22px_hsl(var(--primary)/0.42)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_22px_40px_-22px_hsl(var(--primary)/0.5)] active:translate-y-0",
        outline:
          "border-border bg-background text-foreground shadow-[0_12px_24px_-22px_oklch(0.24_0.02_55/0.24)] hover:-translate-y-0.5 hover:border-primary/28 hover:bg-card",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-[0_12px_24px_-22px_oklch(0.24_0.02_55/0.18)] hover:-translate-y-0.5 hover:bg-secondary/88 hover:border-primary/18",
        ghost:
          "border-transparent bg-transparent text-foreground/80 shadow-none hover:bg-muted/75 hover:text-foreground",
        toolbar:
          "border-border bg-card text-foreground shadow-[0_12px_22px_-22px_oklch(0.24_0.02_55/0.18)] hover:-translate-y-0.5 hover:border-primary/22 hover:bg-secondary/72 hover:text-foreground",
        dashboard:
          "border-foreground/12 bg-foreground text-background shadow-[0_18px_34px_-22px_oklch(0.2_0.02_52/0.42)] hover:-translate-y-0.5 hover:bg-foreground/92",
        destructive:
          "border-destructive bg-destructive text-white shadow-[0_16px_30px_-22px_hsl(var(--destructive)/0.38)] hover:-translate-y-0.5 hover:brightness-105 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-7 gap-1.5 rounded-md px-2.5 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-2 rounded-md px-3.5 text-sm in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10 rounded-md",
        "icon-xs": "size-7 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
