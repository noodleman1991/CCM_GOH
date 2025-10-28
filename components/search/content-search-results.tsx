'use client'

import { useHits, usePagination } from 'react-instantsearch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Briefcase, Calendar, Download, Star, Building2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { CaseStudySearchRecord, AgendaSearchRecord, NewsSearchRecord } from '@/lib/algolia'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'

interface ContentSearchResultsProps {
  type: 'case-studies' | 'agendas' | 'news'
}

function CaseStudyResult({ hit }: { hit: CaseStudySearchRecord }) {
  const getLocalizedTitle = (title: any) => {
    if (typeof title === 'string') return title
    return title?.en || title?.es || title?.fr || title?.ar || 'Untitled'
  }

  const getLocalizedExcerpt = (excerpt: any) => {
    if (typeof excerpt === 'string') return excerpt
    return excerpt?.en || excerpt?.es || excerpt?.fr || excerpt?.ar || ''
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">
                  <Link
                    href={`/case-studies/${hit.slug}`}
                    className="hover:underline text-primary"
                  >
                    {getLocalizedTitle(hit.title)}
                  </Link>
                </h3>
                {hit.featured && (
                  <Badge variant="secondary" className="mt-1">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            {getLocalizedExcerpt(hit.excerpt) && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {getLocalizedExcerpt(hit.excerpt)}
              </p>
            )}

            {/* Authors */}
            {hit.authors && hit.authors.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Authors:</span>
                <span className="text-sm text-muted-foreground">
                  {hit.authors.slice(0, 3).map(author => author.name).join(', ')}
                  {hit.authors.length > 3 && ` +${hit.authors.length - 3} more`}
                </span>
              </div>
            )}

            {/* Study Period */}
            {hit.studyPeriod && (
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {hit.studyPeriod.startDate} - {hit.studyPeriod.endDate}
                </span>
              </div>
            )}

            {/* Location */}
            {hit.studyLocation && (
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {hit.studyLocation.name}
                </span>
              </div>
            )}

            {/* Organizations */}
            {hit.organizations && hit.organizations.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {hit.organizations.slice(0, 2).map((org, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {org}
                    </Badge>
                  ))}
                  {hit.organizations.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{hit.organizations.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {hit.tags && hit.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hit.tags.slice(0, 5).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {hit.tags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{hit.tags.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AgendaResult({ hit }: { hit: AgendaSearchRecord }) {
  const getLocalizedTitle = (title: any) => {
    if (typeof title === 'string') return title
    return title?.en || title?.es || title?.fr || title?.ar || 'Untitled'
  }

  const getLocalizedDescription = (description: any) => {
    if (typeof description === 'string') return description
    return description?.en || description?.es || description?.fr || description?.ar || ''
  }

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM yyyy')
  }

  const getAgendaTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'global': 'Global Agenda',
      'regional': 'Regional Agenda',
      'community': 'Community Agenda',
      'annual': 'Annual Agenda',
      'quarterly': 'Quarterly Agenda',
      'meeting': 'Meeting Agenda',
      'action-plan': 'Action Plan',
      'strategy': 'Strategic Plan',
      'other': 'Other'
    }
    return labels[type] || type
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">
                  <Link
                    href={`/agendas/${hit.slug}`}
                    className="hover:underline text-primary"
                  >
                    {getLocalizedTitle(hit.title)}
                  </Link>
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getAgendaTypeLabel(hit.agendaType)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {hit.year}
                  </Badge>
                  {hit.featured && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {getLocalizedDescription(hit.description) && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {getLocalizedDescription(hit.description)}
              </p>
            )}

            <div className="flex items-center gap-4 mb-3">
              {/* Publication Date */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatDate(hit.publishDate)}
                </span>
              </div>

              {/* Download Count */}
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {hit.totalDownloadCount.toLocaleString()} downloads
                </span>
              </div>
            </div>

            {/* Organizations */}
            {hit.organizations && hit.organizations.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {hit.organizations.slice(0, 2).map((org, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {org}
                    </Badge>
                  ))}
                  {hit.organizations.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{hit.organizations.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {hit.tags && hit.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hit.tags.slice(0, 5).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {hit.tags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{hit.tags.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NewsResult({ hit }: { hit: NewsSearchRecord }) {
  const getLocalizedTitle = (title: any) => {
    if (typeof title === 'string') return title
    return title?.en || title?.es || title?.fr || title?.ar || 'Untitled'
  }

  const getLocalizedExcerpt = (excerpt: any) => {
    if (typeof excerpt === 'string') return excerpt
    return excerpt?.en || excerpt?.es || excerpt?.fr || excerpt?.ar || ''
  }

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, yyyy')
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">
                  <Link
                    href={`/news/${hit.slug}`}
                    className="hover:underline text-primary"
                  >
                    {getLocalizedTitle(hit.title)}
                  </Link>
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    By {hit.author.name}
                  </span>
                  {hit.featured && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {getLocalizedExcerpt(hit.excerpt) && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {getLocalizedExcerpt(hit.excerpt)}
              </p>
            )}

            {/* Publication Date */}
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatDate(hit.publishedAt)}
              </span>
            </div>

            {/* Location */}
            {(hit.location?.city || hit.location?.country) && (
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {[hit.location.city, hit.location.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {/* Organizations */}
            {hit.organizations && hit.organizations.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {hit.organizations.slice(0, 2).map((org, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {org}
                    </Badge>
                  ))}
                  {hit.organizations.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{hit.organizations.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Projects */}
            {hit.projects && hit.projects.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {hit.projects.slice(0, 2).map((project, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {project}
                    </Badge>
                  ))}
                  {hit.projects.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{hit.projects.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {hit.tags && hit.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hit.tags.slice(0, 5).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {hit.tags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{hit.tags.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SearchPagination() {
  const { pages, currentRefinement, isFirstPage, isLastPage, refine } = usePagination()

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

export default function ContentSearchResults({ type }: ContentSearchResultsProps) {
  const { hits } = useHits()
  const t = useTranslations('search')

  if (hits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2">{t('noResults')}</div>
        <p className="text-sm text-muted-foreground">
          {type === 'case-studies' && 'Try different keywords or check back later for new case studies.'}
          {type === 'agendas' && 'Try different keywords or check back later for new agendas.'}
          {type === 'news' && 'Try different keywords or check back later for new news posts.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-4">
        {type === 'case-studies' && hits.map((hit) => (
          <CaseStudyResult key={hit.objectID} hit={hit as unknown as CaseStudySearchRecord} />
        ))}
        {type === 'agendas' && hits.map((hit) => (
          <AgendaResult key={hit.objectID} hit={hit as unknown as AgendaSearchRecord} />
        ))}
        {type === 'news' && hits.map((hit) => (
          <NewsResult key={hit.objectID} hit={hit as unknown as NewsSearchRecord} />
        ))}
      </div>

      <SearchPagination />
    </div>
  )
}