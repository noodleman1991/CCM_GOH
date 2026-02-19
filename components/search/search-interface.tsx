'use client'

import { InstantSearchNext } from 'react-instantsearch-nextjs'
import { searchClient, ALGOLIA_INDICES } from '@/lib/algolia'
import { createSearchRouting } from '@/lib/search-routing'
import { CustomSearchBox } from './custom-search-box'
import { Configure } from 'react-instantsearch'
import SearchResults from './search-results'
import SearchFilters from './search-filters'
import ContentSearchResults from './content-search-results'
import ContentSearchFilters from './content-search-filters'
import SearchStats from './search-stats'
import { SearchHitsReporter } from './search-hits-reporter'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, BookOpen, Newspaper } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { SearchErrorBoundary } from './search-error-boundary'
import { useAuth } from '@clerk/nextjs'
import { useState, useCallback } from 'react'

export default function SearchInterface() {
  const t = useTranslations('search')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const { isSignedIn } = useAuth()

  // Track hits count per tab from InstantSearch contexts
  const [hitsCounts, setHitsCounts] = useState<{
    agendas: number | null
    news: number | null
    caseStudies: number | null
  }>({
    agendas: null,
    news: null,
    caseStudies: null
  })

  // Callbacks to update counts from each InstantSearch context
  const handleAgendasHits = useCallback((nbHits: number) => {
    setHitsCounts(prev => ({ ...prev, agendas: nbHits }))
  }, [])

  const handleNewsHits = useCallback((nbHits: number) => {
    setHitsCounts(prev => ({ ...prev, news: nbHits }))
  }, [])

  const handleCaseStudiesHits = useCallback((nbHits: number) => {
    setHitsCounts(prev => ({ ...prev, caseStudies: nbHits }))
  }, [])

  // Generate authentication-aware filters for content (agendas, news, case studies)
  const generateContentFilters = () => {
    const baseFilters = []

    if (!isSignedIn) {
      baseFilters.push('accessLevel:public')
    } else {
      baseFilters.push('accessLevel:public OR accessLevel:registered')
    }

    return baseFilters.join(' AND ')
  }

  // Generate privacy-aware filters for user search (CRITICAL for privacy)
  const generateUserFilters = () => {
    const baseFilters = ['isSearchable:true']  // Only users who opted in

    if (!isSignedIn) {
      // Unauthenticated users only see PUBLIC profiles
      baseFilters.push('profileVisibility:PUBLIC')
    } else {
      // Authenticated users see PUBLIC + MEMBERS profiles
      baseFilters.push('(profileVisibility:PUBLIC OR profileVisibility:MEMBERS)')
    }

    return baseFilters.join(' AND ')
  }
  
  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Tabs defaultValue="agendas" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-3xl mx-auto">
          {/* People Search - Commented out (functionality not ready yet)
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('people')}
            {!isLoading && counts.users > 0 && (
              <Badge variant="secondary" className="ms-1 text-xs">
                {counts.users}
              </Badge>
            )}
          </TabsTrigger>
          */}
          <TabsTrigger value="agendas" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('agendas')}
            {hitsCounts.agendas === null ? (
              <Badge variant="secondary" className="ms-1 text-xs animate-pulse">
                ...
              </Badge>
            ) : hitsCounts.agendas > 0 ? (
              <Badge variant="secondary" className="ms-1 text-xs">
                {hitsCounts.agendas}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            {t('news')}
            {hitsCounts.news === null ? (
              <Badge variant="secondary" className="ms-1 text-xs animate-pulse">
                ...
              </Badge>
            ) : hitsCounts.news > 0 ? (
              <Badge variant="secondary" className="ms-1 text-xs">
                {hitsCounts.news}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="case-studies" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t('caseStudies')}
            {hitsCounts.caseStudies === null ? (
              <Badge variant="secondary" className="ms-1 text-xs animate-pulse">
                ...
              </Badge>
            ) : hitsCounts.caseStudies > 0 ? (
              <Badge variant="secondary" className="ms-1 text-xs">
                {hitsCounts.caseStudies}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Users Search - Commented out (functionality not ready yet)
        <TabsContent value="users">
          <SearchErrorBoundary>
            <InstantSearchNext
              searchClient={searchClient}
              indexName={ALGOLIA_INDICES.USERS}
              routing={createSearchRouting(ALGOLIA_INDICES.USERS)}
              insights={true}
              future={{ preserveSharedStateOnUnmount: true }}
            >
            <Configure
              hitsPerPage={20}
              filters={generateUserFilters()}
              attributesToHighlight={['firstName', 'lastName', 'username', 'bio', 'organization']}
              attributesToSnippet={['bio:30']}
            />

            <div className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <SearchBox
                  placeholder={t('placeholder')}
                  classNames={{
                    root: 'w-full',
                    form: 'relative',
                    input: 'flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    submit: 'absolute end-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-accent hover:text-accent-foreground',
                    reset: 'absolute end-12 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-accent hover:text-accent-foreground',
                    loadingIndicator: 'absolute end-2 top-1/2 -translate-y-1/2',
                  }}
                  submitIconComponent={() => (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  resetIconComponent={() => (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                />
              </div>

              <SearchStats />

              <div className="flex gap-8">
                <div className="w-64 flex-shrink-0">
                  <SearchFilters />
                </div>

                <div className="flex-1">
                  <SearchResults type="users" />
                </div>
              </div>
            </div>
            </InstantSearchNext>
          </SearchErrorBoundary>
        </TabsContent>
        */}

        {/* Agendas Search */}
        <TabsContent value="agendas" forceMount className="data-[state=inactive]:hidden">
          <SearchErrorBoundary>
            <InstantSearchNext
              searchClient={searchClient}
              indexName={ALGOLIA_INDICES.AGENDAS}
              routing={createSearchRouting(ALGOLIA_INDICES.AGENDAS)}
              insights={true}
              future={{ preserveSharedStateOnUnmount: true }}
            >
              <Configure
                hitsPerPage={20}
                filters={generateContentFilters()}
                attributesToHighlight={['title.en', 'title.es', 'title.fr', 'title.ar', 'organizations', 'tags']}
                attributesToSnippet={['description.en:30', 'description.es:30', 'description.fr:30', 'description.ar:30']}
              />
              <SearchHitsReporter onHitsChange={handleAgendasHits} />

              <div className="space-y-6">
                {/* Search Box */}
                <div className="max-w-2xl mx-auto">
                  <CustomSearchBox placeholder={t('searchAgendas')} />
                </div>

                {/* Search Statistics */}
                <SearchStats />

                {/* Search Content */}
                <div className="flex gap-8">
                  {/* Filters Sidebar */}
                  <div className="w-64 flex-shrink-0">
                    <ContentSearchFilters type="agendas" />
                  </div>

                  {/* Results */}
                  <div className="flex-1">
                    <ContentSearchResults type="agendas" />
                  </div>
                </div>
              </div>
            </InstantSearchNext>
          </SearchErrorBoundary>
        </TabsContent>

        {/* News Search */}
        <TabsContent value="news" forceMount className="data-[state=inactive]:hidden">
          <SearchErrorBoundary>
            <InstantSearchNext
              searchClient={searchClient}
              indexName={ALGOLIA_INDICES.NEWS}
              routing={createSearchRouting(ALGOLIA_INDICES.NEWS)}
              insights={true}
              future={{ preserveSharedStateOnUnmount: true }}
            >
              <Configure
                hitsPerPage={20}
                filters={generateContentFilters()}
                attributesToHighlight={['title.en', 'title.es', 'title.fr', 'title.ar', 'author.name', 'tags', 'organizations']}
                attributesToSnippet={['excerpt.en:30', 'excerpt.es:30', 'excerpt.fr:30', 'excerpt.ar:30']}
              />
              <SearchHitsReporter onHitsChange={handleNewsHits} />

              <div className="space-y-6">
                {/* Search Box */}
                <div className="max-w-2xl mx-auto">
                  <CustomSearchBox placeholder={t('searchNews')} />
                </div>

                {/* Search Statistics */}
                <SearchStats />

                {/* Search Content */}
                <div className="flex gap-8">
                  {/* Filters Sidebar */}
                  <div className="w-64 flex-shrink-0">
                    <ContentSearchFilters type="news" />
                  </div>

                  {/* Results */}
                  <div className="flex-1">
                    <ContentSearchResults type="news" />
                  </div>
                </div>
              </div>
            </InstantSearchNext>
          </SearchErrorBoundary>
        </TabsContent>

        {/* Case Studies Search */}
        <TabsContent value="case-studies" forceMount className="data-[state=inactive]:hidden">
          <SearchErrorBoundary>
            <InstantSearchNext
              searchClient={searchClient}
              indexName={ALGOLIA_INDICES.CASE_STUDIES}
              routing={createSearchRouting(ALGOLIA_INDICES.CASE_STUDIES)}
              insights={true}
              future={{ preserveSharedStateOnUnmount: true }}
            >
              <Configure
                hitsPerPage={20}
                filters="status:approved AND accessLevel:public"
                attributesToHighlight={['title.en', 'title.es', 'title.fr', 'title.ar', 'authors.name', 'tags']}
                attributesToSnippet={['excerpt.en:30', 'excerpt.es:30', 'excerpt.fr:30', 'excerpt.ar:30']}
              />
              <SearchHitsReporter onHitsChange={handleCaseStudiesHits} />

              <div className="space-y-6">
                {/* Search Box */}
                <div className="max-w-2xl mx-auto">
                  <CustomSearchBox placeholder={t('searchCaseStudies')} />
                </div>

                {/* Search Statistics */}
                <SearchStats />

                {/* Search Content */}
                <div className="flex gap-8">
                  {/* Filters Sidebar */}
                  <div className="w-64 flex-shrink-0">
                    <ContentSearchFilters type="case-studies" />
                  </div>

                  {/* Results */}
                  <div className="flex-1">
                    <ContentSearchResults type="case-studies" />
                  </div>
                </div>
              </div>
            </InstantSearchNext>
          </SearchErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  )
}
