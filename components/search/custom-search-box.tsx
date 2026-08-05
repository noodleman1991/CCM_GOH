'use client'

import { useSearchBox } from 'react-instantsearch'
import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/search-input'

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
    <form onSubmit={handleSubmit} className="w-full">
      <SearchInput
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholderText}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onClear={inputValue ? handleClear : undefined}
        clearLabel={t('clearSearch')}
      />
    </form>
  )
}
