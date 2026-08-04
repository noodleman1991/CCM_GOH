'use client'
import { useTranslations } from 'next-intl'

import { X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A tappable filter pill, shared across all filtering interfaces (collaborate,
 * case studies, news, lived experiences, search). ONE chip geometry everywhere:
 * px-3 py-1.5 text-sm rounded-full, label never wraps. Active fills with the
 * brand colour — no icon, so a chip's width never jumps when toggled.
 * Inclusion model: active = "include this".
 */
export function FilterChip({
  label,
  count,
  active,
  onClick,
  className,
  disabled = false,
  title,
}: {
  label: string
  /** Result count rendered as a quiet trailing figure (tabular-nums so
   *  neighbouring chips' counts align). Pass the number — never bake
   *  "label · n" into the label string. */
  count?: number
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
        'inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-transparent bg-[var(--color-ccm-sea)] text-white shadow-sm'
          : 'border-border bg-background text-foreground/80 hover:border-[var(--color-ccm-sea)]/40 hover:bg-muted',
        disabled && 'cursor-not-allowed opacity-70',
        className
      )}
    >
      <span className="text-start">{label}</span>
      {count !== undefined && (
        <span
          aria-hidden="true"
          className={cn('text-xs tabular-nums', active ? 'text-white/85' : 'text-muted-foreground')}
        >
          {count}
        </span>
      )}
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
        // Same geometry as FilterChip (px-3 py-1.5 text-sm rounded-full) so
        // applied-filter summaries line up with the pickers above them.
        'inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-ccm-sea)]/10 px-3 py-1.5 text-sm font-medium text-[var(--color-ccm-sea)]',
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
