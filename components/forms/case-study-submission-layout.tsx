"use client"

import CaseStudyForm from "./case-study-form"
import { ReviewContext } from "./review-context"

interface CaseStudySubmissionLayoutProps {
    availableTags: Array<{
        _id: string
        label: Record<string, string>
        value: { current: string }
        /** Tag group (`topic` = theme, `audience`, …): drives the picker's groups and the main theme. */
        category?: string | null
    }>
    regionalCommunities: Array<{
        _id: string
        name: Record<string, string>
        slug: { current: string }
        /** Fixed-7 region code, for suggesting the community from a picked place. */
        region?: string | null
    }>
    locale: string
    userId: string
    workspaceId?: string | null
    editDoc?: (Record<string, unknown> & { _sanityId: string }) | null
    /** A specific draft to resume (dashboard Continue); otherwise the latest. */
    draftId?: string | null
}

export default function CaseStudySubmissionLayout({
                                                      availableTags,
                                                      regionalCommunities,
                                                      locale,
                                                      userId,
                                                      workspaceId,
                                                      editDoc,
                                                      draftId
                                                  }: CaseStudySubmissionLayoutProps) {
    return (
        <div className="min-w-0">
                {editDoc?._review != null && (
                    <div className="mx-auto mb-6 max-w-6xl">
                        <ReviewContext
                            status={(editDoc._review as { status?: string }).status}
                            reviewNotes={(editDoc._review as { reviewNotes?: string | null }).reviewNotes}
                        />
                    </div>
                )}

                {/* Form Component */}
                <CaseStudyForm
                    locale={locale}
                    userId={userId}
                    availableTags={availableTags}
                    regionalCommunities={regionalCommunities}
                    workspaceId={workspaceId}
                    editDoc={editDoc}
                    draftId={draftId}
                />
        </div>
    )
}
