'use client'
import { useTranslations } from 'next-intl'

import { Check, X, type LucideIcon } from 'lucide-react'
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
  disabled = false,
  title,
}: {
  label: string
  active: boolean
  onClick: () => void
  className?: string
  /** Renders `aria-disabled` + suppresses the click instead of a hard HTML
   *  `disabled` — used by multi-select chip groups where toggling off the
   *  last active option is a no-op that should still explain itself via
   *  `title` (e.g. the Atlas "at least one layer stays selected" case). */
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={active}
      aria-disabled={disabled || undefined}
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-transparent bg-[var(--color-ccm-sea)] text-white shadow-sm'
          : 'border-border bg-background text-foreground/80 hover:border-[var(--color-ccm-sea)]/40 hover:bg-muted',
        disabled && 'cursor-not-allowed opacity-70',
        className
      )}
    >
      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
      <span className="text-start">{label}</span>
    </button>
  )
}

/**
 * An ACTIVE-filter chip with a remove (×) affordance, for "currently applied"
 * filter summaries (case studies, news). Optional leading icon. RTL-safe.
 */
export function RemovableChip({
  label,
  onRemove,
  icon: Icon,
  removeLabel,
  className,
}: {
  label: string
  onRemove: () => void
  icon?: LucideIcon
  removeLabel?: string
  className?: string
}) {
  const t = useTranslations('common')
  const removeText = removeLabel ?? t('removeFilter')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ccm-sea)]/10 px-2.5 py-1 text-sm font-medium text-[var(--color-ccm-sea)]',
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span className="text-start">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeText}
        className="ms-0.5 rounded-full p-0.5 hover:bg-[var(--color-ccm-sea)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
