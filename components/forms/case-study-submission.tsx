"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, X, Upload } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from 'next-intl';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
    title: z.object({
        en: z.string().min(1, "English title is required"),
        es: z.string().optional(),
        fr: z.string().optional(),
        ar: z.string().optional(),
    }),
    subtitle: z.object({
        en: z.string().optional(),
        es: z.string().optional(),
        fr: z.string().optional(),
        ar: z.string().optional(),
    }),
    excerpt: z.object({
        en: z.string().min(50, "English excerpt must be at least 50 characters"),
        es: z.string().optional(),
        fr: z.string().optional(),
        ar: z.string().optional(),
    }),
    content: z.object({
        en: z.string().min(200, "English content must be at least 200 characters"),
        es: z.string().optional(),
        fr: z.string().optional(),
        ar: z.string().optional(),
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
});

type FormData = z.infer<typeof formSchema>;

interface CaseStudySubmissionFormProps {
    availableTags: Array<{
        _id: string;
        title: Record<string, string>;
    }>;
    locale?: string;
}

export default function CaseStudySubmissionForm({
                                                    availableTags,
                                                    locale = 'en'
                                                }: CaseStudySubmissionFormProps) {
    const { user } = useUser();
    const t = useTranslations('caseStudyForm');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast.error("Please upload a valid image file (JPEG, PNG, or WebP)");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error("Image size must be less than 10MB");
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const addAuthor = () => {
        const currentAuthors = form.getValues("authors");
        form.setValue("authors", [
            ...currentAuthors,
            { name: "", email: "", role: "coauthor" as const }
        ]);
    };

    const removeAuthor = (index: number) => {
        const currentAuthors = form.getValues("authors");
        form.setValue("authors", currentAuthors.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: FormData) => {
        if (!user) {
            toast.error("You must be logged in to submit a case study");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("data", JSON.stringify({
                ...data,
                tags: selectedTags,
                submittedBy: user.id,
                authors: data.authors.map(author => ({
                    ...author,
                    userId: author.email === user.emailAddresses[0]?.emailAddress ? user.id : undefined,
                })),
            }));

            if (imageFile) {
                formData.append("image", imageFile);
            }

            const response = await fetch("/api/case-studies/submit", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to submit case study");
            }

            toast.success(t('submitSuccess'));
            form.reset();
            setSelectedTags([]);
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error("Submission error:", error);
            toast.error(t('submitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const languages = [
        { code: 'en', label: 'English', required: true },
        { code: 'es', label: 'Español', required: false },
        { code: 'fr', label: 'Français', required: false },
        { code: 'ar', label: 'العربية', required: false },
    ];

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>
                    {t('description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Title fields for each language */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{t('titleSection')}</h3>
                            {languages.map((lang) => (
                                <FormField
                                    key={lang.code}
                                    control={form.control}
                                    name={`title.${lang.code}` as any}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t('titleLabel')} ({lang.label})
                                                {lang.required && <span className="text-destructive ml-1">*</span>}
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>

                        {/* Subtitle fields */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{t('subtitleSection')}</h3>
                            {languages.map((lang) => (
                                <FormField
                                    key={lang.code}
                                    control={form.control}
                                    name={`subtitle.${lang.code}` as any}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t('subtitleLabel')} ({lang.label})
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>

                        {/* Excerpt fields */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{t('excerptSection')}</h3>
                            {languages.map((lang) => (
                                <FormField
                                    key={lang.code}
                                    control={form.control}
                                    name={`excerpt.${lang.code}` as any}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t('excerptLabel')} ({lang.label})
                                                {lang.required && <span className="text-destructive ml-1">*</span>}
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea {...field} rows={3} />
                                            </FormControl>
                                            <FormDescription>
                                                {t('excerptDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>

                        {/* Main content fields */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{t('contentSection')}</h3>
                            {languages.map((lang) => (
                                <FormField
                                    key={lang.code}
                                    control={form.control}
                                    name={`content.${lang.code}` as any}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t('contentLabel')} ({lang.label})
                                                {lang.required && <span className="text-destructive ml-1">*</span>}
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea {...field} rows={10} />
                                            </FormControl>
                                            <FormDescription>
                                                {t('contentDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>

                        {/* Authors */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{t('authorsSection')}</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addAuthor}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t('addAuthor')}
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
                                                    <FormLabel>{t('authorName')}</FormLabel>
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
                                                    <FormLabel>{t('authorEmail')}</FormLabel>
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
                                                    <FormLabel>{t('authorRole')}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="lead">{t('roleLead')}</SelectItem>
                                                            <SelectItem value="coauthor">{t('roleCoauthor')}</SelectItem>
                                                            <SelectItem value="contributor">{t('roleContributor')}</SelectItem>
                                                            <SelectItem value="advisor">{t('roleAdvisor')}</SelectItem>
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
                                            {t('removeAuthor')}
                                        </Button>
                                    )}
                                </Card>
                            ))}
                        </div>

                        {/* Organization */}
                        <FormField
                            control={form.control}
                            name="organizationName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('organizationLabel')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={t('organizationPlaceholder')} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Tags */}
                        <FormItem>
                            <FormLabel>{t('tagsLabel')}</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map((tag) => {
                                    const tagTitle = tag.title[locale] || tag.title.en;
                                    const isSelected = selectedTags.includes(tag._id);

                                    return (
                                        <Badge
                                            key={tag._id}
                                            variant={isSelected ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedTags(selectedTags.filter(id => id !== tag._id));
                                                } else {
                                                    setSelectedTags([...selectedTags, tag._id]);
                                                }
                                                form.setValue("tags", isSelected
                                                    ? selectedTags.filter(id => id !== tag._id)
                                                    : [...selectedTags, tag._id]
                                                );
                                            }}
                                        >
                                            {tagTitle}
                                        </Badge>
                                    );
                                })}
                            </div>
                            <FormDescription>
                                {t('tagsDescription')}
                            </FormDescription>
                            {form.formState.errors.tags && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.tags.message}
                                </p>
                            )}
                        </FormItem>

                        {/* Study Period */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="studyPeriod.startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('startDateLabel')}</FormLabel>
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
                                        <FormLabel>{t('endDateLabel')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="date" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Location */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="location.country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('countryLabel')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                        <FormLabel>{t('cityLabel')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                        <FormLabel>{t('regionLabel')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Featured Image */}
                        <FormItem>
                            <FormLabel>{t('imageLabel')}</FormLabel>
                            <FormControl>
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
                                            {t('uploadImage')}
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
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            <FormDescription>
                                {t('imageDescription')}
                            </FormDescription>
                        </FormItem>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full"
                            size="lg"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? t('submitting') : t('submit')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
