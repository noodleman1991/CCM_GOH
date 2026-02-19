"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useCaseStudyStore } from '@/stores/case-study-store'
import type { PortableTextBlock } from '@portabletext/types'
import { client } from '@/sanity/lib/client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'

import {
    Globe,
    FileText,
    Users,
    Calendar,
    MapPin,
    Tag,
    Building,
    Upload,
    Plus,
    X,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react'

const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸', rtl: false },
    { code: 'es', label: 'Español', flag: '🇪🇸', rtl: false },
    { code: 'fr', label: 'Français', flag: '🇫🇷', rtl: false },
    { code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true },
] as const

const topicOptions = [
    { label: "Climate Change & Environment", value: "climate-environment" },
    { label: "Mental Health & Wellbeing", value: "mental-health" },
    { label: "Community Health & Social Care", value: "community-health" },
    { label: "Youth Engagement & Education", value: "youth-education" },
    { label: "Policy Research & Governance", value: "policy-governance" },
    { label: "Technology & Innovation", value: "technology-innovation" },
    { label: "Economic Development", value: "economic-development" },
    { label: "Cultural Heritage & Arts", value: "cultural-arts" },
    { label: "Food Security & Agriculture", value: "food-agriculture" },
    { label: "Urban Planning & Infrastructure", value: "urban-planning" },
    { label: "Human Rights & Social Justice", value: "human-rights" },
    { label: "Migration & Displacement", value: "migration" },
    { label: "Gender Equality", value: "gender-equality" },
    { label: "Disaster Risk & Resilience", value: "disaster-resilience" },
    { label: "Digital Inclusion", value: "digital-inclusion" },
    { label: "Other", value: "other" },
]

const authorRoles = [
    { label: "Lead Author", value: "lead" },
    { label: "Co-Author", value: "coauthor" },
    { label: "Contributor", value: "contributor" },
    { label: "Advisor", value: "advisor" },
]

// Helper function to convert text to basic PortableText blocks
const convertTextToPortableText = (text: string): PortableTextBlock[] => {
    if (!text.trim()) return []

    const paragraphs = text.split('\n\n').filter(p => p.trim())

    return paragraphs.map((paragraph, index) => ({
        _type: 'block',
        _key: `block-${index}`,
        style: 'normal',
        children: [
            {
                _type: 'span',
                _key: `span-${index}`,
                text: paragraph.trim(),
                marks: []
            }
        ],
        markDefs: []
    }))
}

interface EnhancedCaseStudyFormProps {
    availableTags: Array<{
        _id: string
        title: Record<string, string>
        value: { current: string }
    }>
    userId: string
}

export default function EnhancedCaseStudyForm({ availableTags, userId }: EnhancedCaseStudyFormProps) {
    const t = useTranslations('caseStudyForm')
    const [currentLanguage, setCurrentLanguage] = useState('en')
    const [expandedSections, setExpandedSections] = useState<string[]>(['title'])
    const [availableOrganizations, setAvailableOrganizations] = useState<Array<{ _id: string, name: string }>>([])
    const [availableCommunities, setAvailableCommunities] = useState<Array<{ _id: string, name: string }>>([])

    const {
        formData,
        updateField,
        setSelectedTags,
        addAuthor,
        removeAuthor,
        updateAuthor,
        setImageFile,
        saveDraft,
        loadDraft,
        isDraftSaving,
        lastSaved,
        hasPendingChanges,
        markChanges,
        setCurrentStep
    } = useCaseStudyStore()

    // Auto-save functionality
    const autoSave = useCallback(async () => {
        if (hasPendingChanges && userId) {
            try {
                await saveDraft(userId)
                toast.success('Draft saved automatically')
            } catch (error) {
                console.error('Auto-save failed:', error)
            }
        }
    }, [hasPendingChanges, userId, saveDraft])

    // Load draft on mount
    useEffect(() => {
        if (userId) {
            loadDraft(userId).then((loaded) => {
                if (loaded) {
                    toast.success('Draft restored from previous session')
                }
            })
        }
    }, [userId, loadDraft])

    // Auto-save timer
    useEffect(() => {
        const interval = setInterval(autoSave, 30000) // Auto-save every 30 seconds
        return () => clearInterval(interval)
    }, [autoSave])

    // Load organizations and communities
    useEffect(() => {
        const loadData = async () => {
            try {
                const [orgs, communities] = await Promise.all([
                    client.fetch(`*[_type == "organization"]{_id, name}`),
                    client.fetch(`*[_type == "regionalCommunity"]{_id, name}`)
                ])
                setAvailableOrganizations(orgs)
                setAvailableCommunities(communities)
            } catch (error) {
                console.error('Failed to load data:', error)
            }
        }
        loadData()
    }, [])

    const handleManualSave = async () => {
        if (userId) {
            try {
                await saveDraft(userId)
                toast.success('Draft saved successfully')
            } catch (error) {
                toast.error('Failed to save draft')
            }
        }
    }

    const handleContentChange = (text: string) => {
        const portableTextBlocks = convertTextToPortableText(text)
        updateField('content', portableTextBlocks)
    }

    // Helper to get content as plain text for display
    const getContentAsText = (): string => {
        if (!formData.content) return ''
        return formData.content
            .map(block => {
                if (block._type === 'block' && block.children) {
                    return block.children.map((child: any) => child.text).join('')
                }
                return ''
            })
            .join('\n\n')
    }

    const updateLocalizedField = (field: 'title' | 'excerpt', lang: string, value: string) => {
        const currentValue = formData[field]
        updateField(field, {
            ...currentValue,
            [lang]: value
        })
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImageFile(file, e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const addNewAuthor = () => {
        addAuthor({
            name: '',
            email: '',
            role: 'coauthor',
            userId: ''
        })
    }

    const handleTagSelect = (tagId: string) => {
        const currentTags = formData.tags || []
        const newTags = currentTags.includes(tagId)
            ? currentTags.filter(id => id !== tagId)
            : [...currentTags, tagId]
        setSelectedTags(newTags)
    }

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        )
    }

    const proceedToReview = () => {
        setCurrentStep('review')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header with Save Status */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Submit Case Study</h1>
                    <p className="text-muted-foreground">
                        Share your research and insights with the community
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastSaved && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Saved {lastSaved.toLocaleTimeString()}
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleManualSave}
                        disabled={isDraftSaving || !hasPendingChanges}
                        className="flex items-center gap-2"
                    >
                        {isDraftSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Draft
                    </Button>
                </div>
            </div>

            {/* Language Selector */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        <CardTitle>Language</CardTitle>
                    </div>
                    <CardDescription>
                        Choose the language for editing content
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {languages.map((lang) => (
                            <Button
                                key={lang.code}
                                variant={currentLanguage === lang.code ? "default" : "outline"}
                                onClick={() => setCurrentLanguage(lang.code)}
                                className="flex items-center gap-2"
                            >
                                <span>{lang.flag}</span>
                                {lang.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Form Sections */}
            <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections}>

                {/* Title Section */}
                <AccordionItem value="title">
                    <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Title & Basic Information
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`title-${currentLanguage}`}>
                                        Title ({languages.find(l => l.code === currentLanguage)?.label})
                                        {currentLanguage === 'en' && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                    <Input
                                        id={`title-${currentLanguage}`}
                                        value={formData.title[currentLanguage as keyof typeof formData.title] || ''}
                                        onChange={(e) => updateLocalizedField('title', currentLanguage, e.target.value)}
                                        placeholder="Enter case study title..."
                                        dir={languages.find(l => l.code === currentLanguage)?.rtl ? 'rtl' : 'ltr'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`excerpt-${currentLanguage}`}>
                                        Brief Summary ({languages.find(l => l.code === currentLanguage)?.label})
                                        {currentLanguage === 'en' && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                    <Textarea
                                        id={`excerpt-${currentLanguage}`}
                                        value={formData.excerpt[currentLanguage as keyof typeof formData.excerpt] || ''}
                                        onChange={(e) => updateLocalizedField('excerpt', currentLanguage, e.target.value)}
                                        placeholder="Provide a brief summary of your case study (minimum 50 characters)..."
                                        rows={3}
                                        dir={languages.find(l => l.code === currentLanguage)?.rtl ? 'rtl' : 'ltr'}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        {(formData.excerpt[currentLanguage as keyof typeof formData.excerpt] || '').length} characters
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="topic">
                                        Topic/Domain <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.topic || ''}
                                        onValueChange={(value) => updateField('topic', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select primary topic..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {topicOptions.map((topic) => (
                                                <SelectItem key={topic.value} value={topic.value}>
                                                    {topic.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                {/* Content Section */}
                <AccordionItem value="content">
                    <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Case Study Content
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Card>
                            <CardHeader>
                                <CardTitle>Rich Text Content</CardTitle>
                                <CardDescription>
                                    Write your detailed case study content with formatting options
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Textarea
                                        value={getContentAsText()}
                                        onChange={(e) => handleContentChange(e.target.value)}
                                        placeholder="Start writing your case study content here...

Use double line breaks to create new paragraphs.

You can write detailed information about:
- Background and context
- Methodology used
- Key findings
- Conclusions and recommendations"
                                        className="min-h-[300px] resize-none"
                                        rows={15}
                                    />
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>Write in paragraphs separated by double line breaks</span>
                                        <span>{getContentAsText().length} characters</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                {/* Authors Section - Continue with remaining sections... */}

            </Accordion>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6">
                <Button
                    variant="outline"
                    onClick={handleManualSave}
                    disabled={isDraftSaving}
                    className="flex items-center gap-2"
                >
                    {isDraftSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save Draft
                </Button>

                <Button
                    onClick={proceedToReview}
                    className="flex items-center gap-2"
                >
                    Continue to Review
                    <CheckCircle className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}