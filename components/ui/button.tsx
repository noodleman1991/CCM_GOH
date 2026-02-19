import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-[color,box-shadow,border-color] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 focus-visible:ring-4 focus-visible:outline-1 aria-invalid:focus-visible:ring-0 font-heading rounded-[6px]",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-ccm-sea)] text-white shadow-md hover:bg-[var(--color-ccm-sea)]/90 hover:shadow-lg",
        invert: "bg-background text-[var(--color-ccm-midnight)] shadow-md border-2 border-[var(--color-ccm-midnight)]/20 hover:bg-muted hover:shadow-lg hover:border-[var(--color-ccm-midnight)]/30",
        "light-invert": "bg-[var(--color-ccm-sky)] text-[var(--color-ccm-midnight)] shadow-sm hover:bg-[var(--color-ccm-sky)]/80",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg",
        outline: "border border-[var(--color-ccm-sea)] bg-transparent text-[var(--color-ccm-sea)] shadow-sm hover:bg-[var(--color-ccm-sea)]/10 hover:border-[var(--color-ccm-sea)]/80",
        secondary: "bg-[var(--color-ccm-water)]/15 text-[var(--color-ccm-midnight)] border-2 border-[var(--color-ccm-water)]/30 shadow-sm hover:bg-[var(--color-ccm-water)]/25 hover:border-[var(--color-ccm-water)]/50",
        ghost: "bg-transparent text-[var(--color-ccm-sea)] hover:bg-[var(--color-ccm-sea)]/10 hover:text-[var(--color-ccm-midnight)]",
        link: "text-[var(--color-ccm-sea)] underline-offset-4 hover:underline hover:text-[var(--color-ccm-midnight)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        wide: "h-9 px-16 py-2 has-[>svg]:px-14",
        thick: "h-16 px-12 py-6 text-lg font-extrabold has-[>svg]:px-10",
        sm: "h-9 px-4 has-[>svg]:px-3",
        lg: "h-12 px-8 has-[>svg]:px-6",
        icon: "size-9",
      },
      stroke: {
        none: "",
        light: "border border-gray-300",
        midnight: "border border-[var(--color-ccm-midnight)]",
      },
    },
    compoundVariants: [
      {
        variant: "invert",
        stroke: "midnight",
        className: "border-[var(--color-ccm-midnight)]"
      },
      {
        variant: "invert",
        stroke: "light",
        className: "border-gray-300"
      },
      {
        variant: "light-invert",
        stroke: "midnight",
        className: "border-[var(--color-ccm-midnight)]"
      },
      {
        variant: "light-invert",
        stroke: "light",
        className: "border-white"
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      stroke: "none",
    },
  }
);

function Button({
  className,
  variant,
  size,
  stroke,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, stroke, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };