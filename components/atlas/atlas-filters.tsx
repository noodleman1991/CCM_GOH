'use client'

import { FILTER_EDGE_FADE, FILTER_SCROLLBAR_HIDDEN } from '@/components/ui/filter-bar'
import { cn } from '@/lib/utils'

/**
 * Labelled filter rows (Gate-2 punch-list): each facet group gets its OWN row
 * with the group label in a fixed-width start column, so the three labels
 * (Show / Theme / When) and the three chip runs all share one aligned edge at
 * every breakpoint — instead of one long bar that crams labels and chips
 * together and wraps unpredictably on mobile.
 *
 * Mobile: each row scrolls horizontally on its own, with the shared edge fade
 * from filter-bar.tsx as the "more here" affordance. From `sm` up the chips
 * wrap inside their row instead (no fade — nothing is cut off).
 */
export function FilterRowGroup({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot="filter-rows" role="group" className={cn('space-y-1', className)} {...props}>
      {children}
    </div>
  )
}

export function FilterRow({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex items-start gap-2 sm:gap-3', className)}>
      <span className="w-14 flex-none select-none pt-2.5 font-heading text-[10px] font-bold uppercase tracking-[0.11em] text-[var(--color-ccm-slate,#8595AC)] sm:w-16">
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
        {children}
      </div>
    </div>
  )
}
