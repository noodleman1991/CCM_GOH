/**
 * Prisma-Sanity Synchronization Utilities
 *
 * These utilities ensure that Sanity CMS content stays in sync with Prisma enum constraints
 * and help maintain referential integrity between the content management system and database.
 */

import { sanityFetch } from '@/sanity/lib/live'
import { WorkType, ExpertiseArea } from '../../generated/prisma'
import { groq } from 'next-sanity'

// Type definitions for Sanity content
interface SanityWorkType {
  _id: string
  key: string
  label: { _key: string; value: string }[]
  isActive: boolean
}

interface SanityExpertiseArea {
  _id: string
  key: string
  label: { _key: string; value: string }[]
  isActive: boolean
}

// Queries to fetch active Sanity content
const workTypesQuery = groq`
  *[_type == "workType" && isActive == true] {
    _id,
    key,
    label,
    isActive
  }
`

const expertiseAreasQuery = groq`
  *[_type == "expertiseArea" && isActive == true] {
    _id,
    key,
    label,
    isActive
  }
`

/**
 * Validates that all Prisma enum values have corresponding Sanity content
 */
export async function validatePrismaEnumsWithSanity() {
  const validation = {
    workTypes: { valid: true, errors: [] as string[] },
    expertiseAreas: { valid: true, errors: [] as string[] }
  }

  try {
    // Fetch active Sanity content
    const [sanityWorkTypes, sanityExpertiseAreas] = await Promise.all([
      sanityFetch({ query: workTypesQuery }),
      sanityFetch({ query: expertiseAreasQuery })
    ])

    // Get Prisma enum values
    const prismaWorkTypes = Object.values(WorkType)
    const prismaExpertiseAreas = Object.values(ExpertiseArea)

    // Validate WorkTypes
    const sanityWorkTypeKeys = sanityWorkTypes.data.map((wt: SanityWorkType) => wt.key)
    for (const prismaKey of prismaWorkTypes) {
      if (!sanityWorkTypeKeys.includes(prismaKey)) {
        validation.workTypes.valid = false
        validation.workTypes.errors.push(`Prisma WorkType "${prismaKey}" missing in Sanity`)
      }
    }

    // Check for extra Sanity keys not in Prisma
    for (const sanityKey of sanityWorkTypeKeys) {
      if (!prismaWorkTypes.includes(sanityKey as WorkType)) {
        validation.workTypes.valid = false
        validation.workTypes.errors.push(`Sanity WorkType "${sanityKey}" not found in Prisma enum`)
      }
    }

    // Validate ExpertiseAreas
    const sanityExpertiseKeys = sanityExpertiseAreas.data.map((ea: SanityExpertiseArea) => ea.key)
    for (const prismaKey of prismaExpertiseAreas) {
      if (!sanityExpertiseKeys.includes(prismaKey)) {
        validation.expertiseAreas.valid = false
        validation.expertiseAreas.errors.push(`Prisma ExpertiseArea "${prismaKey}" missing in Sanity`)
      }
    }

    // Check for extra Sanity keys not in Prisma
    for (const sanityKey of sanityExpertiseKeys) {
      if (!prismaExpertiseAreas.includes(sanityKey as ExpertiseArea)) {
        validation.expertiseAreas.valid = false
        validation.expertiseAreas.errors.push(`Sanity ExpertiseArea "${sanityKey}" not found in Prisma enum`)
      }
    }

  } catch (error) {
    validation.workTypes.valid = false
    validation.workTypes.errors.push(`Error fetching Sanity data: ${error}`)
    validation.expertiseAreas.valid = false
    validation.expertiseAreas.errors.push(`Error fetching Sanity data: ${error}`)
  }

  return validation
}

/**
 * Gets missing Sanity content that should be created to match Prisma enums
 */
export async function getMissingSanityContent() {
  try {
    const [sanityWorkTypes, sanityExpertiseAreas] = await Promise.all([
      sanityFetch({ query: workTypesQuery }),
      sanityFetch({ query: expertiseAreasQuery })
    ])

    const prismaWorkTypes = Object.values(WorkType)
    const prismaExpertiseAreas = Object.values(ExpertiseArea)

    const sanityWorkTypeKeys = sanityWorkTypes.data.map((wt: SanityWorkType) => wt.key)
    const sanityExpertiseKeys = sanityExpertiseAreas.data.map((ea: SanityExpertiseArea) => ea.key)

    return {
      missingWorkTypes: prismaWorkTypes.filter(key => !sanityWorkTypeKeys.includes(key)),
      missingExpertiseAreas: prismaExpertiseAreas.filter(key => !sanityExpertiseKeys.includes(key))
    }
  } catch (error) {
    throw new Error(`Error checking missing content: ${error}`)
  }
}

/**
 * Generates Sanity document templates for missing Prisma enum values
 */
export function generateSanityDocumentTemplates(missingKeys: string[], type: 'workType' | 'expertiseArea') {
  return missingKeys.map((key, index) => {
    const baseLabel = key.toLowerCase().replace(/_/g, ' ')
    const titleCase = baseLabel.replace(/\b\w/g, l => l.toUpperCase())

    return {
      _type: type,
      key,
      label: [
        { _key: 'en', value: titleCase },
        { _key: 'es', value: titleCase }, // Should be properly translated
        { _key: 'fr', value: titleCase }, // Should be properly translated
        { _key: 'ar', value: titleCase }  // Should be properly translated
      ],
      description: [
        { _key: 'en', value: `Description for ${titleCase}` },
        { _key: 'es', value: `Descripción para ${titleCase}` },
        { _key: 'fr', value: `Description pour ${titleCase}` },
        { _key: 'ar', value: `وصف لـ ${titleCase}` }
      ],
      order: index * 10, // Leave gaps for future insertions
      isActive: true
    }
  })
}

/**
 * Validates that a key can be safely changed in Sanity
 * Checks if the key is referenced in the database
 */
export async function canChangeKey(currentKey: string, type: 'workType' | 'expertiseArea') {
  // Note: This would require database access to check references
  // For now, we'll return false to be safe
  console.warn(`Key change validation for ${type}:${currentKey} - Manual database check required`)
  return {
    canChange: false,
    reason: 'Manual database check required to ensure no existing user references',
    recommendations: [
      'Check User table for references to this key',
      'If references exist, consider deprecating instead of changing key',
      'If no references exist, update Prisma enum first, then Sanity key'
    ]
  }
}

/**
 * Health check for Prisma-Sanity synchronization
 */
export async function syncHealthCheck() {
  const validation = await validatePrismaEnumsWithSanity()
  const missing = await getMissingSanityContent()

  const isHealthy = validation.workTypes.valid &&
                   validation.expertiseAreas.valid &&
                   missing.missingWorkTypes.length === 0 &&
                   missing.missingExpertiseAreas.length === 0

  return {
    isHealthy,
    validation,
    missing,
    recommendations: isHealthy ? [] : [
      'Run migration script to populate missing Sanity content',
      'Review Prisma schema changes for enum additions/removals',
      'Ensure Sanity content editors understand key field restrictions'
    ]
  }
}

/**
 * Helper to generate TypeScript types from Sanity content
 * This can be used to keep TypeScript definitions in sync
 */
export async function generateTypeScriptDefinitions() {
  try {
    const [sanityWorkTypes, sanityExpertiseAreas] = await Promise.all([
      sanityFetch({ query: workTypesQuery }),
      sanityFetch({ query: expertiseAreasQuery })
    ])

    const workTypeKeys = sanityWorkTypes.data.map((wt: SanityWorkType) => wt.key)
    const expertiseKeys = sanityExpertiseAreas.data.map((ea: SanityExpertiseArea) => ea.key)

    return {
      workTypes: `export type WorkTypeKey = ${workTypeKeys.map((k: string) => `'${k}'`).join(' | ')}`,
      expertiseAreas: `export type ExpertiseAreaKey = ${expertiseKeys.map((k: string) => `'${k}'`).join(' | ')}`,
      combined: `
// Generated from Sanity CMS content
export type WorkTypeKey = ${workTypeKeys.map((k: string) => `'${k}'`).join(' | ')}
export type ExpertiseAreaKey = ${expertiseKeys.map((k: string) => `'${k}'`).join(' | ')}

export interface WorkTypeOption {
  key: WorkTypeKey
  label: Record<'en' | 'es' | 'fr' | 'ar', string>
  description?: Record<'en' | 'es' | 'fr' | 'ar', string>
  isActive: boolean
}

export interface ExpertiseAreaOption {
  key: ExpertiseAreaKey
  label: Record<'en' | 'es' | 'fr' | 'ar', string>
  description?: Record<'en' | 'es' | 'fr' | 'ar', string>
  isActive: boolean
}
`
    }
  } catch (error) {
    throw new Error(`Error generating TypeScript definitions: ${error}`)
  }
}