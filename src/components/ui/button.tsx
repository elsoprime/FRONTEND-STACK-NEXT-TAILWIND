"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border text-sm font-semibold tracking-[-0.01em] whitespace-nowrap transition-[transform,background-color,color,border-color,box-shadow,opacity] duration-200 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-55 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 dark:aria-invalid:border-destructive/70 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:-translate-y-0.5 hover:border-primary/90 hover:bg-primary/92 hover:shadow-lg hover:shadow-primary/18 active:translate-y-0 active:bg-primary/95 dark:shadow-black/30",
        primary:
          "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:-translate-y-0.5 hover:border-primary/90 hover:bg-primary/92 hover:shadow-lg hover:shadow-primary/18 active:translate-y-0 active:bg-primary/95 dark:shadow-black/30",
        secondary:
          "border-secondary bg-secondary text-secondary-foreground shadow-sm shadow-black/5 hover:-translate-y-0.5 hover:border-primary/22 hover:bg-secondary/88 hover:text-foreground hover:shadow-md hover:shadow-black/10 active:translate-y-0 dark:shadow-black/25",
        tertiary:
          "border-accent/70 bg-accent text-accent-foreground shadow-sm shadow-accent/20 hover:-translate-y-0.5 hover:border-accent hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/18 active:translate-y-0 active:bg-accent/95 dark:shadow-black/30",
        outline:
          "border-border bg-white/88 text-foreground shadow-sm shadow-black/5 backdrop-blur-[2px] hover:-translate-y-0.5 hover:border-primary/24 hover:bg-card hover:shadow-md hover:shadow-black/10 active:translate-y-0 dark:bg-card/78 dark:shadow-black/25",
        ghost:
          "border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-muted/70 hover:text-foreground active:bg-muted/80",
        toolbar:
          "border-border/80 bg-card/92 text-foreground shadow-sm shadow-black/5 backdrop-blur-[2px] hover:-translate-y-0.5 hover:border-primary/24 hover:bg-secondary/78 hover:text-foreground hover:shadow-md hover:shadow-black/10 active:translate-y-0 dark:bg-card/78 dark:shadow-black/25",
        dashboard:
          "border-border/75 bg-card/94 text-foreground shadow-sm shadow-black/5 backdrop-blur-[2px] hover:-translate-y-0.5 hover:border-primary/28 hover:bg-card hover:text-foreground hover:shadow-lg hover:shadow-black/10 active:translate-y-0 dark:bg-card/80 dark:shadow-black/30",
        destructive:
          "border-destructive bg-destructive text-white shadow-sm shadow-destructive/20 hover:-translate-y-0.5 hover:border-destructive/90 hover:bg-destructive/92 hover:shadow-lg hover:shadow-destructive/18 focus-visible:ring-destructive/35 active:translate-y-0 active:bg-destructive/95 dark:shadow-black/30",
        link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-7 gap-1.5 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-2 px-3.5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
      radius: {
        md: "rounded-md",
        full: "rounded-full",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "md",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<React.ElementRef<typeof ButtonPrimitive>, ButtonProps>(
  ({ className, variant = "default", size = "default", radius = "md", ...props }, ref) => {
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, radius }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
