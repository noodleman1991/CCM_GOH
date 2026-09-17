import { z } from 'zod'
import { LIMITS } from '@/lib/validation/limits'

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
        .replace(/^-+|-+$/g, '')
    // crypto.randomUUID over Math.random().toString(36): always yields 6 chars
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6)
    return base ? `${base}-${suffix}` : suffix
}

const optionalString = z.string().optional()

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
                en: z.string().min(1, 'English title is required').max(LIMITS.caseStudy.title),
                es: optionalString,
                fr: optionalString,
                ar: optionalString,
            })
            .passthrough(),
        excerpt: z
            .object({
                en: z.string().max(LIMITS.caseStudy.excerpt).optional(),
                es: optionalString,
                fr: optionalString,
                ar: optionalString,
            })
            .passthrough()
            .optional(),
        // Portable Text from the editor — must be a non-empty array of blocks
        content: z.array(z.record(z.unknown())).min(1, 'Content is required'),
        topic: optionalString,
        // Detail-page layout archetype (Task E3 editor shell). Optional so older
        // clients/drafts without it still submit; the route defaults to "story".
        layout: z.enum(['story', 'feature', 'report']).optional(),
        // Present when submitting from a workspace (?workspace=) — the route
        // links the created doc back as a workspace output. Authz enforced there.
        collaborationId: optionalString,
        // X7 edit mode: the Sanity _id being resubmitted. The route verifies
        // the author may edit it and patches instead of creating.
        editId: optionalString,
        authors: z
            .array(
                z
                    .object({
                        name: z.string().min(1, 'Author name is required').max(LIMITS.caseStudy.authorName),
                        email: optionalString,
                        role: optionalString,
                        userId: optionalString,
                    })
                    .passthrough()
            )
            .min(1, 'At least one author is required'),
        tags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
        organizationName: z.string().max(LIMITS.caseStudy.organizationName).optional(),
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
        // PlacePicker value (Task 4) — takes precedence over the legacy
        // locationText/studyLocation geocode pair when present.
        place: z
            .object({
                lat: z.number().gte(-90).lte(90),
                lng: z.number().gte(-180).lte(180),
                text: z.string().min(1).max(LIMITS.caseStudy.placeText),
                precision: z.enum(['exact', 'city', 'country', 'region']),
                countryCode3: z
                    .string()
                    .regex(/^[A-Z]{3}$/)
                    .nullable(),
            })
            .optional(),
    })
    .passthrough()

export type CaseStudySubmission = z.infer<typeof caseStudySubmissionSchema>

const localizedDraftText = z
    .object({ en: optionalString, es: optionalString, fr: optionalString, ar: optionalString })
    .passthrough()

/**
 * Autosave schema for /api/case-studies/drafts (audit M6). The submission
 * schema with its "required" rules relaxed — a draft is a half-typed form,
 * so `title.en` may be "", `content` `[]`, `authors` empty and an author's
 * name blank (that is exactly what the form's initial state sends) — but the
 * TYPES still hold, so a number where an object belongs, or prose where the
 * Portable Text array belongs, is refused before it reaches the CMS.
 * `passthrough` keeps the form's extra keys (`selectedTags`, `formMetadata`,
 * `contentLanguage`); `stripServerOwnedDraftKeys` removes the ones the server
 * assigns.
 */
export const caseStudyDraftSchema = caseStudySubmissionSchema
    .partial()
    .extend({
        title: localizedDraftText.optional(),
        excerpt: localizedDraftText.optional(),
        content: z.array(z.record(z.unknown())).optional(),
        authors: z
            .array(
                z
                    .object({
                        name: optionalString,
                        email: optionalString,
                        role: optionalString,
                        userId: optionalString,
                    })
                    .passthrough()
            )
            .optional(),
        tags: z.array(z.string()).optional(),
        selectedTags: z.array(z.string()).optional(),
        // The picker sets the whole value at once, but tolerate a partial
        // one: a draft that fails to save over a half-filled place is worse
        // than a draft carrying one.
        place: caseStudySubmissionSchema.shape.place.unwrap().partial().nullable().optional(),
    })
    .passthrough()

/**
 * Keys a draft author must never set. The Sanity arm's `createDocument` is
 * `writeClient.create(doc)`, which honours a caller-supplied `_id`/`_type`;
 * `userId` is the ownership column both arms filter on; `status` /
 * `moderationStatus` decide what the public sees once the draft is promoted.
 * All of them are assigned server-side in `saveCaseStudyDraft`.
 */
const SERVER_OWNED_DRAFT_KEYS = ['_id', '_type', '_rev', 'id', 'userId', 'status', 'moderationStatus', 'lastSaved'] as const

export function stripServerOwnedDraftKeys<T extends Record<string, unknown>>(draft: T): Omit<T, (typeof SERVER_OWNED_DRAFT_KEYS)[number]> {
    const copy: Record<string, unknown> = { ...draft }
    for (const key of SERVER_OWNED_DRAFT_KEYS) delete copy[key]
    return copy as Omit<T, (typeof SERVER_OWNED_DRAFT_KEYS)[number]>
}
