'use client'

/**
 * UserCarousel Component
 * Horizontally scrollable carousel of user cards with expand functionality
 * Supports RTL layouts and responsive design
 */

import { useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CollaborateUserCard } from './collaborate-user-card'
import { UserGrid } from './user-grid'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import type { LocalizedUser } from '@/types/prisma'

interface UserCarouselProps {
  title: string
  users: Array<LocalizedUser & {
    lastLoginAt?: Date | null
    communityMemberships?: Array<{
      community: {
        name: string
        regionalName?: string | null
      }
    }>
  }>
  className?: string
  defaultExpanded?: boolean
}

export function UserCarousel({ title, users, className, defaultExpanded = false }: UserCarouselProps) {
  const t = useTranslations('collaborate.carousel')
  const tStats = useTranslations('collaborate.stats')
  const locale = useLocale()
  const isRTL = locale === 'ar'

  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 400
    const scrollDirection = isRTL
      ? direction === 'left' ? scrollAmount : -scrollAmount
      : direction === 'left' ? -scrollAmount : scrollAmount

    scrollContainerRef.current.scrollBy({
      left: scrollDirection,
      behavior: 'smooth'
    })
  }

  if (users.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {t('noMembers')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {tStats('totalMembers', { count: users.length })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          {isExpanded ? (
            <>
              <Minimize2 className="h-4 w-4" />
              {t('collapse')}
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              {t('expand')}
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      {isExpanded ? (
        <UserGrid users={users} locale={locale} />
      ) : (
        <div className="relative group">
          {/* Scroll Buttons */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'absolute top-1/2 -translate-y-1/2 z-10',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'shadow-lg',
              isRTL ? 'right-2' : 'left-2'
            )}
            onClick={() => scroll('left')}
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'absolute top-1/2 -translate-y-1/2 z-10',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'shadow-lg',
              isRTL ? 'left-2' : 'right-2'
            )}
            onClick={() => scroll('right')}
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          {/* Carousel */}
          <div
            ref={scrollContainerRef}
            className={cn(
              'flex gap-4 overflow-x-auto scrollbar-hide pb-4',
              'scroll-smooth'
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {users.map(user => (
              <div
                key={user.id}
                className="flex-shrink-0 w-[280px] sm:w-[320px]"
              >
                <CollaborateUserCard user={user} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
