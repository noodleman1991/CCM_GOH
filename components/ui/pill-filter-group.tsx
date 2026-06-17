'use client'

import { FilterChip } from '@/components/ui/filter-chip'
import { cn } from '@/lib/utils'

export interface PillOption {
  /** The value stored in filter state. */
  value: string
  /** The human, localized label to display. */
  label: string
  /** Optional count shown after the label, e.g. "(12)". */
  count?: number
}

/**
 * A labelled group of multi-select filter pills — the single, shared filtering
 * affordance across the site (search, news, lived experiences, case studies,
 * agendas). Inclusion model: selected = "include this"; an empty selection
 * means "no filter" (show everything).
 *
 * Best-practice: the group is a real fieldset with a legend (screen-reader
 * friendly), each pill is a toggle button with aria-pressed, and the layout is
 * RTL-safe via logical properties.
 */
export function PillFilterGroup({
  legend,
  options,
  selected,
  onToggle,
  className,
}: {
  legend: string
  options: PillOption[]
  selected: string[]
  onToggle: (value: string) => void
  className?: string
}) {
  if (options.length === 0) return null

  return (
    <fieldset className={cn('space-y-2', className)}>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.count !== undefined && opt.count > 0 ? `${opt.label} (${opt.count})` : opt.label}
            active={selected.includes(opt.value)}
            onClick={() => onToggle(opt.value)}
          />
        ))}
      </div>
    </fieldset>
  )
}
