import { describe, it, expect } from 'vitest'
import { caseStudySubmissionSchema, generateCaseStudySlug } from '@/lib/validation/case-study'

describe('generateCaseStudySlug', () => {
    it('slugifies latin titles', () => {
        expect(generateCaseStudySlug('My Great Study!')).toMatch(/^my-great-study-[a-z0-9]{6}$/)
    })

    it('preserves unicode letters', () => {
        expect(generateCaseStudySlug('Estudio de São Paulo')).toContain('são-paulo')
        expect(generateCaseStudySlug('دراسة حالة').length).toBeGreaterThan(7)
    })

    it('handles symbol-only titles', () => {
        expect(generateCaseStudySlug('!!!')).toMatch(/^[a-z0-9]{6}$/)
    })

    it('collapses whitespace and dashes', () => {
        expect(generateCaseStudySlug('a  --  b')).toMatch(/^a-b-[a-z0-9]{6}$/)
    })

    it('joins a dash-terminated title with a single dash', () => {
        expect(generateCaseStudySlug('abc-')).toMatch(/^abc-[a-z0-9]{6}$/)
    })

    it('produces different suffixes across calls', () => {
        expect(generateCaseStudySlug('same title')).not.toBe(generateCaseStudySlug('same title'))
    })
})

// Mirrors what the client form (components/forms/case-study-form.tsx) actually
// posts as the `data` JSON blob in the multipart request.
const validPayload = {
    title: { en: 'Community Heat Resilience in Karachi', es: '', fr: '', ar: '' },
    excerpt: {
        en: 'A long enough excerpt describing the study in detail so that readers understand what it covers and why it matters for communities.',
    },
    content: [
        {
            _type: 'block',
            _key: 'a1',
            style: 'normal',
            children: [{ _type: 'span', _key: 's1', text: 'Body text', marks: [] }],
            markDefs: [],
        },
    ],
    topic: 'health',
    authors: [{ name: 'Jane Doe', email: 'jane@example.com', role: 'lead' }],
    tags: ['tag-id-1'],
    organizationName: '',
    relatedCommunity: '',
    studyPeriod: { startDate: '', endDate: '' },
    locationText: { country: 'Pakistan', city: 'Karachi' },
    studyLocation: {},
}

describe('caseStudySubmissionSchema', () => {
    it('rejects empty payload', () => {
        expect(caseStudySubmissionSchema.safeParse({}).success).toBe(false)
    })

    it('accepts a realistic form submission', () => {
        const result = caseStudySubmissionSchema.safeParse(validPayload)
        expect(result.success).toBe(true)
    })

    it('rejects a missing english title', () => {
        const result = caseStudySubmissionSchema.safeParse({ ...validPayload, title: { es: 'hola' } })
        expect(result.success).toBe(false)
    })

    it('rejects non-array tags', () => {
        const result = caseStudySubmissionSchema.safeParse({ ...validPayload, tags: 'not-an-array' })
        expect(result.success).toBe(false)
    })

    it('rejects empty authors array', () => {
        const result = caseStudySubmissionSchema.safeParse({ ...validPayload, authors: [] })
        expect(result.success).toBe(false)
    })

    it('rejects missing content', () => {
        const rest: Partial<typeof validPayload> = { ...validPayload }
        delete rest.content
        const result = caseStudySubmissionSchema.safeParse(rest)
        expect(result.success).toBe(false)
    })

    it('tolerates unknown extra fields without failing', () => {
        const result = caseStudySubmissionSchema.safeParse({ ...validPayload, somethingNew: true })
        expect(result.success).toBe(true)
    })

    it('allows optional sections to be omitted', () => {
        const minimal = {
            title: validPayload.title,
            excerpt: validPayload.excerpt,
            content: validPayload.content,
            topic: validPayload.topic,
            authors: validPayload.authors,
            tags: validPayload.tags,
        }
        expect(caseStudySubmissionSchema.safeParse(minimal).success).toBe(true)
    })
})
