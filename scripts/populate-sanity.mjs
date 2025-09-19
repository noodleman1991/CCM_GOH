#!/usr/bin/env node

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.replace(/"/g, ''), // Remove quotes
  token: process.env.SANITY_API_READ_TOKEN, // Use read token for now
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false
})

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
function createInternationalArrayFromLabels(labels) {
  return Object.entries(labels).map(([locale, value]) => ({
    _key: locale,
    value
  }))
}

async function syncWorkTypesToSanity() {
  console.log('Syncing work types to Sanity...')

  // Get existing work types
  const existingWorkTypes = await client.fetch('*[_type == "workType"]')
  const existingKeys = new Set(existingWorkTypes.map(wt => wt.key))

  const syncPromises = []

  for (const [key, labels] of Object.entries(PRISMA_WORK_TYPES)) {
    const order = Object.keys(PRISMA_WORK_TYPES).indexOf(key)

    if (existingKeys.has(key)) {
      // Update existing
      const existing = existingWorkTypes.find(wt => wt.key === key)
      if (existing) {
        console.log(`Updating work type: ${key}`)
        syncPromises.push(
          client.patch(existing._id).set({
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
      // Create new
      console.log(`Creating work type: ${key}`)
      syncPromises.push(
        client.create({
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
  console.log(`✅ Synced ${Object.keys(PRISMA_WORK_TYPES).length} work types`)
}

async function syncExpertiseAreasToSanity() {
  console.log('Syncing expertise areas to Sanity...')

  // Get existing expertise areas
  const existingExpertiseAreas = await client.fetch('*[_type == "expertiseArea"]')
  const existingKeys = new Set(existingExpertiseAreas.map(ea => ea.key))

  const syncPromises = []

  for (const [key, labels] of Object.entries(PRISMA_EXPERTISE_AREAS)) {
    const order = Object.keys(PRISMA_EXPERTISE_AREAS).indexOf(key)

    if (existingKeys.has(key)) {
      // Update existing
      const existing = existingExpertiseAreas.find(ea => ea.key === key)
      if (existing) {
        console.log(`Updating expertise area: ${key}`)
        syncPromises.push(
          client.patch(existing._id).set({
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
      // Create new
      console.log(`Creating expertise area: ${key}`)
      syncPromises.push(
        client.create({
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
  console.log(`✅ Synced ${Object.keys(PRISMA_EXPERTISE_AREAS).length} expertise areas`)
}

async function createSampleOnboardingContent() {
  console.log('Creating sample onboarding content...')

  const languages = ['en', 'es', 'fr', 'ar']

  const onboardingContent = {
    en: {
      _type: 'onboardingContent',
      language: 'en',
      title: 'Complete Your Profile',

      // Welcome Step
      welcomeTitle: 'Welcome to Our Global Community',
      welcomeSubtitle: 'Connect, collaborate, and create positive change together',
      welcomeFeatures: [
        {
          title: 'Join a Global Network',
          description: 'Connect with changemakers from around the world'
        },
        {
          title: 'Share Your Expertise',
          description: 'Contribute your knowledge and experience'
        },
        {
          title: 'Collaborate on Solutions',
          description: 'Work together on meaningful projects'
        },
        {
          title: 'Create Lasting Impact',
          description: 'Be part of positive change in your community'
        }
      ],
      welcomeSteps: [
        'Tell us about yourself and your background',
        'Share your work experience and expertise',
        'Add your recent projects and achievements',
        'Set your privacy preferences'
      ],
      getStartedText: 'Get Started',
      timeEstimate: 'Takes about 5 minutes',

      // Step Descriptions
      basicInfoTitle: 'Basic Information',
      basicInfoDescription: 'Help us get to know you better',
      workInfoTitle: 'Work & Expertise',
      workInfoDescription: 'Share your professional background and areas of expertise',
      recentWorkTitle: 'Recent Work',
      recentWorkDescription: 'Showcase your recent projects and achievements',

      // Privacy Settings
      privacyTitle: 'Privacy Settings',
      privacyDescription: 'Control how your information is shared',
      searchabilityExplanation: 'Allow others to find you in search results',
      visibilityExplanation: 'Choose who can see your profile information',
      privacyFieldExplanations: {
        showEmail: 'Display your email address on your profile',
        showPhone: 'Display your phone number on your profile',
        showWork: 'Show your work details and expertise',
        showSocial: 'Display your social media links',
        showLocation: 'Show your location (country and city)'
      },

      // Review & Submit
      reviewTitle: 'Almost Done!',
      reviewDescription: 'Review your information before completing setup',
      reviewReadyTitle: 'Ready to Join the Community',
      reviewReadyDescription: 'Your profile is complete and ready to be published',
      completeOnboardingText: 'Complete Setup',

      // Redirect Dialog
      redirectDialogTitle: 'Complete Your Profile',
      redirectDialogMessage: 'To get the most out of our platform, please complete your profile setup. This helps us connect you with relevant opportunities and collaborators.',
      proceedToOnboardingText: 'Complete Profile',
      continueToHubText: 'Continue to Hub',
      oneTimeWaiverText: 'You can complete this later in your settings',

      // Navigation
      navigationTexts: {
        next: 'Next',
        previous: 'Previous',
        continue: 'Continue',
        cancel: 'Cancel'
      }
    }
  }

  // Create English content (other languages would be similar but with translations)
  const existing = await client.fetch('*[_type == "onboardingContent" && language == "en"][0]')

  if (existing) {
    console.log('Updating existing English onboarding content...')
    await client.patch(existing._id).set(onboardingContent.en).commit()
  } else {
    console.log('Creating new English onboarding content...')
    await client.create(onboardingContent.en)
  }

  console.log('✅ Created sample onboarding content')
}

async function main() {
  try {
    console.log('🚀 Starting Sanity population script...')
    console.log('Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
    console.log('Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET)

    if (!process.env.SANITY_API_READ_TOKEN) {
      console.error('❌ SANITY_API_READ_TOKEN is required')
      process.exit(1)
    }

    await syncWorkTypesToSanity()
    await syncExpertiseAreasToSanity()
    await createSampleOnboardingContent()

    console.log('🎉 Sanity population completed successfully!')
  } catch (error) {
    console.error('❌ Error populating Sanity:', error)
    process.exit(1)
  }
}

main()