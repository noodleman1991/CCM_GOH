"use server"

import { writeClient as sanityClient } from "@/sanity/lib/write-client"
import { allUserManagementOptionsQuery } from "@/sanity/queries/work-types"
import { getActor, isStaff } from "@/lib/authz"

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
) {
  const translations = item[`${field}Translations`] as Record<string, string> | undefined
  return translations?.[locale] || translations?.en || item[field]
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

// Sync work types from Prisma enums to Sanity
export async function syncWorkTypesToSanity() {
  try {
    await assertAdmin()
    console.log('Starting work types sync to Sanity...')

    // Get existing work types from Sanity
    const response = await sanityClient.fetch(allUserManagementOptionsQuery)

    const existingData = response
    const existingWorkTypeKeys = new Set(
      existingData.workTypes?.map((wt: { key: string }) => wt.key) || []
    )

    const syncPromises = []

    // Sync each work type
    for (const [key, labels] of Object.entries(PRISMA_WORK_TYPES)) {
      const order = Object.keys(PRISMA_WORK_TYPES).indexOf(key)

      if (existingWorkTypeKeys.has(key)) {
        // Update existing work type
        const existing = existingData.workTypes.find((wt: { key: string }) => wt.key === key)
        if (existing) {
          syncPromises.push(
            sanityClient.patch(existing._id).set({
              label: createInternationalArrayFromLabels(labels),
              description: createInternationalArrayFromLabels({
                en: `Work in ${labels.en.toLowerCase()}`,
                es: `Trabajo en ${labels.es.toLowerCase()}`,
                fr: `Travail en ${labels.fr.toLowerCase()}`,
                ar: `العمل في ${labels.ar}`
              }),
              order,
              isActive: true
            }).commit()
          )
        }
      } else {
        // Create new work type
        syncPromises.push(
          sanityClient.create({
            _type: 'workType',
            key,
            label: createInternationalArrayFromLabels(labels),
            description: createInternationalArrayFromLabels({
              en: `Work in ${labels.en.toLowerCase()}`,
              es: `Trabajo en ${labels.es.toLowerCase()}`,
              fr: `Travail en ${labels.fr.toLowerCase()}`,
              ar: `العمل في ${labels.ar}`
            }),
            order,
            isActive: true
          })
        )
      }
    }

    await Promise.all(syncPromises)
    console.log(`Synced ${Object.keys(PRISMA_WORK_TYPES).length} work types to Sanity`)

    return { success: true, count: Object.keys(PRISMA_WORK_TYPES).length }
  } catch (error) {
    console.error('Error syncing work types to Sanity:', error)
    throw new Error('Failed to sync work types to Sanity')
  }
}

// Sync expertise areas from Prisma enums to Sanity
export async function syncExpertiseAreasToSanity() {
  try {
    await assertAdmin()
    console.log('Starting expertise areas sync to Sanity...')

    // Get existing expertise areas from Sanity
    const response = await sanityClient.fetch(allUserManagementOptionsQuery)

    const existingData = response
    const existingExpertiseKeys = new Set(
      existingData.expertiseAreas?.map((ea: { key: string }) => ea.key) || []
    )

    const syncPromises = []

    // Sync each expertise area
    for (const [key, labels] of Object.entries(PRISMA_EXPERTISE_AREAS)) {
      const order = Object.keys(PRISMA_EXPERTISE_AREAS).indexOf(key)

      if (existingExpertiseKeys.has(key)) {
        // Update existing expertise area
        const existing = existingData.expertiseAreas.find((ea: { key: string }) => ea.key === key)
        if (existing) {
          syncPromises.push(
            sanityClient.patch(existing._id).set({
              label: createInternationalArrayFromLabels(labels),
              description: createInternationalArrayFromLabels({
                en: `Expertise in ${labels.en.toLowerCase()}`,
                es: `Experiencia en ${labels.es.toLowerCase()}`,
                fr: `Expertise en ${labels.fr.toLowerCase()}`,
                ar: `خبرة في ${labels.ar}`
              }),
              order,
              isActive: true
            }).commit()
          )
        }
      } else {
        // Create new expertise area
        syncPromises.push(
          sanityClient.create({
            _type: 'expertiseArea',
            key,
            label: createInternationalArrayFromLabels(labels),
            description: createInternationalArrayFromLabels({
              en: `Expertise in ${labels.en.toLowerCase()}`,
              es: `Experiencia en ${labels.es.toLowerCase()}`,
              fr: `Expertise en ${labels.fr.toLowerCase()}`,
              ar: `خبرة في ${labels.ar}`
            }),
            order,
            isActive: true
          })
        )
      }
    }

    await Promise.all(syncPromises)
    console.log(`Synced ${Object.keys(PRISMA_EXPERTISE_AREAS).length} expertise areas to Sanity`)

    return { success: true, count: Object.keys(PRISMA_EXPERTISE_AREAS).length }
  } catch (error) {
    console.error('Error syncing expertise areas to Sanity:', error)
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

    const response = await sanityClient.fetch(allUserManagementOptionsQuery)

    const sanityData = response
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
    const response = await sanityClient.fetch(allUserManagementOptionsQuery)

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

    // Use client.fetch instead of sanityFetch - works in server actions
    const response = await sanityClient.fetch(
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

    const dataSource = workTypes.length > 0 ? 'sanity' : 'fallback'
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