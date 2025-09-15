'use client'

import { useStats } from 'react-instantsearch'
import { useTranslations } from 'next-intl'

export default function SearchStats() {
  const { nbHits, areHitsSorted, nbSortedHits, processingTimeMS } = useStats()
  const t = useTranslations('search.stats')

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`
    }
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-4">
      <div>
        {areHitsSorted ? (
          <span>
            <strong className="text-foreground">{formatNumber(nbSortedHits || 0)}</strong> {t('relevant')} <strong className="text-foreground">{formatNumber(nbHits || 0)}</strong>
          </span>
        ) : (
          <span>
            <strong className="text-foreground">{formatNumber(nbHits || 0)}</strong>{' '}
            {(nbHits || 0) === 1 ? t('result') : t('results')}
          </span>
        )}
      </div>
      
      <div>
        {processingTimeMS !== undefined && t('foundIn')} {processingTimeMS !== undefined && formatTime(processingTimeMS)}
      </div>
    </div>
  )
}