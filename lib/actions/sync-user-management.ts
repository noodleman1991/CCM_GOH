"use server"

import { activeBackend } from "@/lib/content/internal/backend"
import { createDocument, queryRaw, updateDocument } from "@/lib/content/internal/sanity-source"
import {
  createDocument as createPayloadDocument,
  queryRaw as payloadQueryRaw,
  updateDocument as updatePayloadDocument,
  type PayloadLocale,
} from "@/lib/content/internal/payload-source"
import { groqObject, localized } from "@/lib/content/internal/localized"
import { getActor, isStaff } from "@/lib/authz"

/**
 * All work types / expertise areas (active AND inactive), for the sync +
 * validation tooling below. Moved verbatim from
 * sanity/queries/work-types.ts's allUserManagementOptionsQuery — this file
 * used the authenticated write client (`writeClient.fetch`) for every read,
 * not the public read client, so every read here maps to queryRaw().
 */
const ALL_USER_MANAGEMENT_OPTIONS_QUERY = `
{
  "workTypes": *[_type == "workType"] | order(order asc, key asc) {
    _id,
    key,
    label,
    description,
    order,
    isActive
  },
  "expertiseAreas": *[_type == "expertiseArea"] | order(order asc, key asc) {
    _id,
    key,
    label,
    description,
    order,
    isActive
  }
}`;

interface AllUserManagementOptionsRow {
  _id: string
  key: string
  label: unknown
  description: unknown
  order: number
  isActive: boolean
}

interface AllUserManagementOptionsResult {
  workTypes: AllUserManagementOptionsRow[]
  expertiseAreas: AllUserManagementOptionsRow[]
}

// ---------------------------------------------------------------------------
// The Payload arm
// ---------------------------------------------------------------------------
//
// Every exported function below branches on `activeBackend("user-management")`
// — `CONTENT_BACKEND_USER_MANAGEMENT`, or the process-wide `CONTENT_BACKEND`.
// Unset means Sanity, so a deployment that says nothing keeps doing exactly
// what it does today.
//
// The exported names still say "ToSanity". They are deliberately NOT renamed:
// the only caller is `app/api/sync/user-management/route.ts`, and `app/` is
// not this phase's to touch. Recorded for Phase 4's cleanup.
//
// Three things about Payload shape this arm to something other than a
// find-and-replace:
//
//   1. **`id` is a required text column** on both collections (Sanity's `_id`,
//      preserved verbatim at import so the import stays idempotent). Payload
//      will not mint one, so a create has to. The minted id is derived from
//      `key` — which is `unique` — so a re-run after a partial failure lands on
//      the same row instead of adding a second one.
//   2. **`label`/`description` are `localized: true` fields**, where Sanity
//      stored them as an `internationalizedArray` of `{_key, value}` pairs.
//      Payload's Local API writes ONE locale per call (`create`/`update` take a
//      single `TypedLocale`, never `"all"`), so four locales are four writes,
//      and the non-localized columns are written once rather than four times.
//   3. **Payload drops unknown data keys silently** — Task 12 measured a write
//      with a wrong field name reporting success and changing nothing. So the
//      field names below are set here, inside the reader, and never taken from
//      a caller.
//
// No `select`-backed field is filtered anywhere in this file: the one filter is
// `isActive`, a checkbox. Nothing here can pass a value outside a Postgres
// enum's declared set.

/** The module's own name, as `CONTENT_BACKEND_USER_MANAGEMENT` spells it. */
const USER_MANAGEMENT_DOMAIN = "user-management"

const onPayload = (): boolean => activeBackend(USER_MANAGEMENT_DOMAIN) === "payload"

/** Every locale `payload.config.ts` declares, in its own order. */
const PAYLOAD_LOCALES: PayloadLocale[] = ["en", "es", "fr", "ar"]

type OptionKind = "workType" | "expertiseArea"

/** Sanity's `_type` on the left, Payload's collection slug on the right. */
const PAYLOAD_COLLECTION = {
  workType: "workTypes",
  expertiseArea: "expertiseAreas",
} as const satisfies Record<OptionKind, string>

/** What Payload's `find` hands back for one of these rows. */
interface PayloadOptionRow {
  id: string | number
  key: string
  label?: unknown
  description?: unknown
  order?: number | null
  isActive?: boolean | null
}

/**
 * A row's id in Payload, when the sync has to create one.
 *
 * Deterministic rather than random: `key` is `unique`, so a second run after a
 * failure mid-`Promise.all` finds the row it already made instead of trying to
 * add a duplicate under a fresh uuid. Prefixed with the Sanity `_type` name so
 * it cannot collide with an imported 22-character Sanity id.
 */
function mintOptionId(kind: OptionKind, key: string): string {
  return `${kind}-${key}`
}

/**
 * Every option of one kind, active and inactive, ordered as GROQ ordered them.
 *
 * `queryRaw`, not `query`: this read decides whether the write below is a
 * create or an update, and `query`'s hour-long cache would let a stale "that
 * key does not exist yet" mint a duplicate. The two return the same shape, so
 * the choice is only visible in the call, which is what the test asserts.
 */
async function payloadAllOptions(kind: OptionKind): Promise<AllUserManagementOptionsRow[]> {
  const { docs } = await payloadQueryRaw<{ docs: PayloadOptionRow[] }>({
    type: "find",
    collection: PAYLOAD_COLLECTION[kind],
    // `*[_type == "workType"] | order(order asc, key asc)` — no filter: the
    // sync's own bookkeeping needs inactive options too.
    sort: ["order", "key"],
    pagination: false,
    locale: "all",
  })
  return docs.map((doc) => ({
    _id: String(doc.id),
    key: doc.key,
    label: localized(doc.label as never),
    description: localized(doc.description as never),
    order: doc.order ?? 0,
    isActive: doc.isActive ?? false,
  }))
}

/** Both kinds, in the shape the GROQ query returned them. */
async function payloadAllUserManagementOptions(): Promise<AllUserManagementOptionsResult> {
  const [workTypes, expertiseAreas] = await Promise.all([
    payloadAllOptions("workType"),
    payloadAllOptions("expertiseArea"),
  ])
  return { workTypes, expertiseAreas }
}

/** The read every exported function starts from, on whichever backend. */
async function allUserManagementOptions(): Promise<AllUserManagementOptionsResult> {
  return onPayload()
    ? payloadAllUserManagementOptions()
    : queryRaw<AllUserManagementOptionsResult>(ALL_USER_MANAGEMENT_OPTIONS_QUERY)
}

/**
 * Write one option's four locales plus its non-localized columns.
 *
 * Sequential, not `Promise.all`: four concurrent updates of the same row race
 * each other through Payload's read-modify-write, and the loser's locale is
 * lost. The non-localized half rides along with `en` — one write, not four
 * identical ones.
 */
async function writePayloadOption(
  kind: OptionKind,
  id: string,
  labels: Record<string, string>,
  descriptions: Record<string, string>,
  order: number,
): Promise<void> {
  const collection = PAYLOAD_COLLECTION[kind]
  for (const locale of PAYLOAD_LOCALES) {
    await updatePayloadDocument({
      collection,
      id,
      locale,
      data: {
        label: labels[locale],
        description: descriptions[locale],
        // Payload's update is a merge, so the non-localized columns only need
        // saying once. `en` is first in PAYLOAD_LOCALES and carries them.
        ...(locale === "en" ? { order, isActive: true } : {}),
      },
    })
  }
}

/** One option, resolved to a single locale — what the two rendered readers get. */
interface LocalizedOptionRow {
  _id: string
  key: string
  label: string
  description: string
  order: number
}

interface LocalizedOptionsResult {
  workTypes: LocalizedOptionRow[]
  expertiseAreas: LocalizedOptionRow[]
}

/**
 * The active options, resolved to one locale.
 *
 * The GROQ original coalesced three deep: the requested locale, then English,
 * then `key` (and `""` for a description). Payload's own `fallback: true`
 * covers the first hop — `fallbackLocale: "en"` says so explicitly rather than
 * inheriting it — and the `?? key` below covers the second.
 *
 * `locale` is checked against the configured four before it is used. It comes
 * from a URL segment, and while a locale is not a `select`-backed Postgres enum
 * the same discipline applies: an unrecognised value must produce what GROQ
 * produced (English, via the coalesce), never an exception.
 *
 * `groqObject` because these rows cross into client components on
 * `/[locale]/onboarding` and `/[locale]/dashboard/profile/edit`: Sanity
 * alphabetises the keys of every object it returns, Payload does not, and the
 * difference is a byte difference in the RSC flight payload.
 */
async function payloadLocalizedOptions(locale: string): Promise<LocalizedOptionsResult> {
  const requested = PAYLOAD_LOCALES.includes(locale as PayloadLocale)
    ? (locale as PayloadLocale)
    : 'en'

  const read = async (kind: OptionKind): Promise<LocalizedOptionRow[]> => {
    const { docs } = await payloadQueryRaw<{ docs: PayloadOptionRow[] }>({
      type: 'find',
      collection: PAYLOAD_COLLECTION[kind],
      where: { isActive: { equals: true } },
      sort: ['order', 'key'],
      pagination: false,
      locale: requested,
      fallbackLocale: 'en',
    })
    return docs.map((doc) =>
      groqObject({
        _id: String(doc.id),
        key: doc.key,
        label: typeof doc.label === 'string' && doc.label ? doc.label : doc.key,
        description: typeof doc.description === 'string' ? doc.description : '',
        order: doc.order ?? 0,
      }),
    )
  }

  const [workTypes, expertiseAreas] = await Promise.all([read('workType'), read('expertiseArea')])
  return { workTypes, expertiseAreas }
}

/** Create an option, then fill in the three locales `create` could not carry. */
async function createPayloadOption(
  kind: OptionKind,
  key: string,
  labels: Record<string, string>,
  descriptions: Record<string, string>,
  order: number,
): Promise<void> {
  const collection = PAYLOAD_COLLECTION[kind]
  const id = mintOptionId(kind, key)
  await createPayloadDocument({
    collection,
    locale: "en",
    data: {
      id,
      key,
      label: labels.en,
      description: descriptions.en,
      order,
      isActive: true,
    },
  })
  for (const locale of PAYLOAD_LOCALES.filter((l) => l !== "en")) {
    await updatePayloadDocument({
      collection,
      id,
      locale,
      data: { label: labels[locale], description: descriptions[locale] },
    })
  }
}

/** These actions WRITE to the CMS — restrict to staff (team_editor | admin). */
async function assertAdmin(): Promise<void> {
  const actor = await getActor()
  if (!isStaff(actor)) throw new Error("Forbidden: admin only")
}

// Hardcoded fallback data with full i18n support
const FALLBACK_WORK_TYPES = [
  { _id: 'wt-research', key: 'RESEARCH', label: 'Research & Analysis', description: 'Academic research, data analysis, and evidence-based work', order: 1,
    labelTranslations: { en: 'Research & Analysis', es: 'Investigación y Análisis', fr: 'Recherche et Analyse', ar: 'البحث والتحليل' },
    descriptionTranslations: { en: 'Academic research, data analysis, and evidence-based work', es: 'Investigación académica, análisis de datos y trabajo basado en evidencia', fr: 'Recherche académique, analyse de données et travail fondé sur des preuves', ar: 'البحث الأكاديمي وتحليل البيانات والعمل القائم على الأدلة' }},
  { _id: 'wt-policy', key: 'POLICY', label: 'Policy & Advocacy', description: 'Policy development, advocacy campaigns, and government engagement', order: 2,
    labelTranslations: { en: 'Policy & Advocacy', es: 'Política y Defensa', fr: 'Politique et Plaidoyer', ar: 'السياسة والدعوة' },
    descriptionTranslations: { en: 'Policy development, advocacy campaigns, and government engagement', es: 'Desarrollo de políticas, campañas de defensa y compromiso gubernamental', fr: 'Développement de politiques, campagnes de plaidoyer et engagement gouvernemental', ar: 'تطوير السياسات وحملات الدعوة والمشاركة الحكومية' }},
  { _id: 'wt-ngo', key: 'NGO', label: 'NGO & Nonprofit', description: 'Work with non-governmental organizations and nonprofit sector', order: 3,
    labelTranslations: { en: 'NGO & Nonprofit', es: 'ONG y Sin Fines de Lucro', fr: 'ONG et À But Non Lucratif', ar: 'المنظمات غير الحكومية وغير الربحية' },
    descriptionTranslations: { en: 'Work with non-governmental organizations and nonprofit sector', es: 'Trabajo con organizaciones no gubernamentales y sector sin fines de lucro', fr: 'Travail avec des organisations non gouvernementales et le secteur à but non lucratif', ar: 'العمل مع المنظمات غير الحكومية والقطاع غير الربحي' }},
  { _id: 'wt-community', key: 'COMMUNITY_ORGANIZATION', label: 'Community Organizing', description: 'Grassroots organizing, community mobilization, and local engagement', order: 4,
    labelTranslations: { en: 'Community Organizing', es: 'Organización Comunitaria', fr: 'Organisation Communautaire', ar: 'التنظيم المجتمعي' },
    descriptionTranslations: { en: 'Grassroots organizing, community mobilization, and local engagement', es: 'Organización de base, movilización comunitaria y participación local', fr: 'Organisation communautaire, mobilisation et engagement local', ar: 'التنظيم الشعبي والتعبئة المجتمعية والمشاركة المحلية' }},
  { _id: 'wt-education', key: 'EDUCATION_TEACHING', label: 'Education & Teaching', description: 'Educational programs, teaching, training, and capacity building', order: 5,
    labelTranslations: { en: 'Education & Teaching', es: 'Educación y Enseñanza', fr: 'Éducation et Enseignement', ar: 'التعليم والتدريس' },
    descriptionTranslations: { en: 'Educational programs, teaching, training, and capacity building', es: 'Programas educativos, enseñanza, capacitación y desarrollo de capacidades', fr: 'Programmes éducatifs, enseignement, formation et renforcement des capacités', ar: 'البرامج التعليمية والتدريس والتدريب وبناء القدرات' }},
  { _id: 'wt-lived-exp', key: 'LIVED_EXPERIENCE_EXPERT', label: 'Lived Experience Expert', description: 'Personal experience with challenges, communities, or systems being addressed', order: 6,
    labelTranslations: { en: 'Lived Experience Expert', es: 'Experto por Experiencia Vivida', fr: 'Expert par Expérience Vécue', ar: 'خبير من التجربة المعاشة' },
    descriptionTranslations: { en: 'Personal experience with challenges, communities, or systems being addressed', es: 'Experiencia personal con desafíos, comunidades o sistemas que se abordan', fr: 'Expérience personnelle avec les défis, communautés ou systèmes abordés', ar: 'تجربة شخصية مع التحديات أو المجتمعات أو الأنظمة التي يتم معالجتها' }}
]

const FALLBACK_EXPERTISE_AREAS = [
  { _id: 'exp-climate', key: 'CLIMATE_CHANGE', label: 'Climate Change', description: 'Climate science, mitigation, and adaptation', order: 1,
    labelTranslations: { en: 'Climate Change', es: 'Cambio Climático', fr: 'Changement Climatique', ar: 'التغير المناخي' },
    descriptionTranslations: { en: 'Climate science, mitigation, and adaptation', es: 'Ciencia climática, mitigación y adaptación', fr: 'Science du climat, atténuation et adaptation', ar: 'علوم المناخ والتخفيف والتكيف' }},
  { _id: 'exp-mental', key: 'MENTAL_HEALTH', label: 'Mental Health', description: 'Mental health and wellbeing', order: 2,
    labelTranslations: { en: 'Mental Health', es: 'Salud Mental', fr: 'Santé Mentale', ar: 'الصحة النفسية' },
    descriptionTranslations: { en: 'Mental health and wellbeing', es: 'Salud mental y bienestar', fr: 'Santé mentale et bien-être', ar: 'الصحة النفسية والرفاهية' }},
  { _id: 'exp-health', key: 'HEALTH', label: 'Health', description: 'Public health and healthcare', order: 3,
    labelTranslations: { en: 'Health', es: 'Salud', fr: 'Santé', ar: 'الصحة' },
    descriptionTranslations: { en: 'Public health and healthcare', es: 'Salud pública y atención médica', fr: 'Santé publique et soins de santé', ar: 'الصحة العامة والرعاية الصحية' }},
  { _id: 'exp-education', key: 'EDUCATION', label: 'Education', description: 'Education systems and access', order: 4,
    labelTranslations: { en: 'Education', es: 'Educación', fr: 'Éducation', ar: 'التعليم' },
    descriptionTranslations: { en: 'Education systems and access', es: 'Sistemas educativos y acceso', fr: 'Systèmes éducatifs et accès', ar: 'أنظمة التعليم والوصول' }},
  { _id: 'exp-justice', key: 'SOCIAL_JUSTICE', label: 'Social Justice', description: 'Equity, justice, and human rights', order: 5,
    labelTranslations: { en: 'Social Justice', es: 'Justicia Social', fr: 'Justice Sociale', ar: 'العدالة الاجتماعية' },
    descriptionTranslations: { en: 'Equity, justice, and human rights', es: 'Equidad, justicia y derechos humanos', fr: 'Équité, justice et droits humains', ar: 'المساواة والعدالة وحقوق الإنسان' }}
]

// Helper function to apply locale to fallback data
function localizeField(
  item: Record<string, unknown> & { [key: string]: unknown },
  field: string,
  locale: string
): string {
  const translations = item[`${field}Translations`] as Record<string, string> | undefined
  return (translations?.[locale] || translations?.en || item[field]) as string
}

// Map of existing Prisma enum values to their user-friendly labels
const PRISMA_WORK_TYPES = {
  'RESEARCH': {
    en: 'Research',
    es: 'Investigación',
    fr: 'Recherche',
    ar: 'البحث'
  },
  'POLICY': {
    en: 'Policy',
    es: 'Política',
    fr: 'Politique',
    ar: 'السياسة'
  },
  'LIVED_EXPERIENCE_EXPERT': {
    en: 'Lived Experience Expert',
    es: 'Experto en Experiencia Vivida',
    fr: 'Expert en Expérience Vécue',
    ar: 'خبير تجربة معيشة'
  },
  'NGO': {
    en: 'NGO',
    es: 'ONG',
    fr: 'ONG',
    ar: 'منظمة غير حكومية'
  },
  'COMMUNITY_ORGANIZATION': {
    en: 'Community Organization',
    es: 'Organización Comunitaria',
    fr: 'Organisation Communautaire',
    ar: 'منظمة مجتمعية'
  },
  'EDUCATION_TEACHING': {
    en: 'Education & Teaching',
    es: 'Educación y Enseñanza',
    fr: 'Éducation et Enseignement',
    ar: 'التعليم والتدريس'
  }
}

const PRISMA_EXPERTISE_AREAS = {
  'CLIMATE_CHANGE': {
    en: 'Climate Change',
    es: 'Cambio Climático',
    fr: 'Changement Climatique',
    ar: 'تغير المناخ'
  },
  'MENTAL_HEALTH': {
    en: 'Mental Health',
    es: 'Salud Mental',
    fr: 'Santé Mentale',
    ar: 'الصحة النفسية'
  },
  'HEALTH': {
    en: 'Health',
    es: 'Salud',
    fr: 'Santé',
    ar: 'الصحة'
  }
}

// Convert label map to international array format for Sanity
function createInternationalArrayFromLabels(labels: Record<string, string>) {
  return Object.entries(labels).map(([locale, value]) => ({
    _key: locale,
    value
  }))
}

/** The generated description, one string per locale. Unchanged wording. */
function workTypeDescriptions(labels: Record<string, string>): Record<string, string> {
  return {
    en: `Work in ${labels.en.toLowerCase()}`,
    es: `Trabajo en ${labels.es.toLowerCase()}`,
    fr: `Travail en ${labels.fr.toLowerCase()}`,
    ar: `العمل في ${labels.ar}`,
  }
}

// Sync work types from Prisma enums to the CMS
export async function syncWorkTypesToSanity() {
  try {
    await assertAdmin()
    console.log('Starting work types sync to the CMS...')

    // Get existing work types from the CMS
    const existingData = await allUserManagementOptions()
    const existingWorkTypeKeys = new Set(
      existingData.workTypes?.map((wt: { key: string }) => wt.key) || []
    )

    const syncPromises = []

    // Sync each work type
    for (const [key, labels] of Object.entries(PRISMA_WORK_TYPES)) {
      const order = Object.keys(PRISMA_WORK_TYPES).indexOf(key)
      const descriptions = workTypeDescriptions(labels)

      if (existingWorkTypeKeys.has(key)) {
        // Update existing work type
        const existing = existingData.workTypes.find((wt: { key: string }) => wt.key === key)
        if (existing) {
          syncPromises.push(
            onPayload()
              ? writePayloadOption('workType', existing._id, labels, descriptions, order)
              : updateDocument(existing._id, {
                  label: createInternationalArrayFromLabels(labels),
                  description: createInternationalArrayFromLabels(descriptions),
                  order,
                  isActive: true
                })
          )
        }
      } else {
        // Create new work type
        syncPromises.push(
          onPayload()
            ? createPayloadOption('workType', key, labels, descriptions, order)
            : createDocument({
                _type: 'workType',
                key,
                label: createInternationalArrayFromLabels(labels),
                description: createInternationalArrayFromLabels(descriptions),
                order,
                isActive: true
              })
        )
      }
    }

    await Promise.all(syncPromises)
    console.log(`Synced ${Object.keys(PRISMA_WORK_TYPES).length} work types to the CMS`)

    return { success: true, count: Object.keys(PRISMA_WORK_TYPES).length }
  } catch (error) {
    console.error('Error syncing work types to the CMS:', error)
    throw new Error('Failed to sync work types to Sanity')
  }
}

/** The generated description, one string per locale. Unchanged wording. */
function expertiseAreaDescriptions(labels: Record<string, string>): Record<string, string> {
  return {
    en: `Expertise in ${labels.en.toLowerCase()}`,
    es: `Experiencia en ${labels.es.toLowerCase()}`,
    fr: `Expertise en ${labels.fr.toLowerCase()}`,
    ar: `خبرة في ${labels.ar}`,
  }
}

// Sync expertise areas from Prisma enums to the CMS
export async function syncExpertiseAreasToSanity() {
  try {
    await assertAdmin()
    console.log('Starting expertise areas sync to the CMS...')

    // Get existing expertise areas from the CMS
    const existingData = await allUserManagementOptions()
    const existingExpertiseKeys = new Set(
      existingData.expertiseAreas?.map((ea: { key: string }) => ea.key) || []
    )

    const syncPromises = []

    // Sync each expertise area
    for (const [key, labels] of Object.entries(PRISMA_EXPERTISE_AREAS)) {
      const order = Object.keys(PRISMA_EXPERTISE_AREAS).indexOf(key)
      const descriptions = expertiseAreaDescriptions(labels)

      if (existingExpertiseKeys.has(key)) {
        // Update existing expertise area
        const existing = existingData.expertiseAreas.find((ea: { key: string }) => ea.key === key)
        if (existing) {
          syncPromises.push(
            onPayload()
              ? writePayloadOption('expertiseArea', existing._id, labels, descriptions, order)
              : updateDocument(existing._id, {
                  label: createInternationalArrayFromLabels(labels),
                  description: createInternationalArrayFromLabels(descriptions),
                  order,
                  isActive: true
                })
          )
        }
      } else {
        // Create new expertise area
        syncPromises.push(
          onPayload()
            ? createPayloadOption('expertiseArea', key, labels, descriptions, order)
            : createDocument({
                _type: 'expertiseArea',
                key,
                label: createInternationalArrayFromLabels(labels),
                description: createInternationalArrayFromLabels(descriptions),
                order,
                isActive: true
              })
        )
      }
    }

    await Promise.all(syncPromises)
    console.log(`Synced ${Object.keys(PRISMA_EXPERTISE_AREAS).length} expertise areas to the CMS`)

    return { success: true, count: Object.keys(PRISMA_EXPERTISE_AREAS).length }
  } catch (error) {
    console.error('Error syncing expertise areas to the CMS:', error)
    throw new Error('Failed to sync expertise areas to Sanity')
  }
}

// Sync both work types and expertise areas
export async function syncUserManagementToSanity() {
  try {
    await assertAdmin()
    console.log('Starting complete user management sync to Sanity...')

    const [workTypesResult, expertiseAreasResult] = await Promise.all([
      syncWorkTypesToSanity(),
      syncExpertiseAreasToSanity()
    ])

    console.log('User management sync completed successfully')

    return {
      success: true,
      workTypes: workTypesResult,
      expertiseAreas: expertiseAreasResult
    }
  } catch (error) {
    console.error('Error syncing user management to Sanity:', error)
    throw new Error('Failed to sync user management to Sanity')
  }
}

// Validate that all Prisma enum values exist in Sanity
export async function validateUserManagementSync() {
  try {
    console.log('Validating user management sync...')

    const sanityData = await allUserManagementOptions()

    const sanityWorkTypeKeys = new Set(
      sanityData.workTypes?.map((wt: { key: string }) => wt.key) || []
    )
    const sanityExpertiseKeys = new Set(
      sanityData.expertiseAreas?.map((ea: { key: string }) => ea.key) || []
    )

    const missingWorkTypes = Object.keys(PRISMA_WORK_TYPES).filter(
      key => !sanityWorkTypeKeys.has(key)
    )
    const missingExpertiseAreas = Object.keys(PRISMA_EXPERTISE_AREAS).filter(
      key => !sanityExpertiseKeys.has(key)
    )

    const isValid = missingWorkTypes.length === 0 && missingExpertiseAreas.length === 0

    console.log('Validation completed:', {
      isValid,
      missingWorkTypes,
      missingExpertiseAreas,
      sanityWorkTypeCount: sanityWorkTypeKeys.size,
      sanityExpertiseAreaCount: sanityExpertiseKeys.size,
      prismaWorkTypeCount: Object.keys(PRISMA_WORK_TYPES).length,
      prismaExpertiseAreaCount: Object.keys(PRISMA_EXPERTISE_AREAS).length
    })

    return {
      isValid,
      missingWorkTypes,
      missingExpertiseAreas,
      counts: {
        sanityWorkTypes: sanityWorkTypeKeys.size,
        sanityExpertiseAreas: sanityExpertiseKeys.size,
        prismaWorkTypes: Object.keys(PRISMA_WORK_TYPES).length,
        prismaExpertiseAreas: Object.keys(PRISMA_EXPERTISE_AREAS).length
      }
    }
  } catch (error) {
    console.error('Error validating user management sync:', error)
    throw new Error('Failed to validate user management sync')
  }
}

// Fetch user management options for onboarding
export async function fetchUserManagementOptions() {
  try {
    const response = await allUserManagementOptions()

    return {
      workTypes: response?.workTypes || [],
      expertiseAreas: response?.expertiseAreas || []
    }
  } catch (error) {
    console.error('Error fetching user management options:', error)
    return {
      workTypes: [],
      expertiseAreas: []
    }
  }
}

// Fetch user management options with locale support
export async function fetchUserManagementOptionsWithLocale(locale: string = 'en') {
  try {
    console.log(`[UserManagement] Fetching work types and expertise for locale: ${locale}`)

    // Raw perspective, authenticated write client — matches every other read
    // in this file (see ALL_USER_MANAGEMENT_OPTIONS_QUERY's comment above).
    const response = onPayload()
      ? await payloadLocalizedOptions(locale)
      : await queryRaw<LocalizedOptionsResult>(
      `{
        "workTypes": *[_type == "workType" && isActive == true] | order(order asc, key asc) {
          _id,
          key,
          "label": coalesce(label[_key == $locale][0].value, label[_key == "en"][0].value, key),
          "description": coalesce(description[_key == $locale][0].value, description[_key == "en"][0].value, ""),
          order
        },
        "expertiseAreas": *[_type == "expertiseArea" && isActive == true] | order(order asc, key asc) {
          _id,
          key,
          "label": coalesce(label[_key == $locale][0].value, label[_key == "en"][0].value, key),
          "description": coalesce(description[_key == $locale][0].value, description[_key == "en"][0].value, ""),
          order
        }
      }`,
          { locale }
        )

    // client.fetch returns data directly, not wrapped in { data: ... }
    const workTypes = response.workTypes || []
    const expertiseAreas = response.expertiseAreas || []

    // Use fallbacks if Sanity returns empty arrays
    const finalWorkTypes = workTypes.length > 0
      ? workTypes
      : FALLBACK_WORK_TYPES.map(wt => ({
          _id: wt._id,
          key: wt.key,
          label: localizeField(wt, 'label', locale),
          description: localizeField(wt, 'description', locale),
          order: wt.order
        }))

    const finalExpertiseAreas = expertiseAreas.length > 0
      ? expertiseAreas
      : FALLBACK_EXPERTISE_AREAS.map(ea => ({
          _id: ea._id,
          key: ea.key,
          label: localizeField(ea, 'label', locale),
          description: localizeField(ea, 'description', locale),
          order: ea.order
        }))

    const dataSource = workTypes.length > 0 ? (onPayload() ? 'payload' : 'sanity') : 'fallback'
    console.log(`[UserManagement] Data source: ${dataSource}`, {
      workTypesCount: finalWorkTypes.length,
      expertiseAreasCount: finalExpertiseAreas.length,
      workTypeKeys: finalWorkTypes.map((wt: { key: string }) => wt.key),
      expertiseKeys: finalExpertiseAreas.map((ea: { key: string }) => ea.key)
    })

    return {
      workTypes: finalWorkTypes,
      expertiseAreas: finalExpertiseAreas
    }
  } catch (error) {
    console.error('[UserManagement] ❌ Error fetching localized user management options:', error)
    console.error('[UserManagement] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Return fallbacks on error
    console.log('[UserManagement] Using fallback data due to error')
    return {
      workTypes: FALLBACK_WORK_TYPES.map(wt => ({
        _id: wt._id,
        key: wt.key,
        label: localizeField(wt, 'label', locale),
        description: localizeField(wt, 'description', locale),
        order: wt.order
      })),
      expertiseAreas: FALLBACK_EXPERTISE_AREAS.map(ea => ({
        _id: ea._id,
        key: ea.key,
        label: localizeField(ea, 'label', locale),
        description: localizeField(ea, 'description', locale),
        order: ea.order
      }))
    }
  }
}