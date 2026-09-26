import { describe, it, expect } from 'vitest'
import { generateCaseStudySlug } from '@/lib/validation/case-study'

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

// The submission rules themselves are covered by case-study-rules.test.ts
// (makeCaseStudySubmissionSchema); the old permissive schema is gone.
