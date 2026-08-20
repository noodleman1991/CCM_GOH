import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { fetchUserSubmissionsAndDrafts } from "@/sanity/lib/fetch"
import UserSubmissionsDashboard from "@/components/dashboard/user-submissions-dashboard"
import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"


function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: t('submissions.pageTitle'),
    description: t('submissions.pageDescription')
  }
}

export default async function UserSubmissionsPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="container max-w-7xl py-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <UserSubmissionsContent locale={locale} userId={userId} />
      </Suspense>
    </div>
  )
}

async function UserSubmissionsContent({ locale, userId }: { locale: string; userId: string }) {
  const data = await fetchUserSubmissionsAndDrafts({ userId })

  return (
    <UserSubmissionsDashboard
      submissions={data.submissions ?? []}
      drafts={data.drafts ?? []}
      locale={locale}
    />
  )
}