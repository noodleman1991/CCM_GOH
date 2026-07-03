import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { client } from "@/sanity/lib/client"
import CaseStudySubmissionLayout from "@/components/forms/case-study-submission-layout"

// Fetch available tags for the form
async function fetchAvailableTags() {
    return await client.fetch(`
    *[_type == "tag"] | order(label.en asc) {
      _id,
      label,
      value
    }
  `)
}

// Fetch available regional communities
async function fetchRegionalCommunities() {
    return await client.fetch(`
    *[_type == "regionalCommunity" && active == true] | order(name.en asc) {
      _id,
      name,
      slug
    }
  `)
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'caseStudySubmission' })
    return {
        title: t('pageTitle'),
        description: t('pageDescription')
    }
}

export default async function CaseStudySubmitPage({
                                                      params,
                                                      searchParams
                                                  }: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ workspace?: string }>
}) {
    const { locale } = await params
    const { workspace } = await searchParams
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in')
    }

    const [availableTags, regionalCommunities] = await Promise.all([
        fetchAvailableTags(),
        fetchRegionalCommunities()
    ])

    return (
        <div className="container max-w-7xl py-8">
            <CaseStudySubmissionLayout
                availableTags={availableTags}
                regionalCommunities={regionalCommunities}
                locale={locale}
                userId={userId}
                workspaceId={workspace ?? null}
            />
        </div>
    )
}
