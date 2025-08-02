"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useUser } from "@clerk/nextjs"
import { useTranslations } from 'next-intl'
import { toast } from "sonner"
import {
    Loader2,
    Plus,
    X,
    Upload,
    FileText,
    Users,
    MapPin,
    Calendar,
    Tag,
    Globe
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const formSchema = z.object({
    title: z.object({
        en: z.string().min(1, "Title in English is required"),
        es: z.string().min(1, "Title in Spanish is required"),
        fr: z.string().min(1, "Title in French is required"),
        ar: z.string().min(1, "Title in Arabic is required"),
    }),
    subtitle: z.object({
        en: z.string().optional(),
        es: z.string().optional(),
        fr: z.string().optional(),
        ar: z.string().optional(),
    }),
    excerpt: z.object({
        en: z.string().min(50, "Excerpt in English must be at least 50 characters"),
        es: z.string().min(50, "Excerpt in Spanish must be at least 50 characters"),
        fr: z.string().min(50, "Excerpt in French must be at least 50 characters"),
        ar: z.string().min(50, "Excerpt in Arabic must be at least 50 characters"),
    }),
    content: z.object({
        en: z.string().optional(),
        es: z.string().optional(),
        fr: z.string().optional(),
        ar: z.string().optional(),
    }).refine((content) => {
        // At least one language must have content with minimum 200 characters
        const hasValidContent = Object.values(content).some(text =>
            text && text.length >= 200
        );
        return hasValidContent;
    }, {
        message: "Please provide detailed content in at least one language (minimum 200 characters)"
    }),
    authors: z.array(z.object({
        name: z.string().min(1, "Author name is required"),
        email: z.string().email("Invalid email"),
        role: z.enum(["lead", "coauthor", "contributor", "advisor"]),
    })).min(1, "At least one author is required"),
    organizationName: z.string().optional(),
    tags: z.array(z.string()).min(1, "At least one tag is required"),
    studyPeriod: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
    location: z.object({
        country: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
    }),
    image: z.any().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CaseStudyFormProps {
    availableTags: Array<{
        _id: string
        title: Record<string, string>
        value: { current: string }
    }>
    currentLanguage: string
    sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>
    userId: string
}

const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸', required: true },
    { code: 'es', label: 'Español', flag: '🇪🇸', required: true },
    { code: 'fr', label: 'Français', flag: '🇫🇷', required: true },
    { code: 'ar', label: 'العربية', flag: '🇸🇦', required: true },
]

export default function CaseStudyForm({
                                          availableTags,
                                          currentLanguage,
                                          sectionRefs,
                                          userId
                                      }: CaseStudyFormProps) {
    const { user } = useUser()
    const t = useTranslations('caseStudyForm')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: { en: "", es: "", fr: "", ar: "" },
            subtitle: { en: "", es: "", fr: "", ar: "" },
            excerpt: { en: "", es: "", fr: "", ar: "" },
            content: { en: "", es: "", fr: "", ar: "" },
            authors: user ? [{
                name: user.fullName || "",
                email: user.emailAddresses[0]?.emailAddress || "",
                role: "lead" as const,
            }] : [],
            tags: [],
            studyPeriod: {},
            location: {},
        },
    })

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast.error("Please upload a valid image file (JPEG, PNG, or WebP)")
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error("Image size must be less than 10MB")
            return
        }

        setImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const addAuthor = () => {
        const currentAuthors = form.getValues("authors")
        form.setValue("authors", [
            ...currentAuthors,
            { name: "", email: "", role: "coauthor" as const }
        ])
    }

    const removeAuthor = (index: number) => {
        const currentAuthors = form.getValues("authors")
        form.setValue("authors", currentAuthors.filter((_, i) => i !== index))
    }

    const onSubmit = async (data: FormData) => {
        if (!user) {
            toast.error("You must be logged in to submit a case study")
            return
        }

        setIsSubmitting(true)

        try {
            const formData = new FormData()
            formData.append("data", JSON.stringify({
                ...data,
                tags: selectedTags,
                submittedBy: userId,
                submittedAt: new Date().toISOString(),
                authors: data.authors.map(author => ({
                    ...author,
                    userId: author.email === user.emailAddresses[0]?.emailAddress ? userId : undefined,
                })),
            }))

            if (imageFile) {
                formData.append("image", imageFile)
            }

            const response = await fetch("/api/case-studies/submit", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                throw new Error("Failed to submit case study")
            }

            toast.success("Case study submitted successfully! It will be reviewed by our team.")
            form.reset()
            setSelectedTags([])
            setImageFile(null)
            setImagePreview(null)
        } catch (error) {
            console.error("Submission error:", error)
            toast.error("Failed to submit case study. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const FormSection = ({
                             id,
                             title,
                             description,
                             icon,
                             children
                         }: {
        id: string
        title: string
        description?: string
        icon: React.ReactNode
        children: React.ReactNode
    }) => (
        <section
            ref={(el) => { sectionRefs.current[id] = el }}
            className="scroll-mt-24"
        >
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        {icon}
                        <div>
                            <CardTitle>{title}</CardTitle>
                            {description && <CardDescription>{description}</CardDescription>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {children}
                </CardContent>
            </Card>
        </section>
    )

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">

                {/* Basic Information */}
                <FormSection
                    id="basic-info"
                    title="Basic Information"
                    description="🌍 Our hub serves a global community in 4 languages. Please help us make your case study accessible by providing titles and excerpts in all languages."
                    icon={<FileText className="w-5 h-5" />}
                >
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start gap-3">
                                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                        Welcome to our multilingual community!
                                    </h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Our platform serves researchers worldwide in English, Spanish, French, and Arabic.
                                        You can write your full case study in any language you prefer, but we kindly ask for
                                        titles and excerpts in all four languages to help our global community discover your work.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Title (Required in All Languages)
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Help researchers worldwide find your work by providing your title in all four languages.
                            </p>
                            <div className="grid gap-4">
                                {languages.map((lang) => (
                                    <FormField
                                        key={`title-${lang.code}`}
                                        control={form.control}
                                        name={`title.${lang.code}` as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <span>{lang.flag}</span>
                                                    <span>{lang.label}</span>
                                                    <Badge variant="destructive" className="text-xs">Required</Badge>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={`Enter title in ${lang.label}`} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-4">Subtitle (Optional)</h4>
                            <div className="grid gap-4">
                                {languages.map((lang) => (
                                    <FormField
                                        key={`subtitle-${lang.code}`}
                                        control={form.control}
                                        name={`subtitle.${lang.code}` as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <span>{lang.flag}</span>
                                                    <span>{lang.label}</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={`Enter subtitle in ${lang.label}`} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div>
                            <h4 className="text-sm font-medium mb-4">Featured Image</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="file"
                                        accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Image
                                    </label>
                                    {imageFile && (
                                        <span className="text-sm text-muted-foreground">
                      {imageFile.name}
                    </span>
                                    )}
                                </div>
                                {imagePreview && (
                                    <div className="relative w-full max-w-md">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2"
                                            onClick={() => {
                                                setImageFile(null)
                                                setImagePreview(null)
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </FormSection>

                {/* Content & Details */}
                <FormSection
                    id="content"
                    title="Content & Details"
                    description="📝 Write your case study in your preferred language, and help us create excerpts for our multilingual community"
                    icon={<FileText className="w-5 h-5" />}
                >
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Excerpt (Required in All Languages)
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                These brief summaries will appear in search results and help researchers across all languages discover your work.
                            </p>
                            <div className="grid gap-4">
                                {languages.map((lang) => (
                                    <FormField
                                        key={`excerpt-${lang.code}`}
                                        control={form.control}
                                        name={`excerpt.${lang.code}` as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <span>{lang.flag}</span>
                                                    <span>{lang.label}</span>
                                                    <Badge variant="destructive" className="text-xs">Required</Badge>
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} rows={3} placeholder={`Brief summary in ${lang.label} (minimum 50 characters)`} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                                        Write in your language of choice
                                    </h4>
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        You can write your full case study content in any of the four languages below.
                                        Just complete at least one language version - our community may help translate it later!
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-4">Full Content (At Least One Language Required)</h4>
                            <div className="grid gap-4">
                                {languages.map((lang) => (
                                    <FormField
                                        key={`content-${lang.code}`}
                                        control={form.control}
                                        name={`content.${lang.code}` as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <span>{lang.flag}</span>
                                                    <span>{lang.label}</span>
                                                    <Badge variant="outline" className="text-xs">Optional</Badge>
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} rows={10} placeholder={`Detailed case study content in ${lang.label}`} />
                                                </FormControl>
                                                <FormDescription>
                                                    {lang.code === 'en' && "Provide comprehensive details about methodology, findings, and conclusions."}
                                                    {lang.code === 'es' && "Proporcione detalles sobre metodología, hallazgos y conclusiones."}
                                                    {lang.code === 'fr' && "Fournissez des détails sur la méthodologie, les résultats et les conclusions."}
                                                    {lang.code === 'ar' && "قدم تفاصيل شاملة حول المنهجية والنتائج والاستنتاجات."}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                            {form.formState.errors.content && (
                                <p className="text-sm font-medium text-destructive mt-2">
                                    {form.formState.errors.content.message}
                                </p>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="organizationName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Associated Organization (Optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter organization name" />
                                    </FormControl>
                                    <FormDescription>
                                        If this case study is associated with a specific organization, enter its name here.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </FormSection>

                {/* Authors & Contributors */}
                <FormSection
                    id="authors"
                    title="Authors & Contributors"
                    description="Add all people who contributed to this case study"
                    icon={<Users className="w-5 h-5" />}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Research Team</h4>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addAuthor}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Author
                            </Button>
                        </div>

                        {form.watch("authors").map((author, index) => (
                            <Card key={index} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`authors.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`authors.${index}.email`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`authors.${index}.role`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="lead">Lead Author</SelectItem>
                                                        <SelectItem value="coauthor">Co-Author</SelectItem>
                                                        <SelectItem value="contributor">Contributor</SelectItem>
                                                        <SelectItem value="advisor">Advisor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {index > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => removeAuthor(index)}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Remove Author
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                </FormSection>

                {/*/!* Tags & Classification *!/*/}
                {/*<FormSection*/}
                {/*    id="classification"*/}
                {/*    title="Tags & Classification"*/}
                {/*    description="Help others discover your case study"*/}
                {/*    icon={<Tag className="w-5 h-5" />}*/}
                {/*>*/}
                {/*    <div>*/}
                {/*        <h4 className="text-sm font-medium mb-4">Select Relevant Tags</h4>*/}
                {/*        <div className="flex flex-wrap gap-2">*/}
                {/*            {availableTags.map((tag) => {*/}
                {/*                const tagTitle = tag.title[currentLanguage] || tag.title.en*/}
                {/*                const isSelected = selectedTags.includes(tag._id)*/}

                {/*                return (*/}
                {/*                    <Badge*/}
                {/*                        key={tag._id}*/}
                {/*                        variant={isSelected ? "default" : "outline"}*/}
                {/*                        className="cursor-pointer hover:bg-accent"*/}
                {/*                        onClick={() => {*/}
                {/*                            if (isSelected) {*/}
                {/*                                setSelectedTags(selectedTags.filter(id => id !== tag._id))*/}
                {/*                            } else {*/}
                {/*                                setSelectedTags([...selectedTags, tag._id])*/}
                {/*                            }*/}
                {/*                            form.setValue("tags", isSelected*/}
                {/*                                ? selectedTags.filter(id => id !== tag._id)*/}
                {/*                                : [...selectedTags, tag._id]*/}
                {/*                            )*/}
                {/*                        }}*/}
                {/*                    >*/}
                {/*                        {tagTitle}*/}
                {/*                    </Badge>*/}
                {/*                )*/}
                {/*            })}*/}
                {/*        </div>*/}
                {/*        <p className="text-sm text-muted-foreground mt-2">*/}
                {/*            Select at least one tag to help categorize your case study.*/}
                {/*        </p>*/}
                {/*        {form.formState.errors.tags && (*/}
                {/*            <p className="text-sm font-medium text-destructive mt-2">*/}
                {/*                {form.formState.errors.tags.message}*/}
                {/*            </p>*/}
                {/*        )}*/}
                {/*    </div>*/}
                {/*</FormSection>*/}

                {/* Study Location */}
                <FormSection
                    id="location"
                    title="Study Location"
                    description="Where was this case study conducted?"
                    icon={<MapPin className="w-5 h-5" />}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="location.country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Country</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter country" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="location.city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter city" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="location.region"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Region/State</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter region" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </FormSection>

                {/* Study Period */}
                <FormSection
                    id="timeline"
                    title="Study Period"
                    description="When was this case study conducted?"
                    icon={<Calendar className="w-5 h-5" />}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="studyPeriod.startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="studyPeriod.endDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" />
                                    </FormControl>
                                    <FormDescription>
                                        Leave empty if the study is ongoing
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </FormSection>

                {/* Submit Section */}
                <Card className="border-t-2 border-primary">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Ready to Submit?</h3>
                                <p className="text-muted-foreground">
                                    Your case study will be reviewed by our editorial team before publication.
                                </p>
                            </div>

                            <Separator />

                            <div className="flex justify-center">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    size="lg"
                                    className="min-w-48"
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSubmitting ? "Submitting..." : "Submit Case Study"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    )
}
