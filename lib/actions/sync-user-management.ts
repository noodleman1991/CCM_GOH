"use server"

import { sanityFetch } from "@/sanity/lib/live"
import { client as sanityClient } from "@/sanity/lib/client"
import { allUserManagementOptionsQuery } from "@/sanity/queries/work-types"

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
    console.log('Starting work types sync to Sanity...')

    // Get existing work types from Sanity
    const response = await sanityFetch({
      query: allUserManagementOptionsQuery
    })

    const existingData = response.data
    const existingWorkTypeKeys = new Set(
      existingData.workTypes?.map((wt: any) => wt.key) || []
    )

    const syncPromises = []

    // Sync each work type
    for (const [key, labels] of Object.entries(PRISMA_WORK_TYPES)) {
      const order = Object.keys(PRISMA_WORK_TYPES).indexOf(key)

      if (existingWorkTypeKeys.has(key)) {
        // Update existing work type
        const existing = existingData.workTypes.find((wt: any) => wt.key === key)
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
    console.log('Starting expertise areas sync to Sanity...')

    // Get existing expertise areas from Sanity
    const response = await sanityFetch({
      query: allUserManagementOptionsQuery
    })

    const existingData = response.data
    const existingExpertiseKeys = new Set(
      existingData.expertiseAreas?.map((ea: any) => ea.key) || []
    )

    const syncPromises = []

    // Sync each expertise area
    for (const [key, labels] of Object.entries(PRISMA_EXPERTISE_AREAS)) {
      const order = Object.keys(PRISMA_EXPERTISE_AREAS).indexOf(key)

      if (existingExpertiseKeys.has(key)) {
        // Update existing expertise area
        const existing = existingData.expertiseAreas.find((ea: any) => ea.key === key)
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

    const response = await sanityFetch({
      query: allUserManagementOptionsQuery
    })

    const sanityData = response.data
    const sanityWorkTypeKeys = new Set(
      sanityData.workTypes?.map((wt: any) => wt.key) || []
    )
    const sanityExpertiseKeys = new Set(
      sanityData.expertiseAreas?.map((ea: any) => ea.key) || []
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
    const response = await sanityFetch({
      query: allUserManagementOptionsQuery
    })

    return {
      workTypes: response.data?.workTypes || [],
      expertiseAreas: response.data?.expertiseAreas || []
    }
  } catch (error) {
    console.error('Error fetching user management options:', error)
    return {
      workTypes: [],
      expertiseAreas: []
    }
  }
}