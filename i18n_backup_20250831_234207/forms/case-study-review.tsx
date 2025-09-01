// File: components/forms/case-study-review.t"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { useCaseStudyStore } from "@/stores/case-study-store"
import { toast } from "sonner"
import {
    Loader2,
    ArrowLeft,
    Send,
    Globe,
    Users,
    MapPin,
    Calendar,
    Tag,
    Building,
    FileText,
    Image as ImageIcon,
    CheckCircle2,
    AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CaseStudyReviewProps {
    availableTags: Array<{
        _id: string
        title: Record<string, string>
        value: { current: string }
    }>
    userId: string
}

const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
] as const

export default function CaseStudyReview({ availableTags, userId }: CaseStudyReviewProps) {
    const t = useTranslations('caseStudyForm')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        formData,
        setCurrentStep,
        resetForm,
        getValidationErrors,
        isFormValid
    } = useCaseStudyStore()

    const validationErrors = getValidationErrors()
    const canSubmit = isFormValid()

    const handleBackToForm = () => {
        setCurrentStep('form')
    }

    const handleSubmit = async () => {
        if (!canSubmit) {
            toast.error("Please fix the validation errors before submitting")
            return
        }

        setIsSubmitting(true)

        try {
            const submitFormData = new FormData()
            submitFormData.append("data", JSON.stringify({
                ...formData,
                submittedBy: userId,
                submittedAt: new Date().toISOString(),
            }))

            if (formData.image) {
                submitFormData.append("image", formData.image)
            }

            const response = await fetch("/api/case-studies/submit", {
                method: "POST",
                body: submitFormData,
            })

            if (!response.ok) {
                throw new Error("Failed to submit case study")
            }

            const result = await response.json()

            toast.success(t('messages.submitSuccess'))
            resetForm()

            // Optionally redirect or show success state
            // router.push(`/case-studies/${result.slug}?submitted=true`)

        } catch (error) {
            console.error("Submission error:", error)
            toast.error(t('messages.submitError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const getSelectedTagsInfo = () => {
        return formData.tags.map(tagId => {
            const tag = availableTags.find(t => t._id === tagId)
            return tag ? tag.title.en || tag.value.current : tagId
        })
    }

    const getContentLanguages = () => {
        return languages.filter(lang =>
            formData.content[lang.code] && formData.content[lang.code]!.length >= 200
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Review Your Submission</h1>
                    <p className="text-muted-foreground mt-1">
                        Please review all details before submitting your case study
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleBackToForm}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Edit
                </Button>
            </div>

            {/* Validation Errors */}
            {!canSubmit && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-1">
                            <p className="font-medium">Please fix the following issues:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {validationErrors.map((error, index) => (
                                    <li key={index} className="text-sm">{error}</li>
                                ))}
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Validation Success */}
            {canSubmit && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                        Your case study is ready to submit! All required fields have been completed.
                    </AlertDescription>
                </Alert>
            )}

            {/* Title Preview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        <CardTitle>Multilingual Titles</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {languages.map((lang) => (
                            <div key={lang.code} className="flex items-start gap-3">
                                <Badge variant="outline" className="shrink-0">
                                    {lang.flag} {lang.label}
                                </Badge>
                                <div className="flex-1">
                                    <p className="font-medium">{formData.title[lang.code] || 'Not provided'}</p>
                                    {formData.subtitle[lang.code] && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {formData.subtitle[lang.code]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Excerpts */}
            <Card>
                <CardHeader>
                    <CardTitle>Excerpts (All Languages)</CardTitle>
                    <CardDescription>
                        These summaries will help researchers discover your work
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="en" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            {languages.map((lang) => (
                                <TabsTrigger key={lang.code} value={lang.code}>
                                    {lang.flag} {lang.code.toUpperCase()}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {languages.map((lang) => (
                            <TabsContent key={lang.code} value={lang.code} className="mt-4">
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <p className="text-sm leading-relaxed">
                                        {formData.excerpt[lang.code] || `No excerpt provided in ${lang.label}`}
                                    </p>
                                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                        <span>{lang.label}</span>
                                        <span>{formData.excerpt[lang.code]?.length || 0} characters</span>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>

            {/* Content Languages */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        <CardTitle>Case Study Content</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Available in:</span>
                            {getContentLanguages().map((lang) => (
                                <Badge key={lang.code} variant="secondary">
                                    {lang.flag} {lang.label}
                                </Badge>
                            ))}
                        </div>

                        {getContentLanguages().length > 0 ? (
                            <Tabs defaultValue={getContentLanguages()[0]?.code} className="w-full">
                                <TabsList>
                                    {getContentLanguages().map((lang) => (
                                        <TabsTrigger key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {getContentLanguages().map((lang) => (
                                    <TabsContent key={lang.code} value={lang.code} className="mt-4">
                                        <div className="bg-muted/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {formData.content[lang.code]}
                                            </p>
                                            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground border-t pt-2">
                                                <span>{lang.label} content</span>
                                                <span>{formData.content[lang.code]?.length || 0} characters</span>
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        ) : (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No content provided. Please add detailed content in at least one language.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Authors & Metadata */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Authors */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            <CardTitle>Authors ({formData.authors.length})</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {formData.authors.map((author, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{author.name}</p>
                                        <p className="text-sm text-muted-foreground">{author.email}</p>
                                    </div>
                                    <Badge variant="outline">{author.role}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Metadata */}
                <Card>
                    <CardHeader>
                        <CardTitle>Study Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {formData.organizationName && (
                            <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{formData.organizationName}</span>
                            </div>
                        )}

                        {(formData.location.country || formData.location.city) && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                  {[formData.location.city, formData.location.region, formData.location.country]
                      .filter(Boolean)
                      .join(', ')}
                </span>
                            </div>
                        )}

                        {(formData.studyPeriod.startDate || formData.studyPeriod.endDate) && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                  {formData.studyPeriod.startDate && new Date(formData.studyPeriod.startDate).toLocaleDateString()}
                                    {formData.studyPeriod.startDate && formData.studyPeriod.endDate && ' - '}
                                    {formData.studyPeriod.endDate ? new Date(formData.studyPeriod.endDate).toLocaleDateString() :
                                        (formData.studyPeriod.startDate && ' - Ongoing')}
                </span>
                            </div>
                        )}

                        {formData.tags.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Tags ({formData.tags.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {getSelectedTagsInfo().map((tagName, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {tagName}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formData.imagePreview && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Featured Image</span>
                                </div>
                                <img
                                    src={formData.imagePreview}
                                    alt="Featured image preview"
                                    className="w-full h-32 object-cover rounded-lg border"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Submit Section */}
            <Card className="border-t-2 border-primary">
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">Ready to Submit?</h3>
                            <p className="text-muted-foreground">
                                {t('messages.reviewNote')}
                            </p>
                        </div>

                        <div className="flex justify-center gap-4">
                            <Button
                                variant="outline"
                                onClick={handleBackToForm}
                                disabled={isSubmitting}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Edit
                            </Button>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !canSubmit}
                                size="lg"
                                className="min-w-48"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? (
                                    "Submitting..."
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Case Study
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
