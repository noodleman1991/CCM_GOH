import { cn } from "@/lib/utils"

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
export function FilterBar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-bar"
      role="group"
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto py-1.5",
        // Soft fade on the overflow edges so cut-off chips read as "more
        // here". Near-zero at the start (4px) so the leading group label is
        // never dimmed; symmetric enough to stay direction-safe in RTL.
        "[mask-image:linear-gradient(to_right,transparent,#000_4px,#000_calc(100%-22px),transparent)]",
        "[-webkit-mask-image:linear-gradient(to_right,transparent,#000_4px,#000_calc(100%-22px),transparent)]",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
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
