'use client'

import { useHits, usePagination } from 'react-instantsearch'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Briefcase, Building } from 'lucide-react'
import Link from 'next/link'
import { UserSearchRecord } from '@/lib/algolia'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { useTranslations } from 'next-intl'

interface SearchResultsProps {
  type: 'users' | 'content'
}

function UserResult({ hit }: { hit: UserSearchRecord }) {
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16">
            <AvatarImage src={hit.profileImage} alt={hit.fullName} />
            <AvatarFallback className="text-lg">
              {getInitials(hit.firstName, hit.lastName)}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  <Link 
                    href={`/profiles/${hit.username}`}
                    className="hover:underline text-primary"
                  >
                    {hit.fullName || hit.username}
                  </Link>
                </h3>
                {hit.username && hit.fullName && (
                  <p className="text-sm text-muted-foreground">@{hit.username}</p>
                )}
              </div>
              
              {hit.role !== 'community_member' && (
                <Badge variant="secondary">
                  {hit.role.replace('_', ' ')}
                </Badge>
              )}
            </div>

            {/* Bio */}
            {hit.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {hit.bio}
              </p>
            )}

            {/* Work Info */}
            {hit.showWorkDetails && (hit.organization || hit.position) && (
              <div className="flex items-center gap-2 mt-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {hit.position && hit.organization 
                    ? `${hit.position} at ${hit.organization}`
                    : hit.position || hit.organization
                  }
                </span>
              </div>
            )}

            {/* Location */}
            {hit.showLocation && hit.location && (
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{hit.location}</span>
              </div>
            )}

            {/* Work Types */}
            {hit.showWorkDetails && hit.workTypes.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {hit.workTypes.slice(0, 3).map((type, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {type.replace('_', ' ').toLowerCase()}
                    </Badge>
                  ))}
                  {hit.workTypes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{hit.workTypes.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Expertise Areas */}
            {hit.expertiseAreas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hit.expertiseAreas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {area.replace('_', ' ').toLowerCase()}
                  </Badge>
                ))}
              </div>
            )}

            {/* Communities */}
            {hit.communities.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  Member of {hit.communities.slice(0, 2).join(', ')}
                  {hit.communities.length > 2 && ` and ${hit.communities.length - 2} other communities`}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SearchPagination() {
  const { pages, currentRefinement, isFirstPage, isLastPage, refine } = usePagination({}, { skipSuspense: true })

  if (pages.length <= 1) return null

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        {!isFirstPage && (
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => refine(currentRefinement - 1)}
              className="cursor-pointer"
            />
          </PaginationItem>
        )}
        
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={() => refine(page)}
              isActive={page === currentRefinement}
              className="cursor-pointer"
            >
              {page + 1}
            </PaginationLink>
          </PaginationItem>
        ))}

        {!isLastPage && (
          <PaginationItem>
            <PaginationNext 
              onClick={() => refine(currentRefinement + 1)}
              className="cursor-pointer"
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}

export default function SearchResults({ type }: SearchResultsProps) {
  const { hits } = useHits({}, { skipSuspense: true })
  const t = useTranslations('search')

  if (hits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2">{t('noResults')}</div>
        <p className="text-sm text-muted-foreground">
          {t('noResultsDescription')}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-4">
        {type === 'users' && hits.map((hit) => (
          <UserResult key={hit.objectID} hit={hit as unknown as UserSearchRecord} />
        ))}
      </div>
      
      <SearchPagination />
    </div>
  )
}