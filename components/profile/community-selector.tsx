'use client'

/**
 * CommunitySelector Component
 * Multi-select checkbox interface for regional communities
 * Supports i18n and RTL layouts
 * Fetches community names from Sanity with translations
 */

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

export interface Community {
  id: string
  name: {
    en: string
    es?: string
    fr?: string
    ar?: string
  } | string  // Support both Sanity format (object) and fallback (string)
  regionalName: string | null
  type: string
  slug?: string
}

export interface CommunitySelectorProps {
  selectedCommunities: string[]
  onChangeAction: (communities: string[]) => void
  availableCommunities?: Community[]  // Dynamic communities from API
  className?: string
  isRTL?: boolean
  title?: string
  description?: string
  showCard?: boolean
}

export function CommunitySelector({
  selectedCommunities,
  onChangeAction,
  availableCommunities,
  className,
  isRTL = false,
  title,
  description,
  showCard = true
}: CommunitySelectorProps) {
  const t = useTranslations('profile.communities')
  const locale = useLocale() as 'en' | 'es' | 'fr' | 'ar'

  // Ensure selectedCommunities is always an array
  const selected = selectedCommunities || []

  // Use dynamic communities from API (fetched from Sanity)
  const communities = availableCommunities || []

  const handleToggle = (communityId: string) => {
    if (selected.includes(communityId)) {
      onChangeAction(selected.filter(c => c !== communityId))
    } else {
      onChangeAction([...selected, communityId])
    }
  }

  /**
   * Get the localized display name from Sanity i18n object
   * Falls back to English if current locale translation is not available
   */
  const getDisplayName = (community: Community) => {
    // If name is an object (from Sanity with i18n)
    if (typeof community.name === 'object' && community.name !== null) {
      // Try to get the name in current locale, fallback to English
      return community.name[locale] || community.name.en
    }

    // Fallback if name is a string
    return community.name
  }

  const content = (
    <div className={cn('space-y-3', className)}>
      {communities.length === 0 ? (
        <p className={cn(
          'text-sm text-muted-foreground',
          isRTL && 'text-right'
        )}>
          {t('noCommunitiesAvailable')}
        </p>
      ) : (
        <>
          {communities.map(community => (
            <div
              key={community.id}
              className={cn(
                'flex items-center space-x-3 rtl:space-x-reverse',
                isRTL && 'flex-row-reverse justify-end'
              )}
            >
              <Checkbox
                id={`community-${community.id}`}
                checked={selected.includes(community.id)}
                onCheckedChange={() => handleToggle(community.id)}
              />
              <Label
                htmlFor={`community-${community.id}`}
                className={cn(
                  'text-sm font-normal leading-none cursor-pointer',
                  'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                  isRTL && 'text-right'
                )}
              >
                {getDisplayName(community)}
              </Label>
            </div>
          ))}

          {selected.length === 0 && (
            <p className={cn(
              'text-sm text-muted-foreground mt-4',
              isRTL && 'text-right'
            )}>
              {t('noneSelected')}
            </p>
          )}
        </>
      )}
    </div>
  )

  if (!showCard) {
    return content
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className={isRTL ? 'text-right' : ''}>
          {title || t('title')}
        </CardTitle>
        {description && (
          <CardDescription className={isRTL ? 'text-right' : ''}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}
