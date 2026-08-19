'use client'

import { useHits, usePagination } from 'react-instantsearch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Briefcase, Calendar, Download, Star, Building2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { CaseStudySearchRecord, AgendaSearchRecord, NewsSearchRecord } from '@/lib/algolia'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { useTranslations, useLocale } from 'next-intl'
import { format, type Locale } from 'date-fns'
import { es as esLocale, fr as frLocale, ar as arLocale } from 'date-fns/locale'
import { getLocalizedTitle, getLocalizedExcerpt, getLocalizedText } from '@/lib/localization-utils'

const DATE_LOCALES: Record<string, Locale> = { es: esLocale, fr: frLocale, ar: arLocale }

interface ContentSearchResultsProps {
  type: 'case-studies' | 'agendas' | 'news'
}

function CaseStudyResult({ hit }: { hit: CaseStudySearchRecord }) {
  const locale = useLocale()
  const t = useTranslations('search')

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-ccm-water" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg" dir="auto">
                  <Link
                    href={`/${locale}/research-and-action/case-studies/${hit.slug}`}
                    className="hover:underline text-primary"
                  >
                    {getLocalizedTitle(hit.title, locale)}
                  </Link>
                </h3>
                {hit.featured && (
                  <Badge variant="secondary" className="mt-1">
                    <Star className="h-3 w-3 me-1" />
                    {t('featured')}
                  </Badge>
                )}
              </div>
            </div>

            {getLocalizedExcerpt(hit.excerpt, locale) && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2" dir="auto">
                {getLocalizedExcerpt(hit.excerpt, locale)}
              </p>
            )}

            {/* Authors */}
            {hit.authors && hit.authors.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">{t('authorsLabel')}</span>
                <span className="text-sm text-muted-foreground">
                  <bdi>{hit.authors.slice(0, 3).map(author => author.name).join(', ')}</bdi>
                  {hit.authors.length > 3 && <> {t('more', { count: hit.authors.length - 3 })}</>}
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
                <span className="text-sm text-muted-foreground" dir="auto">
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
                      <bdi>{org}</bdi>
                    </Badge>
                  ))}
                  {hit.organizations.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      {t('more', { count: hit.organizations.length - 2 })}
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
                    <bdi>{tag}</bdi>
                  </Badge>
                ))}
                {hit.tags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    {t('more', { count: hit.tags.length - 5 })}
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

const AGENDA_TYPE_KEYS: Record<string, string> = {
  'global': 'global',
  'regional': 'regional',
  'community': 'community',
  'annual': 'annual',
  'quarterly': 'quarterly',
  'meeting': 'meeting',
  'action-plan': 'actionPlan',
  'strategy': 'strategy',
  'other': 'other'
}

function AgendaResult({ hit }: { hit: AgendaSearchRecord }) {
  const locale = useLocale()
  const t = useTranslations('search')

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM yyyy', { locale: DATE_LOCALES[locale] })
  }

  const getAgendaTypeLabel = (type: string) => {
    const key = AGENDA_TYPE_KEYS[type]
    return key ? t(`agendaTypes.${key}`) : type
  }

  // Get download URL - prefer user's locale, fallback to English, then first available
  const getDownloadUrl = () => {
    if (!hit.files || hit.files.length === 0) return null

    const localizedFile = hit.files.find(f => f.language === locale)
    const englishFile = hit.files.find(f => f.language === 'en')
    const file = localizedFile || englishFile || hit.files[0]

    if (!file?.url) return null
    return `${file.url}?dl=${file.filename || ''}`
  }

  const handleDownloadClick = () => {
    const downloadUrl = getDownloadUrl()
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  const downloadUrl = getDownloadUrl()

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
                <h3 className="font-semibold text-lg" dir="auto">
                  {downloadUrl ? (
                    <button
                      onClick={handleDownloadClick}
                      className="hover:underline text-primary text-start"
                    >
                      {getLocalizedTitle(hit.title, locale)}
                    </button>
                  ) : (
                    <span className="text-primary">
                      {getLocalizedTitle(hit.title, locale)}
                    </span>
                  )}
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
                      <Star className="h-3 w-3 me-1" />
                      {t('featured')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Subtitle */}
            {getLocalizedText(hit.subtitle, locale, '') && (
              <p className="text-sm font-medium text-muted-foreground mb-2" dir="auto">
                {getLocalizedText(hit.subtitle, locale, '')}
              </p>
            )}

            {/* Description */}
            {getLocalizedText(hit.description, locale, '') && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2" dir="auto">
                {getLocalizedText(hit.description, locale, '')}
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
                  {t('downloads', { count: hit.totalDownloadCount })}
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
                      <bdi>{org}</bdi>
                    </Badge>
                  ))}
                  {hit.organizations.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      {t('more', { count: hit.organizations.length - 2 })}
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
                    <bdi>{tag}</bdi>
                  </Badge>
                ))}
                {hit.tags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    {t('more', { count: hit.tags.length - 5 })}
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
  const locale = useLocale()
  const t = useTranslations('search')

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, yyyy', { locale: DATE_LOCALES[locale] })
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
                <h3 className="font-semibold text-lg" dir="auto">
                  <Link
                    href={`/${locale}/news/${hit.slug}`}
                    className="hover:underline text-primary"
                  >
                    {getLocalizedTitle(hit.title, locale)}
                  </Link>
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {t('byAuthor', { name: hit.author.name })}
                  </span>
                  {hit.featured && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 me-1" />
                      {t('featured')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Subtitle */}
            {getLocalizedText(hit.subtitle, locale, '') && (
              <p className="text-sm font-medium text-muted-foreground mb-2" dir="auto">
                {getLocalizedText(hit.subtitle, locale, '')}
              </p>
            )}

            {/* Excerpt */}
            {getLocalizedExcerpt(hit.excerpt, locale) && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2" dir="auto">
                {getLocalizedExcerpt(hit.excerpt, locale)}
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
                <span className="text-sm text-muted-foreground" dir="auto">
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
                      <bdi>{org}</bdi>
                    </Badge>
                  ))}
                  {hit.organizations.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      {t('more', { count: hit.organizations.length - 2 })}
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
                      <bdi>{project}</bdi>
                    </Badge>
                  ))}
                  {hit.projects.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      {t('more', { count: hit.projects.length - 2 })}
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
                    <bdi>{tag}</bdi>
                  </Badge>
                ))}
                {hit.tags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    {t('more', { count: hit.tags.length - 5 })}
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
          {type === 'case-studies' && t('emptyCaseStudies')}
          {type === 'agendas' && t('emptyAgendas')}
          {type === 'news' && t('emptyNews')}
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
