"use client"

import { cn } from "@/lib/utils"
import { useEdgeFade } from "@/hooks/use-edge-fade"

/**
 * The slim horizontal filter bar (Gate-2 §filter-bar) — ONE 34px row shared by
 * every filterable listing (atlas, case studies, news, lived experiences,
 * search, collaborate, regional-page sections).
 *
 * Grammar: group labels are tiny uppercase prefixes INSIDE the row
 * (<FilterBarLabel>), frequent facets are inline <FilterChip>s, long
 * taxonomies collapse behind a caret chip that opens a popover (bottom sheet
 * on mobile), groups divide with <FilterBarSeparator>. The row scrolls with a
 * soft edge fade — it never wraps to a second line and never becomes a
 * sidebar. Chips themselves come from filter-chip.tsx.
 */

/** Hide the horizontal scrollbar on chip rows (the edge fade is the scroll
 *  affordance instead). */
export const FILTER_SCROLLBAR_HIDDEN =
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

export function FilterBar({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<"div">) {
  // Fades only the edge that hides chips (hooks/use-edge-fade.ts).
  const { attach: attachFade, style: fadeStyle } = useEdgeFade<HTMLDivElement>()
  return (
    <div
      ref={attachFade}
      data-slot="filter-bar"
      role="group"
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto py-1.5",
        FILTER_SCROLLBAR_HIDDEN,
        className
      )}
      style={{ ...fadeStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

/** Tiny uppercase group prefix inside the bar ("Region", "Theme", "When"). */
export function FilterBarLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="filter-bar-label"
      className={cn(
        "ms-2 flex-none select-none font-heading text-[10px] font-bold uppercase tracking-[0.11em] text-[var(--color-ccm-slate,#8595AC)] first:ms-0",
        className
      )}
      {...props}
    />
  )
}

/** Hairline divider between filter groups. */
export function FilterBarSeparator({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="filter-bar-separator"
      aria-hidden
      className={cn("mx-1 h-[18px] w-px flex-none bg-border", className)}
      {...props}
    />
  )
}
