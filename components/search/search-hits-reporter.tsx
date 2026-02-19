'use client'

import { useStats } from 'react-instantsearch'
import { useEffect } from 'react'

interface SearchHitsReporterProps {
  onHitsChange: (nbHits: number) => void
}

/**
 * Invisible component that reports the current search hits count
 * to a parent component via callback. Must be used inside an InstantSearch context.
 */
export function SearchHitsReporter({ onHitsChange }: SearchHitsReporterProps) {
  const { nbHits } = useStats()

  useEffect(() => {
    onHitsChange(nbHits)
  }, [nbHits, onHitsChange])

  return null
}
