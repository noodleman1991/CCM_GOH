import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { client } from "@/sanity/lib/client"
import UserSubmissionsDashboard from "@/components/dashboard/user-submissions-dashboard"
import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Fetch user's case studies and drafts
async function fetchUserSubmissions(userId: string) {
  return await client.fetch(`
    {
      "submissions": *[_type == "caseStudy" && submittedBy == $userId] | order(submittedAt desc) {
        _id,
        title,
        excerpt,
        topic,
        status,
        featured,
        "slug": slug.current,
        submittedAt,
        publishedAt,
        reviewNotes,
        "image": image.asset->url,
        authors,
        tags[]-> {
          _id,
          title,
          "value": value.current
        }
      },
      "drafts": *[_type == "caseStudyDraft" && userId == $userId] | order(lastSaved desc) {
        _id,
        title,
        excerpt,
        topic,
        lastSaved,
        formMetadata
      }
    }
  `, { userId })
}

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
  const [data, t] = await Promise.all([
    fetchUserSubmissions(userId),
    getTranslations({ locale, namespace: 'dashboard' })
  ])

  return (
    <UserSubmissionsDashboard
      submissions={data.submissions}
      drafts={data.drafts}
      locale={locale}
    />
  )
}