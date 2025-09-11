import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import SearchInterface from '@/components/search/search-interface'
import { Skeleton } from '@/components/ui/skeleton'

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations('search')
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  }
}

function SearchSkeleton() {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Tabs skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-96" />
        </div>
        
        {/* Search box skeleton */}
        <Skeleton className="h-12 w-full max-w-2xl mx-auto" />
        
        {/* Stats skeleton */}
        <Skeleton className="h-4 w-64" />
        
        {/* Filters and Results skeleton */}
        <div className="flex gap-8">
          <div className="w-64 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
          
          {/* Results skeleton */}
          <div className="flex-1 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function SearchPage() {
  const t = await getTranslations('search')

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('pageTitle')}</h1>
        <p className="text-muted-foreground">{t('pageDescription')}</p>
      </div>

      <Suspense fallback={<SearchSkeleton />}>
        <SearchInterface />
      </Suspense>
    </div>
  )
}