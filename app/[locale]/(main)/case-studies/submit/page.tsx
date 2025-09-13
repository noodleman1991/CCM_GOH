import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { client } from "@/sanity/lib/client"
import CaseStudySubmissionLayout from "@/components/forms/case-study-submission-layout"

// Fetch available tags for the form
async function fetchAvailableTags() {
    return await client.fetch(`
    *[_type == "tag"] | order(title.en asc) {
      _id,
      title,
      value
    }
  `)
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const t = await getTranslations('caseStudySubmission')
    return {
        title: t('pageTitle'),
        description: t('pageDescription')
    }
}

export default async function CaseStudySubmitPage({
                                                      params
                                                  }: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in')
    }

    const [availableTags] = await Promise.all([
        fetchAvailableTags()
    ])

    return (
        <div className="container max-w-7xl py-8">
            <CaseStudySubmissionLayout
                availableTags={availableTags}
                locale={locale}
                userId={userId}
            />
        </div>
    )
}
