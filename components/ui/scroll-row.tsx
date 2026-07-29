'use client'
import { useTranslations } from 'next-intl'

import { useRef, useState, useEffect, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A Netflix-style horizontally-scrolling row: a title, a snap-scrolling track of
 * cards, and arrow controls that appear when there's overflow. RTL-safe (uses
 * logical scrolling; arrows flip with direction). Children are the cards.
 */
export function ScrollRow({
  title,
  subtitle,
  children,
  isRTL = false,
  className,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  isRTL?: boolean
  className?: string
}) {
  const t = useTranslations('common')
  const trackRef = useRef<HTMLDivElement>(null)
  const [canStart, setCanStart] = useState(false)
  const [canEnd, setCanEnd] = useState(false)

  const updateArrows = () => {
    const el = trackRef.current
    if (!el) return
    // Normalize scrollLeft for RTL (can be negative depending on browser).
    const max = el.scrollWidth - el.clientWidth
    const pos = Math.abs(el.scrollLeft)
    setCanStart(pos > 4)
    setCanEnd(pos < max - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [children])

  const scrollByPage = (dir: 'start' | 'end') => {
    const el = trackRef.current
    if (!el) return
    const amount = el.clientWidth * 0.85
    // In RTL, "end" means scrolling toward more-negative scrollLeft.
    const sign = (dir === 'end' ? 1 : -1) * (isRTL ? -1 : 1)
    el.scrollBy({ left: amount * sign, behavior: 'smooth' })
  }

  return (
    <section className={cn('space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {(title || subtitle) && (
        <div className="space-y-0.5">
          {title && <h2 className="text-xl md:text-2xl font-bold text-balance">{title}</h2>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      <div className="group/row relative">
        {/* Start arrow */}
        {canStart && (
          <button
            type="button"
            aria-label={t('scrollBack')}
            onClick={() => scrollByPage('start')}
            className="absolute start-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow-md ring-1 ring-border transition-opacity hover:bg-background md:block opacity-0 group-hover/row:opacity-100"
          >
            <ChevronLeft className={cn('h-5 w-5', isRTL && 'rotate-180')} />
          </button>
        )}

        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>

        {/* End arrow */}
        {canEnd && (
          <button
            type="button"
            aria-label={t('scrollForward')}
            onClick={() => scrollByPage('end')}
            className="absolute end-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow-md ring-1 ring-border transition-opacity hover:bg-background md:block opacity-0 group-hover/row:opacity-100"
          >
            <ChevronRight className={cn('h-5 w-5', isRTL && 'rotate-180')} />
          </button>
        )}
      </div>
    </section>
  )
}
