import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Text wraps and is balanced/centered instead of forced onto one line, so
  // longer labels (and longer es/fr/ar translations) wrap to a second line
  // rather than overflowing or being clipped. Sizes use min-height (below) so a
  // wrapped button grows vertically instead of truncating.
  // Flat by design: colour + border carry the hierarchy, not drop shadows.
  // Text wraps/balances so long es/fr/ar labels grow vertically (min-h sizes)
  // instead of overflowing. One radius, one transition, consistent focus ring.
  "inline-flex items-center justify-center gap-2 text-center text-balance leading-tight font-bold transition-[color,background-color,border-color] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 focus-visible:ring-4 focus-visible:outline-1 aria-invalid:focus-visible:ring-0 font-heading rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-ccm-sea)] text-white hover:bg-[var(--color-ccm-midnight)]",
        invert: "bg-background text-[var(--color-ccm-midnight)] border-2 border-[var(--color-ccm-midnight)]/20 hover:bg-muted hover:border-[var(--color-ccm-midnight)]/40",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-[var(--color-ccm-sea)] bg-transparent text-[var(--color-ccm-sea)] hover:bg-[var(--color-ccm-sea)]/10 hover:border-[var(--color-ccm-sea)]/80",
        secondary: "bg-[var(--color-ccm-water)]/15 text-[var(--color-ccm-midnight)] border border-[var(--color-ccm-water)]/40 hover:bg-[var(--color-ccm-water)]/25 hover:border-[var(--color-ccm-water)]/60",
        ghost: "bg-transparent text-[var(--color-ccm-sea)] hover:bg-[var(--color-ccm-sea)]/10 hover:text-[var(--color-ccm-midnight)]",
        link: "text-[var(--color-ccm-sea)] underline-offset-4 hover:underline hover:text-[var(--color-ccm-midnight)]",
      },
      size: {
        // min-h (not fixed h) so buttons grow when their label wraps. A clear
        // step between each: sm compact, default standard, lg/wide prominent.
        sm: "min-h-8 px-3 py-1.5 text-xs has-[>svg]:px-2.5",
        default: "min-h-10 px-5 py-2 text-sm has-[>svg]:px-4",
        lg: "min-h-12 px-8 py-2.5 text-base has-[>svg]:px-6",
        wide: "min-h-12 px-14 py-2.5 text-base has-[>svg]:px-12",
        icon: "size-10 shrink-0",
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