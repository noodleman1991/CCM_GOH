import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LocalizedString {
    en: string
    es: string
    fr: string
    ar: string
}

export interface CaseStudyAuthor {
    name: string
    email: string
    role: 'lead' | 'coauthor' | 'contributor' | 'advisor'
}

export interface StudyPeriod {
    startDate?: string
    endDate?: string
}

export interface StudyLocation {
    country?: string
    city?: string
    region?: string
}

export interface CaseStudyFormData {
    title: LocalizedString
    subtitle: Partial<LocalizedString>
    excerpt: LocalizedString
    content: Partial<LocalizedString>
    authors: CaseStudyAuthor[]
    organizationName?: string
    tags: string[]
    studyPeriod: StudyPeriod
    location: StudyLocation
    image?: File
    imagePreview?: string
}

export interface CaseStudyStore {
    // Form data
    formData: CaseStudyFormData

    // UI state
    currentStep: 'form' | 'review'
    isSubmitting: boolean
    selectedTags: string[]
    currentLanguage: string

    // Actions
    setFormData: (data: Partial<CaseStudyFormData>) => void
    updateField: <K extends keyof CaseStudyFormData>(field: K, value: CaseStudyFormData[K]) => void
    setCurrentStep: (step: 'form' | 'review') => void
    setIsSubmitting: (submitting: boolean) => void
    setSelectedTags: (tags: string[]) => void
    setCurrentLanguage: (language: string) => void
    setImageFile: (file: File | null, preview: string | null) => void

    // Complex actions
    addAuthor: (author: CaseStudyAuthor) => void
    removeAuthor: (index: number) => void
    updateAuthor: (index: number, author: Partial<CaseStudyAuthor>) => void

    // Reset
    resetForm: () => void

    // Validation helpers
    isFormValid: () => boolean
    getValidationErrors: () => string[]
}

const initialFormData: CaseStudyFormData = {
    title: { en: '', es: '', fr: '', ar: '' },
    subtitle: { en: '', es: '', fr: '', ar: '' },
    excerpt: { en: '', es: '', fr: '', ar: '' },
    content: { en: '', es: '', fr: '', ar: '' },
    authors: [],
    organizationName: '',
    tags: [],
    studyPeriod: {},
    location: {},
}

export const useCaseStudyStore = create<CaseStudyStore>()(
    persist(
        (set, get) => ({
            // Initial state
            formData: initialFormData,
            currentStep: 'form',
            isSubmitting: false,
            selectedTags: [],
            currentLanguage: 'en',

            // Actions
            setFormData: (data) =>
                set((state) => ({
                    formData: { ...state.formData, ...data }
                })),

            updateField: (field, value) =>
                set((state) => ({
                    formData: { ...state.formData, [field]: value }
                })),

            setCurrentStep: (step) => set({ currentStep: step }),

            setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

            setSelectedTags: (tags) =>
                set((state) => ({
                    selectedTags: tags,
                    formData: { ...state.formData, tags }
                })),

            setCurrentLanguage: (language) => set({ currentLanguage: language }),

            setImageFile: (file, preview) =>
                set((state) => ({
                    formData: {
                        ...state.formData,
                        image: file || undefined,
                        imagePreview: preview || undefined
                    }
                })),

            addAuthor: (author) =>
                set((state) => ({
                    formData: {
                        ...state.formData,
                        authors: [...state.formData.authors, author]
                    }
                })),

            removeAuthor: (index) =>
                set((state) => ({
                    formData: {
                        ...state.formData,
                        authors: state.formData.authors.filter((_, i) => i !== index)
                    }
                })),

            updateAuthor: (index, updatedAuthor) =>
                set((state) => ({
                    formData: {
                        ...state.formData,
                        authors: state.formData.authors.map((author, i) =>
                            i === index ? { ...author, ...updatedAuthor } : author
                        )
                    }
                })),

            resetForm: () =>
                set({
                    formData: initialFormData,
                    currentStep: 'form',
                    isSubmitting: false,
                    selectedTags: [],
                    currentLanguage: 'en'
                }),

            // Validation
            isFormValid: () => {
                const { formData } = get()
                const errors = get().getValidationErrors()
                return errors.length === 0
            },

            getValidationErrors: () => {
                const { formData } = get()
                const errors: string[] = []

                // Check required title fields
                const languages = ['en', 'es', 'fr', 'ar'] as const
                languages.forEach(lang => {
                    if (!formData.title[lang]?.trim()) {
                        errors.push(`Title in ${lang.toUpperCase()} is required`)
                    }
                    if (!formData.excerpt[lang]?.trim() || formData.excerpt[lang].length < 50) {
                        errors.push(`Excerpt in ${lang.toUpperCase()} must be at least 50 characters`)
                    }
                })

                // Check at least one content language
                const hasContent = languages.some(lang =>
                    formData.content[lang] && formData.content[lang]!.length >= 200
                )
                if (!hasContent) {
                    errors.push('Please provide detailed content in at least one language (minimum 200 characters)')
                }

                // Check authors
                if (formData.authors.length === 0) {
                    errors.push('At least one author is required')
                }

                formData.authors.forEach((author, index) => {
                    if (!author.name?.trim()) {
                        errors.push(`Author ${index + 1} name is required`)
                    }
                    if (!author.email?.trim() || !author.email.includes('@')) {
                        errors.push(`Author ${index + 1} email is invalid`)
                    }
                })

                // Check tags
                if (formData.tags.length === 0) {
                    errors.push('At least one tag is required')
                }

                return errors
            }
        }),
        {
            name: 'case-study-submission',
            partialize: (state) => ({
                formData: state.formData,
                selectedTags: state.selectedTags,
                currentLanguage: state.currentLanguage,
                currentStep: state.currentStep
            })
        }
    )
)
