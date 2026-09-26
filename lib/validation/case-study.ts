import { z } from 'zod'
import { LIMITS } from '@/lib/validation/limits'
import { ERROR_KEYS as K } from '@/lib/validation/error-keys'

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
const legacyCaseStudySubmissionSchema = z
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
        // Free-text tag suggestions; the route de-duplicates them against existing tags.
        suggestedTags: z.array(z.string().trim().min(1).max(LIMITS.tags.suggestion)).max(LIMITS.tags.suggestions).optional().default([]),
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

// Legacy: still used by the submit route until it moves to makeCaseStudySubmissionSchema.
export const caseStudySubmissionSchema = legacyCaseStudySubmissionSchema
export type LegacyCaseStudySubmission = z.infer<typeof legacyCaseStudySubmissionSchema>

export const WRITING_LANGUAGES = ['en', 'es', 'fr', 'ar'] as const
export type WritingLanguage = (typeof WRITING_LANGUAGES)[number]

export const CASE_STUDY_MINIMUMS = { title: 5, summary: 50, englishSummary: 20 } as const

// Types only: every rule lives in superRefine so all problems are reported at once.
const localizedText = () =>
    z.object({ en: optionalString, es: optionalString, fr: optionalString, ar: optionalString }).passthrough()

export const placeSchema = z.object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    text: z.string().min(1).max(LIMITS.caseStudy.placeText),
    precision: z.enum(['exact', 'city', 'country', 'region']),
    countryCode3: z.string().regex(/^[A-Z]{3}$/).nullable(),
    country: z.string().max(LIMITS.caseStudy.placeName).optional(),
    city: z.string().max(LIMITS.caseStudy.placeName).optional(),
})

/** True when a Portable Text body has at least one span with real text. */
export function hasStoryText(content: unknown): boolean {
    return (
        Array.isArray(content) &&
        content.some(
            (block) =>
                block?._type === 'block' &&
                Array.isArray(block.children) &&
                block.children.some((child: { text?: unknown }) => typeof child?.text === 'string' && child.text.trim().length > 0),
        )
    )
}

const authorSchema = z
    .object({ name: z.string().default(''), email: optionalString, role: optionalString, userId: optionalString })
    .passthrough()

const EMAIL = z.string().email()

const baseShape = {
    originalLanguage: z.enum(WRITING_LANGUAGES).default('en'),
    title: localizedText(),
    excerpt: localizedText().optional(),
    content: z.array(z.record(z.unknown())),
    layout: z.enum(['story', 'feature', 'report']).optional(),
    collaborationId: optionalString,
    editId: optionalString,
    authors: z.array(authorSchema),
    tags: z.array(z.string().min(1)),
    suggestedTags: z.array(z.string().trim().min(1).max(LIMITS.tags.suggestion)).max(LIMITS.tags.suggestions).optional().default([]),
    organizationName: optionalString,
    relatedCommunity: optionalString,
    studyPeriod: z.object({ startDate: optionalString, endDate: optionalString }).passthrough().optional(),
    place: placeSchema.nullable().optional(),
    imageAssetId: optionalString,
}

const caseStudyBase = z.object(baseShape).passthrough()

const blank = (value: string | undefined) => !value || value.trim().length === 0

/**
 * The one case study rule set, shared by the browser form and the submit
 * route. Messages are ERROR_KEYS (translated by the form), and every problem
 * is reported at once.
 */
export function makeCaseStudySubmissionSchema({ themeTagIds }: { themeTagIds: ReadonlySet<string> }) {
    return caseStudyBase.superRefine((data, ctx) => {
        const lang = data.originalLanguage
        const title = data.title[lang]
        const summary = data.excerpt?.[lang]
        const add = (path: (string | number)[], message: string, params?: Record<string, number>) =>
            ctx.addIssue({ code: z.ZodIssueCode.custom, path, message, ...(params ? { params } : {}) })

        if (blank(title)) add(['title', lang], K.titleRequired)
        else if (title!.trim().length < CASE_STUDY_MINIMUMS.title) add(['title', lang], K.titleTooShort, { min: CASE_STUDY_MINIMUMS.title })

        if (blank(summary)) add(['excerpt', lang], K.summaryRequired)
        else if (summary!.trim().length < CASE_STUDY_MINIMUMS.summary) add(['excerpt', lang], K.summaryTooShort, { min: CASE_STUDY_MINIMUMS.summary })

        if (lang !== 'en') {
            if ((data.title.en?.trim().length ?? 0) < CASE_STUDY_MINIMUMS.title) add(['title', 'en'], K.englishTitleRequired)
            if ((data.excerpt?.en?.trim().length ?? 0) < CASE_STUDY_MINIMUMS.englishSummary)
                add(['excerpt', 'en'], K.englishSummaryTooShort, { min: CASE_STUDY_MINIMUMS.englishSummary })
        }

        if (!hasStoryText(data.content)) add(['content'], K.storyRequired)
        if (!data.tags.some((id) => themeTagIds.has(id))) add(['tags'], K.themeRequired)
        if (!data.place && blank(data.relatedCommunity)) add(['location'], K.locationRequired)

        const { startDate, endDate } = data.studyPeriod ?? {}
        if (startDate && endDate && endDate < startDate) add(['studyPeriod', 'endDate'], K.endBeforeStart)

        for (const l of WRITING_LANGUAGES) {
            if ((data.title[l]?.length ?? 0) > LIMITS.caseStudy.title) add(['title', l], K.tooLong, { max: LIMITS.caseStudy.title })
            if ((data.excerpt?.[l]?.length ?? 0) > LIMITS.caseStudy.excerpt) add(['excerpt', l], K.tooLong, { max: LIMITS.caseStudy.excerpt })
        }
        if (data.authors.length === 0) add(['authors'], K.authorsRequired)
        data.authors.forEach((author, i) => {
            if (blank(author.name)) add(['authors', i, 'name'], K.authorNameRequired)
            else if (author.name.length > LIMITS.caseStudy.authorName) add(['authors', i, 'name'], K.tooLong, { max: LIMITS.caseStudy.authorName })
            if (author.email && author.email.trim() && !EMAIL.safeParse(author.email.trim()).success) add(['authors', i, 'email'], K.authorEmail)
        })
        if ((data.organizationName?.length ?? 0) > LIMITS.caseStudy.organizationName)
            add(['organizationName'], K.tooLong, { max: LIMITS.caseStudy.organizationName })
    })
}

export type CaseStudySubmission = z.infer<ReturnType<typeof makeCaseStudySubmissionSchema>>

/** Page order of every checked field, for "focus the first problem". */
export function caseStudyFieldOrder(lang: WritingLanguage, authorCount: number): string[] {
    const authors = Array.from({ length: authorCount }, (_, i) => [`authors.${i}.name`, `authors.${i}.email`]).flat()
    return [
        `title.${lang}`, `excerpt.${lang}`, 'content',
        ...(lang === 'en' ? [] : ['title.en', 'excerpt.en']),
        'authors', ...authors, 'organizationName',
        'location', 'studyPeriod.endDate', 'tags',
    ]
}

/**
 * Autosave schema for /api/case-studies/drafts (audit M6): the same fields
 * with every rule relaxed. A draft requires nothing, but the TYPES still hold,
 * so a number where an object belongs, or prose where the Portable Text array
 * belongs, is refused before it reaches the CMS. `passthrough` keeps the
 * form's extra keys; `stripServerOwnedDraftKeys` removes the ones the server
 * assigns.
 */
export const caseStudyDraftSchema = caseStudyBase
    .partial()
    .extend({
        title: localizedText().optional(),
        excerpt: localizedText().optional(),
        content: z.array(z.record(z.unknown())).optional(),
        authors: z.array(z.object({ name: optionalString, email: optionalString, role: optionalString, userId: optionalString }).passthrough()).optional(),
        tags: z.array(z.string()).optional(),
        selectedTags: z.array(z.string()).optional(),
        // A draft that fails to save over a half-filled place is worse than one carrying it.
        place: placeSchema.partial().nullable().optional(),
        originalLanguage: z.enum(WRITING_LANGUAGES).optional(),
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
