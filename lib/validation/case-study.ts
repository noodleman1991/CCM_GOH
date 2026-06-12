import { z } from 'zod'

/**
 * Generates a URL slug from a case study title.
 *
 * Unicode-aware: keeps letters/numbers from any script (Latin, Arabic, etc.)
 * instead of stripping them like an ASCII-only `\w` regex would. A random
 * 6-char suffix guarantees uniqueness and a non-empty slug even for
 * symbol-only titles.
 */
export function generateCaseStudySlug(title: string): string {
    const base = title
        .toLowerCase()
        .normalize('NFC')
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 96)
    const suffix = Math.random().toString(36).slice(2, 8)
    return base ? `${base}-${suffix}` : suffix
}

const optionalString = z.string().optional().or(z.literal(''))

/**
 * Server-side schema for the `data` JSON blob posted by
 * components/forms/case-study-form.tsx to /api/case-studies/submit.
 *
 * Strict on the fields whose absence crashes the route
 * (title.en, content, authors, tags); permissive elsewhere so the
 * client form can evolve without breaking submissions.
 */
export const caseStudySubmissionSchema = z
    .object({
        title: z
            .object({
                en: z.string().min(1, 'English title is required'),
                es: optionalString,
                fr: optionalString,
                ar: optionalString,
            })
            .passthrough(),
        excerpt: z
            .object({
                en: optionalString,
                es: optionalString,
                fr: optionalString,
                ar: optionalString,
            })
            .passthrough()
            .optional(),
        // Portable Text from the editor — must be a non-empty array of blocks
        content: z.array(z.record(z.unknown())).min(1, 'Content is required'),
        topic: optionalString,
        authors: z
            .array(
                z
                    .object({
                        name: z.string().min(1, 'Author name is required'),
                        email: optionalString,
                        role: optionalString,
                        userId: optionalString,
                    })
                    .passthrough()
            )
            .min(1, 'At least one author is required'),
        tags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
        organizationName: optionalString,
        relatedCommunity: optionalString,
        studyPeriod: z
            .object({
                startDate: optionalString,
                endDate: optionalString,
            })
            .passthrough()
            .optional(),
        locationText: z
            .object({
                country: optionalString,
                city: optionalString,
            })
            .passthrough()
            .optional(),
        studyLocation: z
            .object({
                lat: z.number().optional(),
                lng: z.number().optional(),
            })
            .passthrough()
            .optional(),
    })
    .passthrough()

export type CaseStudySubmission = z.infer<typeof caseStudySubmissionSchema>
