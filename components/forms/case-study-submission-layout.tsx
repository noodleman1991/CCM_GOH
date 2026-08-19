"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from 'next-intl'
import { useCaseStudyStore } from "@/stores/case-study-store"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { ChevronRight, Globe, FileText, Users, MapPin, Calendar, Tag, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import CaseStudyForm from "./case-study-form"
import { ReviewContext } from "./review-context"
import CaseStudyReview from "./case-study-review"

interface Section {
    id: string
    /** i18n key under `caseStudyForm.sections` — resolved with t() in the component. */
    titleKey: string
    icon: React.ReactNode
    required?: boolean
}

const sections: Section[] = [
    { id: "basic-info", titleKey: "basicInfo", icon: <FileText className="w-4 h-4" />, required: true },
    { id: "content", titleKey: "content", icon: <FileText className="w-4 h-4" />, required: true },
    { id: "authors", titleKey: "authors", icon: <Users className="w-4 h-4" />, required: true },
    { id: "classification", titleKey: "classification", icon: <Tag className="w-4 h-4" />, required: true },
    { id: "location", titleKey: "location", icon: <MapPin className="w-4 h-4" /> },
    { id: "timeline", titleKey: "timeline", icon: <Calendar className="w-4 h-4" /> },
]

const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
]

interface CaseStudySubmissionLayoutProps {
    availableTags: Array<{
        _id: string
        label: Record<string, string>
        value: { current: string }
    }>
    regionalCommunities: Array<{
        _id: string
        name: Record<string, string>
        slug: { current: string }
    }>
    locale: string
    userId: string
    workspaceId?: string | null
    editDoc?: (Record<string, unknown> & { _sanityId: string }) | null
}

export default function CaseStudySubmissionLayout({
                                                      availableTags,
                                                      regionalCommunities,
                                                      locale,
                                                      userId,
                                                      workspaceId,
                                                      editDoc
                                                  }: CaseStudySubmissionLayoutProps) {
    const t = useTranslations('caseStudySubmission')
    const [activeSection, setActiveSection] = useState("basic-info")

    const {
        currentStep,
        currentLanguage,
        setCurrentLanguage
    } = useCaseStudyStore()

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

    // Update the active section as the user scrolls. Uses IntersectionObserver
    // rather than window.scrollY so it works regardless of which element owns
    // the scroll (the page scroll lives on the sidebar inset, not the window).
    useEffect(() => {
        if (currentStep !== 'form') return

        // Track each section's intersection ratio; the most-visible one wins.
        const ratios = new Map<string, number>()
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const id = entry.target.getAttribute('data-section-id')
                    if (id) ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0)
                }
                let best: string | null = null
                let bestRatio = 0
                for (const section of sections) {
                    const r = ratios.get(section.id) ?? 0
                    if (r > bestRatio) {
                        bestRatio = r
                        best = section.id
                    }
                }
                if (best) setActiveSection(best)
            },
            // Bias toward the section near the top of the viewport.
            { rootMargin: '-80px 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
        )

        for (const section of sections) {
            const element = sectionRefs.current[section.id]
            if (element) {
                element.setAttribute('data-section-id', section.id)
                observer.observe(element)
            }
        }

        return () => observer.disconnect()
    }, [currentStep])

    const scrollToSection = (sectionId: string) => {
        const element = sectionRefs.current[sectionId]
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            })
        }
    }

    // Show review component when in review step
    if (currentStep === 'review') {
        return (
            <CaseStudyReview
                availableTags={availableTags}
                userId={userId}
            />
        )
    }

    return (
        <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
                {/*<div className="mb-8">*/}
                {/*</div>*/}

                {editDoc?._review != null && (
                    <div className="mb-6">
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
                />
            </div>
        </div>
    )
}
