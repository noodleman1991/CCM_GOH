import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PortableTextBlock } from '@portabletext/types'

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
    userId?: string
    affiliation?: {
        _ref: string
        _type: 'reference'
    }
}

export interface StudyPeriod {
    startDate?: string
    endDate?: string
}

export interface StudyLocation {
    lat?: number
    lng?: number
    alt?: number
}

export interface StudyArea {
    location: StudyLocation
    name: string
    description?: string
}

export interface CaseStudyFormData {
    title: LocalizedString
    excerpt: LocalizedString
    topic?: string
    content?: PortableTextBlock[]
    authors: CaseStudyAuthor[]
    organizationName?: string
    tags: string[]
    studyPeriod: StudyPeriod
    studyLocation?: StudyLocation
    studyAreas?: StudyArea[]
    organizations?: string[]
    projects?: string[]
    relatedCommunity?: string
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

    // Draft management
    isDraftSaving: boolean
    lastSaved?: Date
    draftId?: string
    hasPendingChanges: boolean

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

    // Draft management
    deleteDraft: () => Promise<void>
    markChanges: () => void

    // Reset
    resetForm: () => void

    // Validation helpers
    isFormValid: () => boolean
    getValidationErrors: () => string[]
}

const initialFormData: CaseStudyFormData = {
    title: { en: '', es: '', fr: '', ar: '' },
    excerpt: { en: '', es: '', fr: '', ar: '' },
    topic: '',
    content: undefined,
    authors: [],
    organizationName: '',
    tags: [],
    studyPeriod: {},
    studyLocation: undefined,
    studyAreas: [],
    organizations: [],
    projects: [],
    relatedCommunity: '',
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
            isDraftSaving: false,
            lastSaved: undefined,
            draftId: undefined,
            hasPendingChanges: false,

            // Actions
            setFormData: (data) =>
                set((state) => ({
                    formData: { ...state.formData, ...data },
                    hasPendingChanges: true
                })),

            updateField: (field, value) =>
                set((state) => ({
                    formData: { ...state.formData, [field]: value },
                    hasPendingChanges: true
                })),

            setCurrentStep: (step) => set({ currentStep: step }),

            setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

            setSelectedTags: (tags) =>
                set((state) => ({
                    selectedTags: tags,
                    formData: { ...state.formData, tags },
                    hasPendingChanges: true
                })),

            setCurrentLanguage: (language) => set({ currentLanguage: language }),

            setImageFile: (file, preview) =>
                set((state) => ({
                    formData: {
                        ...state.formData,
                        image: file || undefined,
                        imagePreview: preview || undefined
                    },
                    hasPendingChanges: true
                })),

            addAuthor: (author) =>
                set((state) => ({
                    formData: {
                        ...state.formData,
                        authors: [...state.formData.authors, author]
                    },
                    hasPendingChanges: true
                })),

            removeAuthor: (index) =>
                set((state) => ({
                    formData: {
                        ...state.formData,
                        authors: state.formData.authors.filter((_, i) => i !== index)
                    },
                    hasPendingChanges: true
                })),

            updateAuthor: (index, updatedAuthor) =>
                set((state) => ({
                    formData: {
                        ...state.formData,
                        authors: state.formData.authors.map((author, i) =>
                            i === index ? { ...author, ...updatedAuthor } : author
                        )
                    },
                    hasPendingChanges: true
                })),

            markChanges: () => set({ hasPendingChanges: true }),

            deleteDraft: async () => {
                const { draftId } = get()
                if (!draftId) return

                try {
                    const response = await fetch('/api/case-studies/drafts', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ draftId })
                    })

                    if (!response.ok) {
                        throw new Error('Failed to delete draft')
                    }

                    set({
                        draftId: undefined,
                        lastSaved: undefined,
                        hasPendingChanges: false
                    })
                } catch (error) {
                    console.error('Failed to delete draft:', error)
                    throw error
                }
            },

            resetForm: () =>
                set({
                    formData: initialFormData,
                    currentStep: 'form',
                    isSubmitting: false,
                    selectedTags: [],
                    currentLanguage: 'en',
                    isDraftSaving: false,
                    lastSaved: undefined,
                    draftId: undefined,
                    hasPendingChanges: false
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

                // Check required title fields (at least English)
                if (!formData.title.en?.trim()) {
                    errors.push('English title is required')
                }

                // Check excerpt (at least English)
                if (!formData.excerpt.en?.trim() || formData.excerpt.en.length < 50) {
                    errors.push('English excerpt must be at least 50 characters')
                }

                // Check topic
                if (!formData.topic?.trim()) {
                    errors.push('Topic/domain is required')
                }

                // Check content (Portable Text)
                if (!formData.content || formData.content.length === 0) {
                    errors.push('Case study content is required')
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
            storage: createJSONStorage(() => localStorage),
            skipHydration: true, // Important for Next.js SSR
            partialize: (state) => ({
                formData: {
                    ...state.formData,
                    // Don't persist File objects - they can't be serialized
                    image: undefined,
                    imagePreview: state.formData.imagePreview
                },
                selectedTags: state.selectedTags,
                currentLanguage: state.currentLanguage,
                currentStep: state.currentStep,
                draftId: state.draftId,
                lastSaved: state.lastSaved
            })
        }
    )
)
