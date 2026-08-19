import React, { useState, useEffect, useMemo } from 'react';
import * as z from 'zod';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { topicOptions } from '@/sanity/schemas/shared/topic-options';
import PortableTextEditor from '@/components/forms/portable-text-editor';
import { geocodeLocation } from '@/lib/geocoding';
import { PlacePicker, type PlaceValue } from '@/components/forms/place-picker';
import { LayoutChooser, type CaseStudyLayout } from '@/components/forms/case-study/layout-chooser';
import { BylineChips, type BylineAuthor } from '@/components/forms/case-study/byline-chips';
import { HeroImageDrop } from '@/components/forms/case-study/hero-image-drop';
import { SubmitBar, type DraftStatus } from '@/components/forms/case-study/submit-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import {
    FileText,
    Users,
    MapPin,
    Tag,
    Plus,
    Send,
    CheckCircle,
    Clock,
} from 'lucide-react';

// Localized validation messages (resolved from t() inside the component so the
// Zod errors show in the user's language — the proven newsletter pattern).
interface SchemaMessages {
    titleMin: string;
    excerptMin: string;
    contentRequired: string;
    topicRequired: string;
    authorNameMin: string;
    authorEmailInvalid: string;
    authorsMin: string;
    tagsMin: string;
}

// Simplified schema - only essential fields
const makeFormSchema = (m: SchemaMessages) => z.object({
    title: z.object({
        en: z.string().min(5, m.titleMin),
        es: z.string().optional(),
        fr: z.string().optional(),
        ar: z.string().optional(),
    }),
    excerpt: z.object({
        en: z.string().min(100, m.excerptMin),
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
            block.children.some((child: { text?: string }) => child.text && child.text.trim().length > 0)
        );
        return hasText;
    }, m.contentRequired),
    topic: z.string().min(1, m.topicRequired),
    // Task E3 — detail-page layout archetype (parent spec §8a/C1). Presentation
    // only; the pipeline stores it on the caseStudy doc alongside the content.
    layout: z.enum(['story', 'feature', 'report']).default('story'),
    authors: z.array(z.object({
        name: z.string().min(2, m.authorNameMin),
        email: z.string().email(m.authorEmailInvalid).optional().or(z.literal('')),
        role: z.enum(['lead', 'coauthor', 'contributor', 'advisor']),
    })).min(1, m.authorsMin),
    organizationName: z.string().optional(),
    relatedCommunity: z.string().optional(),
    tags: z.array(z.string()).min(1, m.tagsMin),
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

type FormData = z.infer<ReturnType<typeof makeFormSchema>>;

const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
] as const;

type LangCode = (typeof languages)[number]['code'];

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
    workspaceId?: string | null;
    /** X7 edit mode: an existing Sanity doc (mapped to form shape server-side).
     *  Present → the form edits + resubmits instead of creating. */
    editDoc?: (Record<string, unknown> & { _sanityId: string }) | null;
}

// The four required completeness gates (formerly the accordion's required
// sections) — still drive the "Submit for review" enablement.
const REQUIRED_SECTIONS = ['basic', 'content', 'authors', 'topics'] as const;

export default function ImprovedCaseStudyForm({
                                                  userId,
                                                  locale = 'en',
                                                  availableTags,
                                                  regionalCommunities,
                                                  onSuccess,
                                                  workspaceId,
                                                  editDoc
                                              }: ImprovedCaseStudyFormProps) {
    const { user } = useUser();
    const t = useTranslations('caseStudySubmission');
    const tCommon = useTranslations('common');
    // Schema built inside the component so validation messages localize.
    const formSchema = useMemo(() => makeFormSchema({
        titleMin: t('validation.titleMin'),
        excerptMin: t('validation.excerptMin'),
        contentRequired: t('validation.contentRequired'),
        topicRequired: t('validation.topicRequired'),
        authorNameMin: t('validation.authorNameMin'),
        authorEmailInvalid: t('validation.authorEmailInvalid'),
        authorsMin: t('validation.authorsMin'),
        tagsMin: t('validation.tagsMin'),
    }), [t]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedCommunity, setSelectedCommunity] = useState<string>('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [place, setPlace] = useState<PlaceValue | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const [submissionStep, setSubmissionStep] = useState<'form' | 'review' | 'submitting' | 'success'>('form');
    const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
    const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
    // Which language the title/excerpt inputs currently edit (multilingual switcher).
    const [activeLang, setActiveLang] = useState<LangCode>('en');
    // Bumped when a stored draft is applied so the (uncontrolled-after-mount)
    // Portable Text editor remounts with the restored body content.
    const [editorResetKey, setEditorResetKey] = useState(0);

    // Form state
    const [formData, setFormData] = useState<Partial<FormData>>({
        title: { en: '', es: '', fr: '', ar: '' },
        excerpt: { en: '', es: '', fr: '', ar: '' },
        topic: '',
        layout: 'story',
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
    const applyDraft = (draft: Record<string, unknown> | null | undefined) => {
        if (!draft) return;
        const { _id, _type, _rev, userId, lastSaved, formMetadata, selectedTags: tags, ...fields } = draft;
        if (!fields.contentLanguage) fields.contentLanguage = 'en';
        setFormData((prev) => ({ ...prev, ...(fields as Partial<FormData>) }));
        if (Array.isArray(tags)) setSelectedTags(tags);
        if (typeof fields.relatedCommunity === 'string') setSelectedCommunity(fields.relatedCommunity);
        // Remount the body editor so the restored Portable Text is displayed.
        setEditorResetKey((k) => k + 1);
    };

    // On mount: load the server draft. If none exists but a legacy localStorage
    // draft is present, migrate it to the server once, then clear localStorage.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            // X7 edit mode: the Sanity doc IS the source of truth — skip drafts.
            if (editDoc) {
                if (!cancelled) {
                    const { _sanityId, _review, ...fields } = editDoc;
                    void _sanityId; void _review;
                    applyDraft(fields);
                    setIsHydrated(true);
                }
                return;
            }
            try {
                const res = await fetch('/api/case-studies/drafts');
                const serverDraft = res.ok ? (await res.json()).draft : null;

                if (serverDraft && !cancelled) {
                    setDraftId(serverDraft._id);
                    applyDraft(serverDraft);
                    toast.info(t('toasts.draftRestored'));
                } else {
                    // One-time migration of a legacy local draft.
                    const legacy = localStorage.getItem(LEGACY_DRAFT_KEY);
                    if (legacy) {
                        try {
                            const parsed = JSON.parse(legacy);
                            const legacyForm = parsed.state?.formData;
                            if (legacyForm && !cancelled) {
                                applyDraft({ ...legacyForm, selectedTags: parsed.state?.selectedTags });
                                toast.info(t('toasts.previousDraftRestored'));
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
            (formData.content && (formData.content as unknown[])?.length) ||
            selectedTags.length
        );
        if (editDoc) return; // edit mode: the Sanity doc is canonical — no personal draft writes
        if (!draftId && !hasContent) return;

        const timeoutId = setTimeout(async () => {
            setDraftStatus('saving');
            try {
                const { image, ...draftFields } = formData as Record<string, unknown>;
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
                    setDraftSavedAt(new Date().toLocaleTimeString(locale));
                    setDraftStatus('saved');
                } else {
                    setDraftStatus('error');
                }
            } catch {
                // Transient save failure — the next change will retry.
                setDraftStatus('error');
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
                block.children.some((child: { text?: string }) => child.text && child.text.trim().length > 0)
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

    const updateFormData = (field: string, value: unknown) => {
        setFormData(prev => {
            const keys = field.split('.');
            const updated = { ...prev };
            let current = updated as Record<string, unknown>;

            for (let i = 0; i < keys.length - 1; i++) {
                // Deep-clone each nesting level to avoid React state mutation
                const next = current[keys[i]];
                current[keys[i]] = Array.isArray(next)
                    ? [...next]
                    : { ...(next as Record<string, unknown> | undefined) };
                current = current[keys[i]] as Record<string, unknown>;
            }

            current[keys[keys.length - 1]] = value;
            return updated;
        });
    };

    // Validates + previews the hero image (fed by HeroImageDrop's picker/drop).
    // The binary is still only uploaded at final submit, same as before.
    const handleImageFile = (file: File) => {
        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error(t('toasts.imageInvalidType'));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('toasts.imageTooLarge'));
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
            toast.error(t('toasts.fixErrors'));
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
                ...(place ? { place } : {}),
                ...(workspaceId ? { collaborationId: workspaceId } : {}),
                ...(editDoc ? { editId: editDoc._sanityId } : {}),
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
                throw new Error(errorData.message || errorData.error || t('toasts.submitFailed'));
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
            toast.success(t('toasts.submitted'));

            if (onSuccess) {
                onSuccess(result.id);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('toasts.submitErrorGeneric');
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
                <h2 className="text-2xl font-bold">{t('successScreen.heading')}</h2>
                <div className="space-y-2 text-muted-foreground">
                    <p>{t('successScreen.submittedLine')}</p>
                    <p>{t('successScreen.reviewLine')}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setFormData({
                                title: { en: '', es: '', fr: '', ar: '' },
                                excerpt: { en: '', es: '', fr: '', ar: '' },
                                topic: '',
                                layout: 'story',
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
                            setPlace(null);
                            setSubmissionStep('form');
                            setActiveLang('en');
                            setEditorResetKey((k) => k + 1);
                        }}
                    >
                        <Plus className="w-4 h-4 me-2" />
                        {t('successScreen.submitAnother')}
                    </Button>
                    <Button asChild>
                        <a href={`/${locale}/dashboard/submissions`}>{t('successScreen.viewSubmissions')}</a>
                    </Button>
                </div>
            </div>
        );
    }

    // B1: Review step
    if (submissionStep === 'review') {
        const selectedTopicLabel = topicOptions.find(t => t.value === formData.topic)?.title || formData.topic;
        const formatDate = (value: string) => new Date(value).toLocaleDateString(locale);
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{t('review.heading')}</h2>
                        <p className="text-muted-foreground mt-1">
                            {t('review.subheading')}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => setSubmissionStep('form')}>
                        {t('review.goBack')}
                    </Button>
                </div>

                {/* Title & Topic */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {t('review.basicInfo')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('review.titleLabel')}</p>
                            <p className="font-medium" dir="auto">{formData.title?.en}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('review.topicLabel')}</p>
                            <Badge variant="secondary"><bdi>{selectedTopicLabel}</bdi></Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('review.descriptionLabel')}</p>
                            <p className="text-sm" dir="auto">{formData.excerpt?.en}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Authors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            {t('review.authorsHeading', { count: (formData.authors || []).length })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(formData.authors || []).map((author, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-medium" dir="auto">{author.name}</p>
                                        {author.email && <p className="text-sm text-muted-foreground"><bdi>{author.email}</bdi></p>}
                                    </div>
                                    <Badge variant="outline">{t(`byline.roles.${author.role}`)}</Badge>
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
                            {t('review.tagsCommunity')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map(tagId => {
                                const tag = availableTags.find(t => t._id === tagId);
                                return (
                                    <Badge key={tagId} variant="secondary">
                                        <bdi>{tag?.label?.[locale as keyof typeof tag.label] || tag?.label?.en || tagId}</bdi>
                                    </Badge>
                                );
                            })}
                        </div>
                        {selectedCommunity && (
                            <p className="text-sm text-muted-foreground">
                                {t('review.community', {
                                    name:
                                        regionalCommunities.find(c => c._id === selectedCommunity)?.name?.[
                                            locale as keyof Record<string, string>
                                        ] ||
                                        regionalCommunities.find(c => c._id === selectedCommunity)?.name?.en ||
                                        selectedCommunity,
                                })}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Context */}
                {(place || formData.locationText?.country || formData.studyPeriod?.startDate) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                {t('review.context')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {place && (
                                <p className="text-sm" dir="auto">
                                    {t('review.location', { location: place.text })}
                                </p>
                            )}
                            {!place && formData.locationText?.country && (
                                <p className="text-sm" dir="auto">
                                    {t('review.location', {
                                        location: `${formData.locationText.city ? `${formData.locationText.city}, ` : ''}${formData.locationText.country}`,
                                    })}
                                </p>
                            )}
                            {formData.studyPeriod?.startDate && (
                                <p className="text-sm">
                                    {t('review.period', {
                                        start: formatDate(formData.studyPeriod.startDate),
                                        end: formData.studyPeriod.endDate
                                            ? formatDate(formData.studyPeriod.endDate)
                                            : t('review.ongoing'),
                                    })}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {imageFile && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('review.featuredImage')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                <bdi>{imageFile.name}</bdi> {t('review.fileSize', { size: (imageFile.size / 1024).toFixed(0) })}
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Separator />

                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setSubmissionStep('form')}>
                        {t('review.goBack')}
                    </Button>
                    <Button
                        size="lg"
                        className="min-w-48"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Send className="w-4 h-4 me-2" />
                        {t('review.confirmSubmit')}
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
                <h2 className="text-2xl font-bold mb-4">{t('submittingScreen.heading')}</h2>
                <p className="text-muted-foreground">
                    {t('submittingScreen.body')}
                </p>
            </div>
        );
    }

    // ——— Form step: Task E3 editorial canvas ———
    const requiredComplete = REQUIRED_SECTIONS.every((s) => completedSections.has(s));
    const isRTLInput = activeLang === 'ar';

    // Manual save (same endpoint the debounced autosave uses).
    const saveDraftNow = async () => {
        setDraftStatus('saving');
        try {
            const { image, ...draftFields } = formData as Record<string, unknown>;
            const res = await fetch('/api/case-studies/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draftId, draftData: { ...draftFields, selectedTags } }),
            });
            if (!res.ok) throw new Error('save failed');
            const { id } = await res.json();
            if (id && !draftId) setDraftId(id);
            setDraftSavedAt(new Date().toLocaleTimeString(locale));
            setDraftStatus('saved');
            toast.success(t('toasts.draftSaved'));
        } catch {
            setDraftStatus('error');
            toast.error(t('toasts.draftSaveFailed'));
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            {/* Compact editorial header */}
            <header className="mb-8">
                <h1 className="font-heading text-2xl font-bold text-ccm-midnight">{t('title')}</h1>
                <p className="mt-1 text-muted-foreground">{t('description')}</p>
            </header>

            {/* 1 — Layout chooser (writes the caseStudy `layout` field) */}
            <LayoutChooser
                value={(formData.layout as CaseStudyLayout) || 'story'}
                onChange={(value) => updateFormData('layout', value)}
            />

            {/* 2 — Big borderless title + excerpt, with the multilingual switcher */}
            <section className="mt-10">
                <div
                    className="flex flex-wrap items-center gap-1.5"
                    role="group"
                    aria-label={t('languages.switcherLabel')}
                >
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            type="button"
                            aria-pressed={activeLang === lang.code}
                            onClick={() => setActiveLang(lang.code)}
                            className={cn(
                                'min-h-11 rounded-full px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water',
                                activeLang === lang.code
                                    ? 'bg-ccm-midnight text-white'
                                    : 'bg-muted text-muted-foreground hover:text-ccm-midnight'
                            )}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
                {activeLang !== 'en' && (
                    <p className="mt-2 text-xs text-muted-foreground">{t('languages.hint')}</p>
                )}

                <label htmlFor="cs-title" className="sr-only">
                    {t('canvas.titleLabel')}
                </label>
                <input
                    id="cs-title"
                    dir={isRTLInput ? 'rtl' : 'ltr'}
                    value={formData.title?.[activeLang] || ''}
                    onChange={(e) => updateFormData(`title.${activeLang}`, e.target.value)}
                    placeholder={t('canvas.titlePlaceholder')}
                    className="mt-4 w-full border-0 border-b-2 border-transparent bg-transparent pb-1 font-heading text-3xl font-bold leading-tight text-ccm-midnight outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ccm-water/50 sm:text-4xl md:text-5xl"
                />
                {errors['title.en'] && (
                    <p className="mt-2 text-sm text-destructive">{errors['title.en']}</p>
                )}

                <label htmlFor="cs-excerpt" className="sr-only">
                    {t('canvas.excerptLabel')}
                </label>
                <textarea
                    id="cs-excerpt"
                    dir={isRTLInput ? 'rtl' : 'ltr'}
                    rows={3}
                    value={formData.excerpt?.[activeLang] || ''}
                    onChange={(e) => updateFormData(`excerpt.${activeLang}`, e.target.value)}
                    placeholder={t('canvas.excerptPlaceholder')}
                    className="mt-4 w-full resize-none border-0 bg-transparent text-lg leading-relaxed outline-none placeholder:text-muted-foreground/40"
                />
                <p className="text-xs text-muted-foreground">{t('canvas.excerptHint')}</p>
                {errors['excerpt.en'] && (
                    <p className="mt-1 text-sm text-destructive">{errors['excerpt.en']}</p>
                )}
            </section>

            {/* 3 — Byline: author chips */}
            <section className="mt-8">
                <BylineChips
                    authors={(formData.authors || []) as BylineAuthor[]}
                    onAdd={addAuthor}
                    onUpdate={updateAuthor}
                    onRemove={removeAuthor}
                    error={errors['authors']}
                />
            </section>

            {/* 4 — Hero image drop zone */}
            <section className="mt-8">
                <HeroImageDrop
                    previewUrl={imagePreview}
                    onFile={handleImageFile}
                    onRemove={() => {
                        setImageFile(null);
                        setImagePreview(null);
                    }}
                />
            </section>

            {/* 5 — The story: Portable Text as an open canvas */}
            <section className="mt-10">
                <PortableTextEditor
                    key={editorResetKey}
                    variant="canvas"
                    value={formData.content || []}
                    onChangeAction={(value) => updateFormData('content', value)}
                    language={locale}
                    placeholder={t('canvas.bodyPlaceholder')}
                    maxLength={20000}
                />
                {errors['content'] && (
                    <p className="mt-1 text-sm text-destructive">{errors['content']}</p>
                )}
            </section>

            {/* 6 — Story details: clean two-column block (single column on mobile) */}
            <section className="mt-12 border-t pt-8">
                <h2 className="font-heading text-xl font-bold text-ccm-midnight">
                    {t('details.heading')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('details.description')}</p>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <Label>{t('details.topicLabel')} *</Label>
                        <Select
                            value={formData.topic || ''}
                            onValueChange={(value) => updateFormData('topic', value)}
                        >
                            <SelectTrigger className="mt-2 min-h-11 w-full">
                                <SelectValue placeholder={t('details.topicPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {topicOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors['topic'] && (
                            <p className="mt-1 text-sm text-destructive">{errors['topic']}</p>
                        )}
                    </div>

                    <div>
                        <Label>{t('details.communityLabel')}</Label>
                        <Select
                            value={selectedCommunity}
                            onValueChange={(value) => {
                                setSelectedCommunity(value);
                                updateFormData('relatedCommunity', value);
                            }}
                        >
                            <SelectTrigger className="mt-2 min-h-11 w-full">
                                <SelectValue placeholder={t('details.communityPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {regionalCommunities.map((community) => {
                                    const communityName =
                                        community.name?.[locale as keyof typeof community.name] ||
                                        community.name?.en ||
                                        tCommon('untitled');
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
                                className="mt-1 h-auto px-2 py-1 text-xs"
                                onClick={() => {
                                    setSelectedCommunity('');
                                    updateFormData('relatedCommunity', '');
                                }}
                            >
                                {t('details.clearCommunity')}
                            </Button>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <Label>{t('details.tagsLabel')} *</Label>
                        <p className="mt-1 text-sm text-muted-foreground">{t('details.tagsHint')}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {availableTags.map((tag) => {
                                const isSelected = selectedTags.includes(tag._id);
                                const tagLabel =
                                    tag.label?.[locale as keyof typeof tag.label] ||
                                    tag.label?.en ||
                                    tCommon('untitled');
                                return (
                                    <Button
                                        key={tag._id}
                                        type="button"
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleTagToggle(tag._id)}
                                        className="h-auto min-h-11 rounded-full py-2"
                                    >
                                        {tagLabel}
                                    </Button>
                                );
                            })}
                        </div>
                        {errors['tags'] && (
                            <p className="mt-2 text-sm text-destructive">{errors['tags']}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="cs-org">{t('byline.organizationLabel')}</Label>
                        <Input
                            id="cs-org"
                            value={formData.organizationName || ''}
                            onChange={(e) => updateFormData('organizationName', e.target.value)}
                            placeholder={t('byline.organizationPlaceholder')}
                            className="mt-2"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <PlacePicker value={place} onChange={setPlace} />
                    </div>

                    <div>
                        <Label htmlFor="cs-country">{t('details.countryLabel')}</Label>
                        <Input
                            id="cs-country"
                            value={formData.locationText?.country || ''}
                            onChange={(e) => updateFormData('locationText.country', e.target.value)}
                            placeholder={t('details.countryPlaceholder')}
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <Label htmlFor="cs-city">{t('details.cityLabel')}</Label>
                        <Input
                            id="cs-city"
                            value={formData.locationText?.city || ''}
                            onChange={(e) => updateFormData('locationText.city', e.target.value)}
                            placeholder={t('details.cityPlaceholder')}
                            className="mt-2"
                        />
                    </div>

                    {formData.locationText?.country && formData.locationText?.city && (
                        <div className="md:col-span-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="min-h-11"
                                disabled={isGeocoding}
                                onClick={async () => {
                                    if (!formData.locationText?.country || !formData.locationText?.city) return;

                                    setIsGeocoding(true);
                                    toast.info(t('toasts.searchingLocation'));

                                    const result = await geocodeLocation(
                                        formData.locationText.city,
                                        formData.locationText.country
                                    );

                                    setIsGeocoding(false);

                                    if (result.success && result.location) {
                                        updateFormData('studyLocation', result.location);
                                        toast.success(t('toasts.locationFound', {
                                            lat: result.location.lat.toFixed(4),
                                            lng: result.location.lng.toFixed(4),
                                        }));
                                    } else {
                                        toast.error(result.error || t('toasts.locationNotFound'));
                                    }
                                }}
                            >
                                {isGeocoding ? t('details.searching') : t('details.findOnMap')}
                            </Button>
                            {formData.studyLocation?.lat && formData.studyLocation?.lng && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {t('details.coordsFound')}: {formData.studyLocation.lat.toFixed(4)}, {formData.studyLocation.lng.toFixed(4)}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="cs-start">{t('details.periodStartLabel')}</Label>
                        <Input
                            id="cs-start"
                            type="date"
                            value={formData.studyPeriod?.startDate || ''}
                            onChange={(e) => updateFormData('studyPeriod.startDate', e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <Label htmlFor="cs-end">{t('details.periodEndLabel')}</Label>
                        <Input
                            id="cs-end"
                            type="date"
                            value={formData.studyPeriod?.endDate || ''}
                            onChange={(e) => updateFormData('studyPeriod.endDate', e.target.value)}
                            className="mt-2"
                        />
                        <p className="mt-1 text-sm text-muted-foreground">{t('details.periodEndHint')}</p>
                    </div>
                </div>
            </section>

            {/* 7 — Sticky bottom bar: autosave state + Preview + Submit for review */}
            <SubmitBar
                draftStatus={draftStatus}
                draftSavedAt={draftSavedAt}
                incomplete={!requiredComplete}
                isSubmitting={isSubmitting}
                onSaveDraft={() => void saveDraftNow()}
                onPreview={() => {
                    if (!validateForm()) {
                        toast.error(t('toasts.fixBeforeReview'));
                        return;
                    }
                    setSubmissionStep('review');
                }}
                onSubmit={() => void handleSubmit()}
            />
        </div>
    );
}
