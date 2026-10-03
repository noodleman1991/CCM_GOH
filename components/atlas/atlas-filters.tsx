'use client'

import { Children, isValidElement, useState } from 'react'
import { FILTER_EDGE_FADE, FILTER_SCROLLBAR_HIDDEN } from '@/components/ui/filter-bar'
import { cn } from '@/lib/utils'

/**
 * Labelled filter rows (Gate-2 punch-list): each facet group gets its OWN row
 * with the group label in a fixed-width start column, so the three labels
 * (Show / Theme / When) and the three chip runs all share one aligned edge at
 * every breakpoint — instead of one long bar that crams labels and chips
 * together and wraps unpredictably on mobile.
 *
 * Mobile: the label sits above its row, and each row scrolls horizontally on
 * its own, with the shared edge fade from filter-bar.tsx as the "more here"
 * affordance. From `sm` up the label moves beside its row and the chips wrap
 * (no fade — nothing is cut off). Long tag rows collapse behind "+N more".
 */
export function FilterRowGroup({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="filter-rows" role="group" className={cn('space-y-5 sm:space-y-1', className)} {...props}>
      {children}
    </div>
  )
}

export function FilterRow({
  label,
  className,
  children,
  collapse,
}: {
  label: string
  className?: string
  children: React.ReactNode
  /** Long tag rows show their first `limit` chips and a "+N more" chip; a
   *  selected chip always stays visible (user, 2026-09-30). */
  collapse?: { limit: number; more: (hidden: number) => string; less: string }
}) {
  const [open, setOpen] = useState(false)
  const items = Children.toArray(children)
  const collapsible = Boolean(collapse && items.length > collapse.limit + 1)
  const shown =
    collapsible && !open
      ? items.filter((child, i) => i < collapse!.limit || (isValidElement<{ active?: boolean }>(child) && child.props.active === true))
      : items
  const hidden = items.length - shown.length

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3', className)}>
      <span className="flex-none select-none break-words font-heading text-[10px] font-bold uppercase leading-tight tracking-[0.11em] text-[var(--color-ccm-slate,#8595AC)] [hyphens:auto] sm:w-24 sm:pt-2.5">
        {label}
      </span>
      <div
        className={cn(
          'flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1',
          FILTER_EDGE_FADE,
          FILTER_SCROLLBAR_HIDDEN,
          'sm:flex-wrap sm:overflow-x-visible sm:[-webkit-mask-image:none] sm:[mask-image:none]'
        )}
      >
        {shown}
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex flex-none items-center whitespace-nowrap rounded-full border border-dashed border-[var(--color-ccm-sea)]/40 px-3 py-1.5 text-sm font-semibold text-[var(--color-ccm-sea)] hover:bg-[var(--color-ccm-sea)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {open ? collapse!.less : collapse!.more(hidden)}
          </button>
        )}
      </div>
    </div>
  )
}
