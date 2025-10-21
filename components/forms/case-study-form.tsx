import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useCaseStudyStore } from '@/stores/case-study-store';
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

// Rich Text Editor Component (simplified)
const SimpleRichTextEditor = ({
                                  value,
                                  onChange,
                                  language = 'en',
                                  placeholder,
                                  maxLength = 20000
                              }: {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    placeholder?: string;
    maxLength?: number;
}) => {
    const isRTL = language === 'ar';

    return (
        <div className="border rounded-lg">
            <div className="border-b bg-muted/50 p-2 text-xs text-muted-foreground">
                Rich text editor - Use simple formatting like **bold** and *italic*
            </div>
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`min-h-[200px] border-0 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                dir={isRTL ? 'rtl' : 'ltr'}
                maxLength={maxLength}
            />
            <div className="border-t p-2 text-xs text-muted-foreground text-right">
                {value.length}/{maxLength} characters
            </div>
        </div>
    );
};

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
    const [submissionStep, setSubmissionStep] = useState<'form' | 'submitting' | 'success'>('form');

    // Form state
    const [formData, setFormData] = useState<Partial<FormData>>({
        title: { en: '', es: '', fr: '', ar: '' },
        excerpt: { en: '', es: '', fr: '', ar: '' },
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

    // Load saved draft from localStorage on mount (client-side only)
    useEffect(() => {
        const savedData = localStorage.getItem('case-study-submission');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.state?.formData) {
                    const savedFormData = parsed.state.formData;
                    // Ensure contentLanguage has a default
                    if (!savedFormData.contentLanguage) {
                        savedFormData.contentLanguage = 'en';
                    }
                    setFormData(savedFormData);
                    setSelectedTags(parsed.state.selectedTags || []);
                    // Restore imagePreview from the correct location
                    if (parsed.state.imagePreview) {
                        setImagePreview(parsed.state.imagePreview);
                    }
                    console.log('📋 Draft restored from localStorage');
                    toast.info('Your previous draft has been restored');
                }
            } catch (error) {
                console.error('Failed to load draft:', error);
            }
        }
        setIsHydrated(true);
    }, []);

    // Auto-save to localStorage on form changes (debounced)
    useEffect(() => {
        if (!isHydrated) return; // Don't save on initial mount

        const timeoutId = setTimeout(() => {
            try {
                const dataToSave = {
                    state: {
                        formData: formData,
                        selectedTags,
                        imagePreview, // Keep separate from formData
                        currentLanguage: 'en',
                        currentStep: 'form'
                    }
                };
                localStorage.setItem('case-study-submission', JSON.stringify(dataToSave));
                console.log('💾 Draft auto-saved');
            } catch (error) {
                console.error('Failed to save draft:', error);
            }
        }, 1000); // Debounce 1 second

        return () => clearTimeout(timeoutId);
    }, [formData, selectedTags, imagePreview, isHydrated]);

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
        const hasBasic = formData.title?.en && formData.excerpt?.en && (formData.excerpt.en?.length || 0) >= 100;
        if (hasBasic) {
            newCompleted.add('basic');
        }
        console.log('📝 Basic section:', hasBasic ? '✅' : '❌', {
            hasTitle: !!formData.title?.en,
            hasExcerpt: !!formData.excerpt?.en,
            excerptLength: formData.excerpt?.en?.length || 0
        });

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
        console.log('📝 Content section:', hasContent ? '✅' : '❌', {
            hasContent: !!formData.content,
            contentBlocks: Array.isArray(formData.content) ? formData.content.length : 0
        });

        // Authors section
        const hasAuthors = formData.authors && formData.authors.length > 0 &&
            formData.authors.every(author => author.name && author.role);
        if (hasAuthors) {
            newCompleted.add('authors');
        }
        console.log('📝 Authors section:', hasAuthors ? '✅' : '❌', {
            count: formData.authors?.length || 0,
            allValid: formData.authors?.every(author => author.name && author.role)
        });

        // Topics section
        const hasTopics = selectedTags.length > 0;
        if (hasTopics) {
            newCompleted.add('topics');
        }
        console.log('📝 Topics section:', hasTopics ? '✅' : '❌', {
            tagCount: selectedTags.length
        });

        // Context section (optional)
        newCompleted.add('context');

        console.log('📊 Total completed sections:', newCompleted.size, '/', 4, 'required');
        setCompletedSections(newCompleted);
    }, [formData, selectedTags]);

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => {
            const keys = field.split('.');
            const updated = { ...prev };
            let current: any = updated;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
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
            console.log('📤 Submitting case study...');

            // Prepare submission data
            const submissionData = {
                ...formData,
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
                console.log('📷 Image attached:', imageFile.name, `(${(imageFile.size / 1024).toFixed(2)} KB)`);
            }

            // Submit to API
            console.log('🚀 Sending to /api/case-studies/submit...');
            const response = await fetch('/api/case-studies/submit', {
                method: 'POST',
                body: apiFormData,
            });

            console.log('📡 Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Submission failed:', errorData);
                throw new Error(errorData.message || errorData.error || 'Submission failed');
            }

            const result = await response.json();
            console.log('✅ Case study created:', result);

            // Clear saved draft from localStorage
            localStorage.removeItem('case-study-submission');
            console.log('🗑️ Draft cleared from localStorage');

            setSubmissionStep('success');
            toast.success('Thank you! Your case study has been submitted for review.');

            if (onSuccess) {
                onSuccess(result.id);
            }

            // Reset form after delay
            setTimeout(() => {
                setFormData({
                    title: { en: '', es: '', fr: '', ar: '' },
                    excerpt: { en: '', es: '', fr: '', ar: '' },
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
            }, 3000);

        } catch (error) {
            console.error('💥 Submission error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
            toast.error(errorMessage);
            setSubmissionStep('form');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success screen
    if (submissionStep === 'success') {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
                <p className="text-muted-foreground mb-6">
                    Your case study has been submitted successfully. Our team will review it and publish it on the platform once approved.
                </p>
                <Button onClick={() => setSubmissionStep('form')}>
                    Submit Another Case Study
                </Button>
            </div>
        );
    }

    // Submitting screen
    if (submissionStep === 'submitting') {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-blue-600 animate-spin" />
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
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {isCompleted ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <section.icon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
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

                                            {/* Optional translations section */}
                                            <div className="border rounded-lg p-4 bg-blue-50/50">
                                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-blue-600" />
                                                    Help us reach more researchers (optional)
                                                </h4>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    If you can provide translations, it helps researchers who speak other languages discover your work
                                                </p>

                                                <div className="grid gap-4">
                                                    {languages.filter(lang => lang.code !== 'en').map((lang) => (
                                                        <div key={lang.code} className="space-y-2">
                                                            <Label className="text-sm">{lang.label} Translation</Label>
                                                            <Input
                                                                placeholder={`Title in ${lang.label} (optional)`}
                                                                value={formData.title?.[lang.code as keyof typeof formData.title] || ''}
                                                                onChange={(e) => updateFormData(`title.${lang.code}`, e.target.value)}
                                                            />
                                                            <Textarea
                                                                rows={2}
                                                                placeholder={`Brief description in ${lang.label} (optional)`}
                                                                value={formData.excerpt?.[lang.code as keyof typeof formData.excerpt] || ''}
                                                                onChange={(e) => updateFormData(`excerpt.${lang.code}`, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
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
                                                            className="absolute top-2 right-2"
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
                                                        <p className="text-sm text-gray-600 mb-2">
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
                                                            className="cursor-pointer inline-flex items-center px-4 py-2 bg-[#0B3160] text-white rounded-md text-sm hover:bg-[#0B3160]/90 font-poppins font-bold"
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
                                                <Plus className="w-4 h-4 mr-2" />
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
                                                            <X className="w-4 h-4 mr-2" />
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

            <div className="flex justify-center">
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || completedSections.size < 4}
                    size="lg"
                    className="min-w-48"
                >
                    {isSubmitting ? (
                        <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Case Study
                        </>
                    )}
                </Button>
            </div>

            {completedSections.size < 4 && (
                <div className="text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Please complete all required sections to submit
                    </p>
                </div>
            )}
        </div>
    );
}
