import React, { useState, useEffect } from 'react';
import * as z from 'zod';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { topicOptions } from '@/sanity/schemas/shared/topic-options';
import PortableTextEditor from '@/components/forms/portable-text-editor';
import { geocodeLocation } from '@/lib/geocoding';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    FileText,
    Users,
    MapPin,
    Calendar,
    Tag,
    Upload,
    X,
    Plus,
    Send,
    Globe,
    ChevronRight,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';

// Simplified schema - only essential fields
const formSchema = z.object({
    title: z.object({
        en: z.string().min(5, "Please provide a clear title in English"),
        es: z.string().optional(),
        fr: z.string().optional(),
        ar: z.string().optional(),
    }),
    excerpt: z.object({
        en: z.string().min(100, "Please provide a brief description (at least 100 characters)"),
        es: z.string().optional(),
        fr: z.string().optional(),
        ar: z.string().optional(),
    }),
    content: z.any().refine((val) => {
        // Portable text validation - check if it's an array with at least some content
        if (!Array.isArray(val)) return false;
        if (val.length === 0) return false;
        // Check if there's actual text content
        const hasText = val.some(block =>
            block._type === 'block' &&
            block.children &&
            block.children.some((child: any) => child.text && child.text.trim().length > 0)
        );
        return hasText;
    }, "Please provide detailed content for your case study"),
    topic: z.string().min(1, "Please select a topic"),
    authors: z.array(z.object({
        name: z.string().min(2, "Please enter the author's full name"),
        email: z.string().email("Please enter a valid email address").optional().or(z.literal('')),
        role: z.enum(['lead', 'coauthor', 'contributor', 'advisor']),
    })).min(1, "At least one author is required"),
    organizationName: z.string().optional(),
    relatedCommunity: z.string().optional(),
    tags: z.array(z.string()).min(1, "Please select at least one relevant topic"),
    studyPeriod: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }).optional(),
    locationText: z.object({
        country: z.string().optional(),
        city: z.string().optional(),
    }).optional(),
    studyLocation: z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
    }).optional(),
    image: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
];

const authorRoles = [
    { value: 'lead', label: 'Lead Author' },
    { value: 'coauthor', label: 'Co-Author' },
    { value: 'contributor', label: 'Contributor' },
    { value: 'advisor', label: 'Advisor' },
];

interface ImprovedCaseStudyFormProps {
    userId: string;
    locale: string;
    availableTags: Array<{
        _id: string;
        label: Record<string, string>;
        value: { current: string };
    }>;
    regionalCommunities: Array<{
        _id: string;
        name: Record<string, string>;
        slug: { current: string };
    }>;
    onSuccess?: (id: string) => void;
}

const sections = [
    { id: 'basic', title: 'Basic Information', icon: FileText, required: true },
    { id: 'content', title: 'Case Study Details', icon: FileText, required: true },
    { id: 'authors', title: 'Authors & Team', icon: Users, required: true },
    { id: 'topics', title: 'Regional Community & Tags', icon: Tag, required: true },
    { id: 'context', title: 'Context & Location', icon: MapPin, required: false },
];

export default function ImprovedCaseStudyForm({
                                                  userId,
                                                  locale = 'en',
                                                  availableTags,
                                                  regionalCommunities,
                                                  onSuccess
                                              }: ImprovedCaseStudyFormProps) {
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedCommunity, setSelectedCommunity] = useState<string>('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const [openSection, setOpenSection] = useState<string>('basic');
    const [submissionStep, setSubmissionStep] = useState<'form' | 'review' | 'submitting' | 'success'>('form');
    const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<FormData>>({
        title: { en: '', es: '', fr: '', ar: '' },
        excerpt: { en: '', es: '', fr: '', ar: '' },
        topic: '',
        content: [],
        authors: user ? [{
            name: user.fullName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
            role: 'lead' as const,
        }] : [],
        organizationName: '',
        relatedCommunity: '',
        tags: [],
        studyPeriod: { startDate: '', endDate: '' },
        locationText: { country: '', city: '' },
        studyLocation: { lat: undefined, lng: undefined },
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isHydrated, setIsHydrated] = useState(false);
    // Server-side draft id (cross-device). Drafts are stored as caseStudyDraft
    // documents via the authenticated /api/case-studies/drafts route.
    const [draftId, setDraftId] = useState<string | null>(null);

    const LEGACY_DRAFT_KEY = 'case-study-submission';

    // Apply a stored draft's fields to the form. Shape: form fields spread at
    // the top level (matches what we POST below), plus selectedTags.
    const applyDraft = (draft: any) => {
        if (!draft) return;
        const { _id, _type, _rev, userId, lastSaved, formMetadata, selectedTags: tags, ...fields } = draft;
        if (!fields.contentLanguage) fields.contentLanguage = 'en';
        setFormData((prev) => ({ ...prev, ...fields }));
        if (Array.isArray(tags)) setSelectedTags(tags);
    };

    // On mount: load the server draft. If none exists but a legacy localStorage
    // draft is present, migrate it to the server once, then clear localStorage.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/case-studies/drafts');
                const serverDraft = res.ok ? (await res.json()).draft : null;

                if (serverDraft && !cancelled) {
                    setDraftId(serverDraft._id);
                    applyDraft(serverDraft);
                    toast.info('Your saved draft has been restored');
                } else {
                    // One-time migration of a legacy local draft.
                    const legacy = localStorage.getItem(LEGACY_DRAFT_KEY);
                    if (legacy) {
                        try {
                            const parsed = JSON.parse(legacy);
                            const legacyForm = parsed.state?.formData;
                            if (legacyForm && !cancelled) {
                                applyDraft({ ...legacyForm, selectedTags: parsed.state?.selectedTags });
                                toast.info('Your previous draft has been restored');
                            }
                        } catch { /* ignore malformed legacy draft */ }
                        localStorage.removeItem(LEGACY_DRAFT_KEY);
                    }
                }
            } catch {
                // Network/auth failure — fall back to whatever the form defaults are.
            } finally {
                if (!cancelled) setIsHydrated(true);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Auto-save to the server (debounced). The image File is uploaded only at
    // final submit, so drafts persist field data, not the binary.
    useEffect(() => {
        if (!isHydrated) return; // Don't save on initial mount/restore

        // Don't create a draft for an empty form — only once the user has
        // entered something worth keeping (or we're updating an existing draft).
        const hasContent = Boolean(
            (formData.title && Object.values(formData.title).some((v) => (v as string)?.trim())) ||
            (formData.excerpt && Object.values(formData.excerpt).some((v) => (v as string)?.trim())) ||
            (formData.content && (formData.content as any[])?.length) ||
            selectedTags.length
        );
        if (!draftId && !hasContent) return;

        const timeoutId = setTimeout(async () => {
            try {
                const { image, ...draftFields } = formData as Record<string, any>;
                const res = await fetch('/api/case-studies/drafts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        draftId,
                        draftData: { ...draftFields, selectedTags },
                    }),
                });
                if (res.ok) {
                    const { id } = await res.json();
                    if (id && !draftId) setDraftId(id);
                    setDraftSavedAt(new Date().toLocaleTimeString());
                }
            } catch {
                // Transient save failure — the next change will retry.
            }
        }, 1500); // Debounce 1.5s (server round-trip, vs the old 1s local write)

        return () => clearTimeout(timeoutId);
    }, [formData, selectedTags, isHydrated, draftId]);

    // Validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        try {
            formSchema.parse(formData);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.errors.forEach(err => {
                    const path = err.path.join('.');
                    newErrors[path] = err.message;
                });
            }
            setErrors(newErrors);
            return false;
        }
    };

    // Section validation
    useEffect(() => {
        const newCompleted = new Set<string>();

        // Basic section
        const hasBasic = formData.title?.en && formData.excerpt?.en && (formData.excerpt.en?.length || 0) >= 100 && !!formData.topic;
        if (hasBasic) {
            newCompleted.add('basic');
        }

        // Content section - check for portable text content
        const hasContent = Array.isArray(formData.content) &&
            formData.content.length > 0 &&
            formData.content.some(block =>
                block._type === 'block' &&
                block.children &&
                block.children.some((child: any) => child.text && child.text.trim().length > 0)
            );
        if (hasContent) {
            newCompleted.add('content');
        }

        // Authors section
        const hasAuthors = formData.authors && formData.authors.length > 0 &&
            formData.authors.every(author => author.name && author.role);
        if (hasAuthors) {
            newCompleted.add('authors');
        }

        // Topics section
        const hasTopics = selectedTags.length > 0;
        if (hasTopics) {
            newCompleted.add('topics');
        }

        // Context section (optional) — only mark complete once the user has
        // actually entered location or study-period data. Marking it complete
        // unconditionally made a brand-new submission show this stage as already
        // done, which was confusing.
        const hasContext = Boolean(
            formData.locationText?.country ||
            formData.locationText?.city ||
            formData.studyPeriod?.startDate ||
            formData.studyPeriod?.endDate
        );
        if (hasContext) {
            newCompleted.add('context');
        }
        setCompletedSections(newCompleted);
    }, [formData, selectedTags]);

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => {
            const keys = field.split('.');
            const updated = { ...prev };
            let current: any = updated;

            for (let i = 0; i < keys.length - 1; i++) {
                // Deep-clone each nesting level to avoid React state mutation
                current[keys[i]] = Array.isArray(current[keys[i]])
                    ? [...current[keys[i]]]
                    : { ...current[keys[i]] };
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return updated;
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a JPEG, PNG, or WebP image');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be smaller than 5MB');
            return;
        }

        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const addAuthor = () => {
        const currentAuthors = formData.authors || [];
        updateFormData('authors', [
            ...currentAuthors,
            { name: '', email: '', role: 'coauthor' as const }
        ]);
    };

    const removeAuthor = (index: number) => {
        const currentAuthors = formData.authors || [];
        updateFormData('authors', currentAuthors.filter((_, i) => i !== index));
    };

    const updateAuthor = (index: number, field: string, value: string) => {
        const currentAuthors = [...(formData.authors || [])];
        currentAuthors[index] = { ...currentAuthors[index], [field]: value };
        updateFormData('authors', currentAuthors);
    };

    const handleTagToggle = (tagId: string) => {
        const newTags = selectedTags.includes(tagId)
            ? selectedTags.filter(id => id !== tagId)
            : [...selectedTags, tagId];

        setSelectedTags(newTags);
        updateFormData('tags', newTags);
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        setIsSubmitting(true);
        setSubmissionStep('submitting');

        try {
            // Prepare submission data
            const submissionData = {
                ...formData,
                topic: formData.topic,
                tags: selectedTags,
                submittedBy: userId,
                submittedAt: new Date().toISOString(),
                authors: (formData.authors || []).map((author, index) => ({
                    ...author,
                    userId: index === 0 ? userId : undefined, // First author is submitter
                })),
            };

            // Create FormData for multipart submission
            const apiFormData = new FormData();
            apiFormData.append('data', JSON.stringify(submissionData));

            // Add image if present
            if (imageFile) {
                apiFormData.append('image', imageFile);
            }
            const response = await fetch('/api/case-studies/submit', {
                method: 'POST',
                body: apiFormData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'Submission failed');
            }

            const result = await response.json();

            // Delete the server-side draft now that it has been submitted.
            if (draftId) {
                fetch('/api/case-studies/drafts', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ draftId }),
                }).catch(() => { /* best effort */ });
                setDraftId(null);
            }
            // Clear any stale legacy local draft too.
            localStorage.removeItem(LEGACY_DRAFT_KEY);

            setSubmissionStep('success');
            toast.success('Thank you! Your case study has been submitted for review.');

            if (onSuccess) {
                onSuccess(result.id);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
            toast.error(errorMessage);
            setSubmissionStep('form');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success screen (B2: persistent, no auto-reset)
    if (submissionStep === 'success') {
        return (
            <div className="max-w-2xl mx-auto text-center py-12 space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Thank You for Your Contribution!</h2>
                <div className="space-y-2 text-muted-foreground">
                    <p>Your case study has been submitted successfully.</p>
                    <p>Our team will review it and email you once there&apos;s an update. You can also check its status anytime on your submissions page.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setFormData({
                                title: { en: '', es: '', fr: '', ar: '' },
                                excerpt: { en: '', es: '', fr: '', ar: '' },
                                topic: '',
                                content: [],
                                authors: [],
                                organizationName: '',
                                relatedCommunity: '',
                                tags: [],
                                studyPeriod: { startDate: '', endDate: '' },
                                locationText: { country: '', city: '' },
                                studyLocation: { lat: undefined, lng: undefined },
                            });
                            setSelectedTags([]);
                            setSelectedCommunity('');
                            setImageFile(null);
                            setImagePreview(null);
                            setSubmissionStep('form');
                            setOpenSection('basic');
                        }}
                    >
                        <Plus className="w-4 h-4 me-2" />
                        Submit Another Case Study
                    </Button>
                    <Button asChild>
                        <a href={`/${locale}/dashboard/submissions`}>View My Submissions</a>
                    </Button>
                </div>
            </div>
        );
    }

    // B1: Review step
    if (submissionStep === 'review') {
        const selectedTopicLabel = topicOptions.find(t => t.value === formData.topic)?.title || formData.topic;
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Review Your Submission</h2>
                        <p className="text-muted-foreground mt-1">
                            Please check everything looks correct before submitting
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => setSubmissionStep('form')}>
                        Go Back to Edit
                    </Button>
                </div>

                {/* Title & Topic */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Title</p>
                            <p className="font-medium">{formData.title?.en}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Topic</p>
                            <Badge variant="secondary">{selectedTopicLabel}</Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                            <p className="text-sm">{formData.excerpt?.en}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Authors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Authors ({(formData.authors || []).length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(formData.authors || []).map((author, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{author.name}</p>
                                        {author.email && <p className="text-sm text-muted-foreground">{author.email}</p>}
                                    </div>
                                    <Badge variant="outline">{author.role}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Tags & Community */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Tags &amp; Community
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map(tagId => {
                                const tag = availableTags.find(t => t._id === tagId);
                                return (
                                    <Badge key={tagId} variant="secondary">
                                        {tag?.label?.[locale as keyof typeof tag.label] || tag?.label?.en || tagId}
                                    </Badge>
                                );
                            })}
                        </div>
                        {selectedCommunity && (
                            <p className="text-sm text-muted-foreground">
                                Community: {regionalCommunities.find(c => c._id === selectedCommunity)?.name?.en || selectedCommunity}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Context */}
                {(formData.locationText?.country || formData.studyPeriod?.startDate) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Context
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {formData.locationText?.country && (
                                <p className="text-sm">
                                    Location: {formData.locationText.city && `${formData.locationText.city}, `}{formData.locationText.country}
                                </p>
                            )}
                            {formData.studyPeriod?.startDate && (
                                <p className="text-sm">
                                    Period: {formData.studyPeriod.startDate}{formData.studyPeriod.endDate ? ` – ${formData.studyPeriod.endDate}` : ' – Ongoing'}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {imageFile && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Featured Image</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)</p>
                        </CardContent>
                    </Card>
                )}

                <Separator />

                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setSubmissionStep('form')}>
                        Go Back to Edit
                    </Button>
                    <Button
                        size="lg"
                        className="min-w-48"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Send className="w-4 h-4 me-2" />
                        Confirm &amp; Submit
                    </Button>
                </div>
            </div>
        );
    }

    // Submitting screen
    if (submissionStep === 'submitting') {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-ccm-water animate-spin" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Submitting Your Case Study</h2>
                <p className="text-muted-foreground">
                    Please wait while we process your submission...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Share Your Case Study</h1>
                <p className="text-muted-foreground">
                    Help the global research community learn from your work and experience
                </p>
            </div>

            <Accordion
                type="single"
                value={openSection}
                onValueChange={setOpenSection}
                className="space-y-4"
            >
                {sections.map((section) => {
                    const isCompleted = completedSections.has(section.id);
                    const isRequired = section.required;

                    return (
                        <AccordionItem key={section.id} value={section.id}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3 w-full">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isCompleted
                                            ? 'bg-green-100 text-green-600'
                                            : isRequired
                                                ? 'bg-blue-100 text-ccm-water'
                                                : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {isCompleted ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <section.icon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-start">
                                        <div className="font-medium">{section.title}</div>
                                        {isRequired && !isCompleted && (
                                            <div className="text-sm text-muted-foreground">Required</div>
                                        )}
                                    </div>
                                    {isCompleted && (
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            Complete
                                        </Badge>
                                    )}
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className="pt-6">
                                {section.id === 'basic' && (
                                    <div className="space-y-6">
                                        <div className="grid gap-6">
                                            <div>
                                                <Label className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4" />
                                                    Case Study Title *
                                                </Label>
                                                <Input
                                                    value={formData.title?.en || ''}
                                                    onChange={(e) => updateFormData('title.en', e.target.value)}
                                                    placeholder="What is your case study about?"
                                                    className="mt-2"
                                                />
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Give your case study a clear, descriptive title
                                                </p>
                                                {errors['title.en'] && (
                                                    <p className="text-sm text-destructive mt-1">{errors['title.en']}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Brief Description *</Label>
                                                <Textarea
                                                    value={formData.excerpt?.en || ''}
                                                    onChange={(e) => updateFormData('excerpt.en', e.target.value)}
                                                    rows={4}
                                                    placeholder="Provide a brief overview of your case study - what did you do, where, and what were the key findings?"
                                                    className="mt-2"
                                                />
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    This helps others quickly understand your work (minimum 100 characters)
                                                </p>
                                                {errors['excerpt.en'] && (
                                                    <p className="text-sm text-destructive mt-1">{errors['excerpt.en']}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Topic / Domain *</Label>
                                                <Select
                                                    value={formData.topic || ''}
                                                    onValueChange={(value) => updateFormData('topic', value)}
                                                >
                                                    <SelectTrigger className="mt-2">
                                                        <SelectValue placeholder="Select the main topic of your case study" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {topicOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Choose the primary topic that best describes your case study
                                                </p>
                                                {errors['topic'] && (
                                                    <p className="text-sm text-destructive mt-1">{errors['topic']}</p>
                                                )}
                                            </div>

                                            {/* B4: Optional translations — collapsed by default */}
                                            <details className="border rounded-lg bg-muted/30">
                                                <summary className="p-4 cursor-pointer font-medium flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-ccm-water" />
                                                    Add translations to help more researchers discover your work
                                                </summary>
                                                <div className="px-4 pb-4 grid gap-4">
                                                    {languages.filter(lang => lang.code !== 'en').map((lang) => (
                                                        <div key={lang.code} className="space-y-2">
                                                            <Label className="text-sm">{lang.label} Translation</Label>
                                                            <Input
                                                                placeholder={`Title in ${lang.label}`}
                                                                value={formData.title?.[lang.code as keyof typeof formData.title] || ''}
                                                                onChange={(e) => updateFormData(`title.${lang.code}`, e.target.value)}
                                                            />
                                                            <Textarea
                                                                rows={2}
                                                                placeholder={`Brief description in ${lang.label}`}
                                                                value={formData.excerpt?.[lang.code as keyof typeof formData.excerpt] || ''}
                                                                onChange={(e) => updateFormData(`excerpt.${lang.code}`, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                )}

                                {section.id === 'content' && (
                                    <div className="space-y-6">
                                        <div>
                                            <Label>Case Study Content *</Label>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Use the formatting toolbar to style your content with headings, lists, links, and images. Write in any language you prefer.
                                            </p>
                                            <div className="mt-2">
                                                <PortableTextEditor
                                                    value={formData.content || []}
                                                    onChangeAction={(value) => updateFormData('content', value)}
                                                    language={locale}
                                                    placeholder="Share the details of your case study - methodology, findings, challenges, successes, and lessons learned..."
                                                    maxLength={20000}
                                                />
                                            </div>
                                            {errors['content'] && (
                                                <p className="text-sm text-destructive mt-1">{errors['content']}</p>
                                            )}
                                        </div>

                                        {/* Image Upload */}
                                        <div className="space-y-4">
                                            <Label>Featured Image (optional)</Label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                {imagePreview ? (
                                                    <div className="relative">
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            className="max-w-full h-48 object-cover mx-auto rounded"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute top-2 end-2"
                                                            onClick={() => {
                                                                setImageFile(null);
                                                                setImagePreview(null);
                                                            }}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            Upload an image to represent your case study
                                                        </p>
                                                        <input
                                                            type="file"
                                                            accept="image/jpeg,image/png,image/webp"
                                                            onChange={handleImageUpload}
                                                            className="hidden"
                                                            id="image-upload"
                                                        />
                                                        <Label
                                                            htmlFor="image-upload"
                                                            className="cursor-pointer inline-flex items-center px-4 py-2 bg-ccm-midnight text-white rounded-md text-sm hover:bg-ccm-midnight/90 font-heading font-bold"
                                                        >
                                                            Choose Image
                                                        </Label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {section.id === 'authors' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">Research Team *</h4>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addAuthor}
                                            >
                                                <Plus className="w-4 h-4 me-2" />
                                                Add Author
                                            </Button>
                                        </div>

                                        {(formData.authors || []).map((author, index) => (
                                            <Card key={index}>
                                                <CardContent className="pt-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Full Name *</Label>
                                                            <Input
                                                                value={author.name || ''}
                                                                onChange={(e) => updateAuthor(index, 'name', e.target.value)}
                                                                placeholder="Enter full name"
                                                                className="mt-2"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Email Address (optional)</Label>
                                                            <Input
                                                                value={author.email || ''}
                                                                onChange={(e) => updateAuthor(index, 'email', e.target.value)}
                                                                type="email"
                                                                placeholder="email@example.com"
                                                                className="mt-2"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <Label>Role in Study *</Label>
                                                            <Select
                                                                value={author.role || ''}
                                                                onValueChange={(value) => updateAuthor(index, 'role', value)}
                                                            >
                                                                <SelectTrigger className="mt-2">
                                                                    <SelectValue placeholder="Select role" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {authorRoles.map((role) => (
                                                                        <SelectItem key={role.value} value={role.value}>
                                                                            {role.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    {formData.authors && formData.authors.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="mt-4"
                                                            onClick={() => removeAuthor(index)}
                                                        >
                                                            <X className="w-4 h-4 me-2" />
                                                            Remove Author
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}

                                        <div>
                                            <Label>Associated Organization (optional)</Label>
                                            <Input
                                                value={formData.organizationName || ''}
                                                onChange={(e) => updateFormData('organizationName', e.target.value)}
                                                placeholder="Organization or institution name"
                                                className="mt-2"
                                            />
                                            <p className="text-sm text-muted-foreground mt-1">
                                                If this work was done as part of an organization
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {section.id === 'topics' && (
                                    <div className="space-y-6">
                                        {/* Regional Community Selector */}
                                        <div>
                                            <Label className="text-base font-medium mb-2 block">
                                                Associated Regional Community (Optional)
                                            </Label>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Connect your case study to a specific regional community if relevant
                                            </p>
                                            <Select
                                                value={selectedCommunity}
                                                onValueChange={(value) => {
                                                    setSelectedCommunity(value);
                                                    updateFormData('relatedCommunity', value);
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a community (optional)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {regionalCommunities.map((community) => {
                                                        const communityName = community.name?.[locale as keyof typeof community.name] || community.name?.en || 'Untitled';
                                                        return (
                                                            <SelectItem key={community._id} value={community._id}>
                                                                {communityName}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            {selectedCommunity && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedCommunity('');
                                                        updateFormData('relatedCommunity', '');
                                                    }}
                                                    className="mt-2"
                                                >
                                                    Clear selection
                                                </Button>
                                            )}
                                        </div>

                                        {/* Tags Selector */}
                                        <div>
                                            <Label className="text-base font-medium mb-2 block">
                                                Select Relevant Tags *
                                            </Label>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Choose tags that best describe your case study to help others discover it
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {availableTags.map((tag) => {
                                                    const isSelected = selectedTags.includes(tag._id);
                                                    const tagLabel = tag.label?.[locale as keyof typeof tag.label] || tag.label?.en || 'Untitled';

                                                    return (
                                                        <Button
                                                            key={tag._id}
                                                            type="button"
                                                            variant={isSelected ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleTagToggle(tag._id)}
                                                            className="h-auto py-2"
                                                        >
                                                            {tagLabel}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            {selectedTags.length === 0 && (
                                                <p className="text-sm text-destructive mt-2">
                                                    Please select at least one tag
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {section.id === 'context' && (
                                    <div className="space-y-6">
                                        <p className="text-muted-foreground">
                                            Help others understand the context of your work (all fields optional)
                                        </p>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Country</Label>
                                                    <Input
                                                        value={formData.locationText?.country || ''}
                                                        onChange={(e) => updateFormData('locationText.country', e.target.value)}
                                                        placeholder="Where was this study conducted?"
                                                        className="mt-2"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>City/Region</Label>
                                                    <Input
                                                        value={formData.locationText?.city || ''}
                                                        onChange={(e) => updateFormData('locationText.city', e.target.value)}
                                                        placeholder="Specific location"
                                                        className="mt-2"
                                                    />
                                                </div>
                                            </div>

                                            {formData.locationText?.country && formData.locationText?.city && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (!formData.locationText?.country || !formData.locationText?.city) return;

                                                        setIsGeocoding(true);
                                                        toast.info('Searching for location...');

                                                        const result = await geocodeLocation(
                                                            formData.locationText.city,
                                                            formData.locationText.country
                                                        );

                                                        setIsGeocoding(false);

                                                        if (result.success && result.location) {
                                                            updateFormData('studyLocation', result.location);
                                                            toast.success(`Location found! (${result.location.lat.toFixed(4)}, ${result.location.lng.toFixed(4)})`);
                                                        } else {
                                                            toast.error(result.error || 'Could not find location');
                                                        }
                                                    }}
                                                    disabled={isGeocoding}
                                                >
                                                    {isGeocoding ? 'Searching...' : '📍 Find on Map'}
                                                </Button>
                                            )}

                                            {formData.studyLocation?.lat && formData.studyLocation?.lng && (
                                                <p className="text-sm text-muted-foreground">
                                                    ✓ Location coordinates: {formData.studyLocation.lat.toFixed(4)}, {formData.studyLocation.lng.toFixed(4)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Study Start Date</Label>
                                                <Input
                                                    value={formData.studyPeriod?.startDate || ''}
                                                    onChange={(e) => updateFormData('studyPeriod.startDate', e.target.value)}
                                                    type="date"
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>Study End Date</Label>
                                                <Input
                                                    value={formData.studyPeriod?.endDate || ''}
                                                    onChange={(e) => updateFormData('studyPeriod.endDate', e.target.value)}
                                                    type="date"
                                                    className="mt-2"
                                                />
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Leave empty if ongoing
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>

            <Separator />

            {draftSavedAt && (
                <p className="text-center text-xs text-muted-foreground">
                    Draft saved at {draftSavedAt}
                </p>
            )}

            <div className="flex justify-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                        try {
                            const { image, ...draftFields } = formData as Record<string, any>;
                            const res = await fetch('/api/case-studies/drafts', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ draftId, draftData: { ...draftFields, selectedTags } }),
                            });
                            if (!res.ok) throw new Error('save failed');
                            const { id } = await res.json();
                            if (id && !draftId) setDraftId(id);
                            setDraftSavedAt(new Date().toLocaleTimeString());
                            toast.success('Draft saved');
                        } catch {
                            toast.error('Could not save draft');
                        }
                    }}
                >
                    Save Draft
                </Button>
                <Button
                    type="button"
                    onClick={() => {
                        if (!validateForm()) {
                            toast.error('Please fix the highlighted issues before reviewing');
                            return;
                        }
                        setSubmissionStep('review');
                    }}
                    disabled={completedSections.size < 4}
                    size="lg"
                    className="min-w-48"
                >
                    <ChevronRight className="w-4 h-4 me-2" />
                    Review &amp; Submit
                </Button>
            </div>

            {completedSections.size < 4 && (
                <div className="text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Please complete all required sections to continue
                    </p>
                </div>
            )}
        </div>
    );
}
