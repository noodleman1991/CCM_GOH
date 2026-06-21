'use client'

/**
 * UserCarousel — a horizontally scrollable row of user cards. The scroll arrows
 * sit in the header row (top-trailing, beside the title) rather than overlapping
 * the cards, and there is no expand/collapse — it's always the carousel.
 * RTL-aware + responsive.
 */

import { useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { CollaborateUserCard } from './collaborate-user-card'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SectionHeader } from '@/components/ui/section-header'
import type { LocalizedUser } from '@/types/prisma'

interface UserCarouselProps {
  title: string
  users: Array<LocalizedUser & {
    lastLoginAt?: Date | null
    communityMemberships?: Array<{
      community: { name: string; regionalName?: string | null }
    }>
  }>
  className?: string
}

export function UserCarousel({ title, users, className }: UserCarouselProps) {
  const t = useTranslations('collaborate.carousel')
  const tStats = useTranslations('collaborate.stats')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    const amount = 360
    const delta = isRTL
      ? direction === 'left' ? amount : -amount
      : direction === 'left' ? -amount : amount
    scrollContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' })
  }

  if (users.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <SectionHeader title={title} subtitle={t('noMembers')} />
      </div>
    )
  }

  const arrowBtn =
    'inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground/70 transition-colors hover:border-ccm-sea/40 hover:text-ccm-sea focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header: section title/count + scroll arrows on the trailing side */}
      <div className="flex items-end justify-between gap-4">
        <SectionHeader title={title} subtitle={tStats('totalMembers', { count: users.length })} />
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => scroll('left')} aria-label={t('previous')} className={arrowBtn}>
            <ChevronLeft className="size-4 rtl:hidden" />
            <ChevronRight className="hidden size-4 rtl:block" />
          </button>
          <button type="button" onClick={() => scroll('right')} aria-label={t('next')} className={arrowBtn}>
            <ChevronRight className="size-4 rtl:hidden" />
            <ChevronLeft className="hidden size-4 rtl:block" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2 snap-x"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {users.map(user => (
          <div key={user.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
            <CollaborateUserCard user={user} />
          </div>
        ))}
      </div>
    </div>
  )
}
