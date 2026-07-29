"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * CCM tabs standard (Gate-2 §tabs) — two variants from one grammar:
 *
 *  - `pill` (default): segmented control for TOOL surfaces (inbox, settings,
 *    view toggles). Active tab takes the midnight fill of primary buttons.
 *  - `line`: page-level navigation (regional pages, search groups). Quiet
 *    labels on a hairline; the active tab carries the ccm-water bar — the
 *    section-header bar rotated horizontal — sliding in via scale (a static
 *    state under reduced motion).
 *
 * Both: RTL-safe (logical utilities only), water focus ring, lists scroll
 * horizontally instead of wrapping. Counts render via <TabsCount>.
 */
type TabsVariant = "pill" | "line"

const TabsVariantContext = React.createContext<TabsVariant>("pill")

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      // Suppress hydration warning due to Radix UI useId mismatch in Next.js 16/React 19
      // See: https://github.com/radix-ui/primitives/issues/3700
      suppressHydrationWarning
      {...props}
    />
  )
}

const LIST_VARIANT: Record<TabsVariant, string> = {
  pill: "bg-muted text-muted-foreground inline-flex h-9 w-fit max-w-full items-center justify-center rounded-full p-1 overflow-x-auto",
  line: "flex h-auto w-full items-center justify-start gap-0.5 rounded-none border-b-[1.5px] border-border bg-transparent p-0 overflow-x-auto",
}

function TabsList({
  className,
  variant = "pill",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: TabsVariant }) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(LIST_VARIANT[variant], className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  )
}

const TRIGGER_BASE =
  "group/tab inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap cursor-pointer transition-[color,background-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ccm-water)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const TRIGGER_VARIANT: Record<TabsVariant, string> = {
  pill: "h-[calc(100%-1px)] flex-1 rounded-full border border-transparent px-4 py-1 text-foreground data-[state=active]:bg-[var(--color-ccm-midnight)] data-[state=active]:text-white data-[state=active]:shadow-sm dark:text-muted-foreground dark:data-[state=active]:text-white",
  // The water bar: an after-element that scales in under the active tab. It
  // sits on the list's own border so bar and hairline read as one system.
  line: "relative flex-none rounded-none border-0 bg-transparent px-4 pt-2 pb-2.5 text-muted-foreground hover:text-[var(--color-ccm-midnight)] data-[state=active]:font-bold data-[state=active]:text-[var(--color-ccm-midnight)] after:absolute after:inset-x-3.5 after:-bottom-[1.5px] after:h-[3px] after:origin-center after:scale-x-0 after:rounded-t-full after:bg-[var(--color-ccm-water)] after:transition-transform after:duration-200 data-[state=active]:after:scale-x-100 motion-reduce:after:transition-none",
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(TRIGGER_BASE, TRIGGER_VARIANT[variant], className)}
      // Suppress hydration warning due to Radix UI useId mismatch in Next.js 16/React 19
      suppressHydrationWarning
      {...props}
    />
  )
}

/** Count badge for a tab label — sky tint that inverts inside an active pill. */
function TabsCount({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const variant = React.useContext(TabsVariantContext)
  return (
    <span
      data-slot="tabs-count"
      className={cn(
        "rounded-full px-1.5 py-px text-[10.5px] font-bold tabular-nums",
        "bg-[var(--color-ccm-sky)]/25 text-[var(--color-ccm-sea)]",
        variant === "pill" &&
          "group-data-[state=active]/tab:bg-white/20 group-data-[state=active]/tab:text-white",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      // Suppress hydration warning due to Radix UI useId mismatch in Next.js 16/React 19
      suppressHydrationWarning
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsCount }
