'use client'

import { useSearchBox } from 'react-instantsearch'
import { Search, X } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

interface CustomSearchBoxProps {
  placeholder?: string
}

export function CustomSearchBox({ placeholder = 'Search...' }: CustomSearchBoxProps) {
  const { query, refine } = useSearchBox()
  const [inputValue, setInputValue] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with InstantSearch query
  useEffect(() => {
    if (query !== inputValue) {
      setInputValue(query)
    }
  }, [query])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    refine(value)
  }

  const handleClear = () => {
    setInputValue('')
    refine('')
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
        placeholder={placeholder}
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
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}
