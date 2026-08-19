'use client'

/**
 * UserGrid Component
 * Responsive grid layout for user cards with pagination
 * Displays up to 4 rows on expanded view, responsive column count
 */

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CollaborateUserCard } from './collaborate-user-card'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { LocalizedUser } from '@/types/prisma'

interface UserGridProps {
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
  itemsPerPage?: number
  locale?: string
}

export function UserGrid({ users, className, itemsPerPage, locale }: UserGridProps) {
  const t = useTranslations('collaborate.carousel')
  const tStats = useTranslations('collaborate.stats')
  const tCommon = useTranslations('common')
  const isRTL = locale === 'ar'

  // Calculate items per page based on screen size (4 rows)
  // Responsive: 1 col (mobile), 2 cols (tablet), 3 cols (desktop), 4 cols (large)
  // 4 rows = 4, 8, 12, 16 items respectively
  const defaultItemsPerPage = itemsPerPage || 16

  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(users.length / defaultItemsPerPage))

  // Clamp the page when the users list shrinks (the component instance
  // survives prop changes, so a stale page could render an empty grid)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional clamp when the users list shrinks; deriving instead would change pagination timing
    setCurrentPage(p => Math.min(p, totalPages))
  }, [totalPages])

  const startIndex = (currentPage - 1) * defaultItemsPerPage
  const endIndex = startIndex + defaultItemsPerPage
  const currentUsers = users.slice(startIndex, endIndex)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grid */}
      <div className={cn(
        'grid gap-4',
        'grid-cols-1',              // Mobile: 1 column
        'sm:grid-cols-2',           // Tablet: 2 columns
        'lg:grid-cols-3',           // Desktop: 3 columns
        'xl:grid-cols-4'            // Large: 4 columns
      )}>
        {currentUsers.map(user => (
          <CollaborateUserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {tStats('showing', {
              count: Math.min(endIndex, users.length),
              total: users.length
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="gap-2"
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {tCommon('previous')}
            </Button>
            <span className="text-sm font-medium px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="gap-2"
            >
              {tCommon('next')}
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
