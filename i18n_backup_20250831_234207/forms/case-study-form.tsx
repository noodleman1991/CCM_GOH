import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
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
    content: z.string().min(500, "Please share the details of your case study (at least 500 characters)"),
    contentLanguage: z.enum(['en', 'es', 'fr', 'ar'], {
        required_error: "Please select the language you're writing in",
    }),
    authors: z.array(z.object({
        name: z.string().min(2, "Please enter the author's full name"),
        email: z.string().email("Please enter a valid email address"),
        role: z.enum(['lead', 'coauthor', 'contributor', 'advisor']),
    })).min(1, "At least one author is required"),
    organizationName: z.string().optional(),
    tags: z.array(z.string()).min(1, "Please select at least one relevant topic"),
    studyPeriod: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }).optional(),
    location: z.object({
        country: z.string().optional(),
        city: z.string().optional(),
    }).optional(),
    image: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const authorRoles = [
    { value: 'lead', label: 'Lead Author', description: 'Primary researcher' },
    { value: 'coauthor', label: 'Co-Author', description: 'Equal contributor' },
    { value: 'contributor', label: 'Contributor', description: 'Supporting role' },
    { value: 'advisor', label: 'Advisor', description: 'Guidance provider' },
];

// Mock tags - replace with actual API call
const availableTags = [
    { _id: '1', title: { en: 'Climate Change', es: 'Cambio Climático', fr: 'Changement Climatique', ar: 'تغير المناخ' } },
    { _id: '2', title: { en: 'Mental Health', es: 'Salud Mental', fr: 'Santé Mentale', ar: 'الصحة النفسية' } },
    { _id: '3', title: { en: 'Community Health', es: 'Salud Comunitaria', fr: 'Santé Communautaire', ar: 'صحة المجتمع' } },
    { _id: '4', title: { en: 'Youth Engagement', es: 'Participación Juvenil', fr: 'Engagement des Jeunes', ar: 'مشاركة الشباب' } },
    { _id: '5', title: { en: 'Policy Research', es: 'Investigación de Políticas', fr: 'Recherche Politique', ar: 'بحوث السياسات' } },
];

// Rich Text Editor Component (simplified)
const SimpleRichTextEditor = ({
                                  value,
                                  onChange,
                                  language = 'en',
                                  placeholder,
                                  maxLength = 10000
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
    onSuccess?: (id: string) => void;
}

const sections = [
    { id: 'basic', title: 'Basic Information', icon: FileText, required: true },
    { id: 'content', title: 'Case Study Details', icon: FileText, required: true },
    { id: 'authors', title: 'Authors & Team', icon: Users, required: true },
    { id: 'topics', title: 'Topics & Tags', icon: Tag, required: true },
    { id: 'context', title: 'Context & Location', icon: MapPin, required: false },
];

export default function ImprovedCaseStudyForm({
                                                  userId,
                                                  locale = 'en',
                                                  onSuccess
                                              }: ImprovedCaseStudyFormProps) {
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const [openSection, setOpenSection] = useState<string>('basic');
    const [submissionStep, setSubmissionStep] = useState<'form' | 'submitting' | 'success'>('form');

    // Form state
    const [formData, setFormData] = useState<Partial<FormData>>({
        title: { en: '', es: '', fr: '', ar: '' },
        excerpt: { en: '', es: '', fr: '', ar: '' },
        content: '',
        contentLanguage: 'en' as const,
        authors: user ? [{
            name: user.fullName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
            role: 'lead' as const,
        }] : [],
        organizationName: '',
        tags: [],
        studyPeriod: { startDate: '', endDate: '' },
        location: { country: '', city: '' },
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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
        if (formData.title?.en && formData.excerpt?.en && (formData.excerpt.en?.length || 0) >= 100) {
            newCompleted.add('basic');
        }

        // Content section
        if (formData.content && formData.content.length >= 500 && formData.contentLanguage) {
            newCompleted.add('content');
        }

        // Authors section
        if (formData.authors && formData.authors.length > 0 &&
            formData.authors.every(author => author.name && author.email && author.role)) {
            newCompleted.add('authors');
        }

        // Topics section
        if (selectedTags.length > 0) {
            newCompleted.add('topics');
        }

        // Context section (optional)
        newCompleted.add('context');

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

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            setSubmissionStep('success');
            toast.success('Thank you! Your case study has been submitted for review.');

            if (onSuccess) {
                onSuccess('mock-id');
            }

            // Reset form after delay
            setTimeout(() => {
                setFormData({
                    title: { en: '', es: '', fr: '', ar: '' },
                    excerpt: { en: '', es: '', fr: '', ar: '' },
                    content: '',
                    contentLanguage: 'en' as const,
                    authors: [],
                    organizationName: '',
                    tags: [],
                    studyPeriod: { startDate: '', endDate: '' },
                    location: { country: '', city: '' },
                });
                setSelectedTags([]);
                setImageFile(null);
                setImagePreview(null);
                setSubmissionStep('form');
                setOpenSection('basic');
            }, 3000);

        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Something went wrong. Please try again.');
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
                                                            <Label className="text-sm">{lang.flag} {lang.label} Translation</Label>
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
                                        <div className="flex gap-4">
                                            <div className="w-48">
                                                <Label>Writing Language *</Label>
                                                <Select
                                                    value={formData.contentLanguage || 'en'}
                                                    onValueChange={(value) => updateFormData('contentLanguage', value)}
                                                >
                                                    <SelectTrigger className="mt-2">
                                                        <SelectValue placeholder="Select language" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {languages.map((lang) => (
                                                            <SelectItem key={lang.code} value={lang.code}>
                                                                {lang.flag} {lang.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Case Study Details *</Label>
                                            <div className="mt-2">
                                                <SimpleRichTextEditor
                                                    value={formData.content || ''}
                                                    onChange={(value) => updateFormData('content', value)}
                                                    language={formData.contentLanguage}
                                                    placeholder="Share the details of your case study - methodology, findings, challenges, successes, and lessons learned..."
                                                    maxLength={10000}
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Tell your story! Include methodology, findings, challenges, and lessons learned (minimum 500 characters)
                                            </p>
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
                                                            className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
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
                                                            <Label>Email Address *</Label>
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
                                                                            <div>
                                                                                <div className="font-medium">{role.label}</div>
                                                                                <div className="text-xs text-muted-foreground">{role.description}</div>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    {index > 0 && (
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
                                        <div>
                                            <Label className="text-base font-medium mb-4 block">
                                                Select Relevant Topics *
                                            </Label>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Choose topics that best describe your case study to help others discover it
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {availableTags.map((tag) => {
                                                    const isSelected = selectedTags.includes(tag._id);
                                                    const tagTitle = tag.title[locale as keyof typeof tag.title] || tag.title.en;

                                                    return (
                                                        <Button
                                                            key={tag._id}
                                                            type="button"
                                                            variant={isSelected ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleTagToggle(tag._id)}
                                                            className="h-auto py-2"
                                                        >
                                                            {tagTitle}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            {selectedTags.length === 0 && (
                                                <p className="text-sm text-destructive mt-2">
                                                    Please select at least one topic
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

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Country</Label>
                                                <Input
                                                    value={formData.location?.country || ''}
                                                    onChange={(e) => updateFormData('location.country', e.target.value)}
                                                    placeholder="Where was this study conducted?"
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>City/Region</Label>
                                                <Input
                                                    value={formData.location?.city || ''}
                                                    onChange={(e) => updateFormData('location.city', e.target.value)}
                                                    placeholder="Specific location"
                                                    className="mt-2"
                                                />
                                            </div>
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
