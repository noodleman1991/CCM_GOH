'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A tappable filter pill, shared across all filtering interfaces (collaborate,
 * case studies, news, lived experiences, search). Fills with the brand colour
 * and shows a check when active — engaging, scannable, and the active state
 * reads at a glance. Inclusion model: active = "include this".
 */
export function FilterChip({
  label,
  active,
  onClick,
  className,
}: {
  label: string
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-transparent bg-[var(--color-ccm-sea)] text-white shadow-sm'
          : 'border-border bg-background text-foreground/80 hover:border-[var(--color-ccm-sea)]/40 hover:bg-muted',
        className
      )}
    >
      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
      <span className="text-start">{label}</span>
    </button>
  )
}
