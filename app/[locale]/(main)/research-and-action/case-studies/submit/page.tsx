import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import CaseStudySubmissionLayout from "@/components/forms/case-study-submission-layout"
import { getAvailableCaseStudyTags, getActiveCaseStudyCommunities, loadEditableCaseStudy } from "@/lib/content/case-studies"

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
    searchParams: Promise<{ workspace?: string; edit?: string; draft?: string }>
}) {
    const { locale } = await params
    const { workspace, edit, draft } = await searchParams
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in')
    }

    const [availableTags, regionalCommunities] = await Promise.all([
        getAvailableCaseStudyTags(),
        getActiveCaseStudyCommunities()
    ])

    // X7 edit mode: load the author's own draft/pending doc into the form.
    // Authz: the submitter, or a member of a workspace this doc is an output of.
    let editDoc: (Record<string, unknown> & { _sanityId: string }) | null = null
    if (edit) {
        editDoc = await loadEditableCaseStudy(edit, userId)
        if (!editDoc) redirect('/research-and-action/case-studies/submit')
    }

    return (
        <div className="container max-w-7xl py-8">
            <CaseStudySubmissionLayout
                availableTags={availableTags as never}
                regionalCommunities={regionalCommunities as never}
                locale={locale}
                userId={userId}
                workspaceId={workspace ?? null}
                editDoc={editDoc}
                // Continue from the submissions dashboard: reopen this draft,
                // not the latest one. The form fetches it by id, owner-scoped.
                draftId={draft ?? null}
            />
        </div>
    )
}
