'use client'

import { useSearchBox } from 'react-instantsearch'
import { Search, X } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface CustomSearchBoxProps {
  placeholder?: string
}

// Wait this long after the last keystroke before querying Algolia. Keeps the
// input fully responsive while avoiding a request (and a results re-render)
// on every character, which made the results flicker.
const SEARCH_DEBOUNCE_MS = 250

export function CustomSearchBox({ placeholder }: CustomSearchBoxProps) {
  const t = useTranslations('common')
  const placeholderText = placeholder ?? t('search')
  const { query, refine } = useSearchBox()
  const [inputValue, setInputValue] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with InstantSearch query
  useEffect(() => {
    if (query !== inputValue) {
      setInputValue(query)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // Clear any pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value) // immediate, so typing feels instant
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => refine(value), SEARCH_DEBOUNCE_MS)
  }

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setInputValue('')
    refine('') // clearing should be instant, no debounce
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      {/* Search Icon - Start side */}
      <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Search className="h-5 w-5" />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholderText}
        className="flex h-12 w-full rounded-md border border-input bg-background ps-11 pe-11 py-2 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Clear Button - End side (only show when there's text) */}
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={t('clearSearch')}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}
