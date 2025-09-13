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
import CaseStudyReview from "./case-study-review"

interface Section {
    id: string
    title: string
    icon: React.ReactNode
    required?: boolean
}

const sections: Section[] = [
    { id: "basic-info", title: "Basic Information", icon: <FileText className="w-4 h-4" />, required: true },
    { id: "content", title: "Content & Details", icon: <FileText className="w-4 h-4" />, required: true },
    { id: "authors", title: "Authors & Contributors", icon: <Users className="w-4 h-4" />, required: true },
    { id: "classification", title: "Tags & Classification", icon: <Tag className="w-4 h-4" />, required: true },
    { id: "location", title: "Study Location", icon: <MapPin className="w-4 h-4" /> },
    { id: "timeline", title: "Study Period", icon: <Calendar className="w-4 h-4" /> },
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
        title: Record<string, string>
        value: { current: string }
    }>
    locale: string
    userId: string
}

export default function CaseStudySubmissionLayout({
                                                      availableTags,
                                                      locale,
                                                      userId
                                                  }: CaseStudySubmissionLayoutProps) {
    const t = useTranslations('caseStudySubmission')
    const [activeSection, setActiveSection] = useState("basic-info")

    const {
        currentStep,
        currentLanguage,
        setCurrentLanguage
    } = useCaseStudyStore()

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

    // Handle scroll to update active section (only for form step)
    useEffect(() => {
        if (currentStep !== 'form') return

        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100

            for (const section of sections) {
                const element = sectionRefs.current[section.id]
                if (element) {
                    const { offsetTop, offsetHeight } = element
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section.id)
                        break
                    }
                }
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
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
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            <div className="flex items-center gap-2">
                                                <span>{lang.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
                        <p className="text-xl text-muted-foreground">{t('description')}</p>
                        <p className="text-base text-muted-foreground">
                            🌍 Submit your case study in any language you prefer. We kindly ask for titles and excerpts in all four languages to help our global community discover your research.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="outline" className="gap-1">
                            <FileText className="w-3 h-3" />
                            Research Documentation
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <Users className="w-3 h-3" />
                            Collaborative Submission
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <Globe className="w-3 h-3" />
                            Multilingual Support
                        </Badge>
                    </div>
                </div>

                {/* Form Component?? */}
                <CaseStudyForm
                    locale = {'en'}
                    userId={userId}
                />
            </div>

            {/* Navigation Sidebar - Only show for form step */}
            <div className="w-64 shrink-0">
                <div className="sticky top-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                On this page
                            </CardTitle>
                        </CardHeader>
                        <div className="px-6 pb-6">
                            <nav className="space-y-1">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={cn(
                                            "flex items-center gap-3 w-full text-left py-2 px-3 rounded-md text-sm transition-colors",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            activeSection === section.id
                                                ? "bg-accent text-accent-foreground font-medium"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {section.icon}
                                        <span className="flex-1">{section.title}</span>
                                        {section.required && (
                                            <Badge variant="secondary" className="text-xs">
                                                Required
                                            </Badge>
                                        )}
                                        <ChevronRight
                                            className={cn(
                                                "w-4 h-4 transition-transform",
                                                activeSection === section.id ? "rotate-90" : ""
                                            )}
                                        />
                                    </button>
                                ))}
                            </nav>

                            <div className="mt-6 pt-6 border-t">
                                <div className="space-y-3">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Multilingual Platform
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-xs">EN</span>
                                        <span className="text-xs">ES</span>
                                        <span className="text-xs">FR</span>
                                        <span className="text-xs">AR</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Submit in any language. Titles & excerpts needed in all languages for global reach.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <div className="space-y-3">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Submission Status
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                        <span className="text-sm text-muted-foreground">Draft</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Your case study will be reviewed by our editorial team before publication.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
