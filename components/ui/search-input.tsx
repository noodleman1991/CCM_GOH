'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * THE search field (design uniformity, user 2026-08-05): every search box in
 * the hub renders this soft pill — muted ground, leading search icon, firms
 * up to a bordered field on focus. Pass `onClear` to get the trailing ×
 * whenever the field has a value.
 *
 * A thin wrapper over `Input`, so every input prop (value, defaultValue,
 * onChange, onKeyDown, aria-*) passes straight through.
 */
export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & {
    /** Renders the trailing clear (×) button when the field has a value. */
    onClear?: () => void
    /** Class for the OUTER wrapper (width/margin live here). */
    containerClassName?: string
    clearLabel?: string
  }
>(function SearchInput({ onClear, containerClassName, clearLabel, className, ...props }, ref) {
  const hasValue = Boolean(props.value ?? props.defaultValue)
  return (
    <div className={cn('relative', containerClassName)}>
      <Search
        className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        ref={ref}
        type="search"
        {...props}
        className={cn(
          'h-10 rounded-full border-transparent bg-muted/60 ps-10 transition-colors',
          'focus-visible:border-input focus-visible:bg-background',
          '[&::-webkit-search-cancel-button]:hidden',
          onClear ? 'pe-9' : 'pe-4',
          className
        )}
      />
      {onClear && hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
          aria-label={clearLabel ?? 'Clear'}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
})
