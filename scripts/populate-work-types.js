/**
 * Script to populate Sanity with work types and expertise areas
 * Run this script to create sample work types and expertise areas for onboarding
 *
 * Usage: node scripts/populate-work-types.js
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.replace(/"/g, ''), // Remove quotes
  token: process.env.SANITY_API_EDITOR_TOKEN, // Use editor token for write access
  apiVersion: '2024-01-01',
  useCdn: false
})

const workTypes = [
  {
    _type: 'workType',
    key: 'RESEARCH',
    label: [
      { _key: 'en', value: 'Research & Analysis' },
      { _key: 'es', value: 'Investigación y Análisis' },
      { _key: 'fr', value: 'Recherche et Analyse' },
      { _key: 'ar', value: 'البحث والتحليل' }
    ],
    description: [
      { _key: 'en', value: 'Academic research, data analysis, and evidence-based work' },
      { _key: 'es', value: 'Investigación académica, análisis de datos y trabajo basado en evidencia' },
      { _key: 'fr', value: 'Recherche académique, analyse de données et travail basé sur des preuves' },
      { _key: 'ar', value: 'البحث الأكاديمي وتحليل البيانات والعمل القائم على الأدلة' }
    ],
    order: 1,
    isActive: true
  },
  {
    _type: 'workType',
    key: 'POLICY',
    label: [
      { _key: 'en', value: 'Policy & Advocacy' },
      { _key: 'es', value: 'Política y Defensa' },
      { _key: 'fr', value: 'Politique et Plaidoyer' },
      { _key: 'ar', value: 'السياسة والدعوة' }
    ],
    description: [
      { _key: 'en', value: 'Policy development, advocacy campaigns, and government engagement' },
      { _key: 'es', value: 'Desarrollo de políticas, campañas de defensa y compromiso gubernamental' },
      { _key: 'fr', value: 'Élaboration de politiques, campagnes de plaidoyer et engagement gouvernemental' },
      { _key: 'ar', value: 'تطوير السياسات وحملات الدعوة والمشاركة الحكومية' }
    ],
    order: 2,
    isActive: true
  },
  {
    _type: 'workType',
    key: 'NGO',
    label: [
      { _key: 'en', value: 'NGO & Nonprofit' },
      { _key: 'es', value: 'ONG y Sin Fines de Lucro' },
      { _key: 'fr', value: 'ONG et Sans But Lucratif' },
      { _key: 'ar', value: 'المنظمات غير الحكومية وغير الربحية' }
    ],
    description: [
      { _key: 'en', value: 'Work with non-governmental organizations and nonprofit sector' },
      { _key: 'es', value: 'Trabajo con organizaciones no gubernamentales y sector sin fines de lucro' },
      { _key: 'fr', value: 'Travail avec des organisations non gouvernementales et le secteur sans but lucratif' },
      { _key: 'ar', value: 'العمل مع المنظمات غير الحكومية والقطاع غير الربحي' }
    ],
    order: 3,
    isActive: true
  },
  {
    _type: 'workType',
    key: 'COMMUNITY_ORGANIZATION',
    label: [
      { _key: 'en', value: 'Community Organizing' },
      { _key: 'es', value: 'Organización Comunitaria' },
      { _key: 'fr', value: 'Organisation Communautaire' },
      { _key: 'ar', value: 'التنظيم المجتمعي' }
    ],
    description: [
      { _key: 'en', value: 'Grassroots organizing, community mobilization, and local engagement' },
      { _key: 'es', value: 'Organización de base, movilización comunitaria y compromiso local' },
      { _key: 'fr', value: 'Organisation de base, mobilisation communautaire et engagement local' },
      { _key: 'ar', value: 'التنظيم الشعبي والتعبئة المجتمعية والمشاركة المحلية' }
    ],
    order: 4,
    isActive: true
  },
  {
    _type: 'workType',
    key: 'EDUCATION_TEACHING',
    label: [
      { _key: 'en', value: 'Education & Teaching' },
      { _key: 'es', value: 'Educación y Enseñanza' },
      { _key: 'fr', value: 'Éducation et Enseignement' },
      { _key: 'ar', value: 'التعليم والتدريس' }
    ],
    description: [
      { _key: 'en', value: 'Educational programs, teaching, training, and capacity building' },
      { _key: 'es', value: 'Programas educativos, enseñanza, capacitación y desarrollo de capacidades' },
      { _key: 'fr', value: 'Programmes éducatifs, enseignement, formation et renforcement des capacités' },
      { _key: 'ar', value: 'البرامج التعليمية والتدريس والتدريب وبناء القدرات' }
    ],
    order: 5,
    isActive: true
  },
  {
    _type: 'workType',
    key: 'LIVED_EXPERIENCE_EXPERT',
    label: [
      { _key: 'en', value: 'Lived Experience Expert' },
      { _key: 'es', value: 'Experto en Experiencia Vivida' },
      { _key: 'fr', value: 'Expert en Expérience Vécue' },
      { _key: 'ar', value: 'خبير التجربة المعاشة' }
    ],
    description: [
      { _key: 'en', value: 'Personal experience with challenges, communities, or systems being addressed' },
      { _key: 'es', value: 'Experiencia personal con desafíos, comunidades o sistemas que se abordan' },
      { _key: 'fr', value: 'Expérience personnelle avec des défis, des communautés ou des systèmes abordés' },
      { _key: 'ar', value: 'التجربة الشخصية مع التحديات أو المجتمعات أو الأنظمة التي يتم التعامل معها' }
    ],
    order: 6,
    isActive: true
  }
]

const expertiseAreas = [
  {
    _type: 'expertiseArea',
    key: 'CLIMATE_CHANGE',
    label: [
      { _key: 'en', value: 'Climate Change & Environment' },
      { _key: 'es', value: 'Cambio Climático y Medio Ambiente' },
      { _key: 'fr', value: 'Changement Climatique et Environnement' },
      { _key: 'ar', value: 'تغير المناخ والبيئة' }
    ],
    description: [
      { _key: 'en', value: 'Climate action, environmental protection, sustainability' },
      { _key: 'es', value: 'Acción climática, protección ambiental, sostenibilidad' },
      { _key: 'fr', value: 'Action climatique, protection environnementale, durabilité' },
      { _key: 'ar', value: 'العمل المناخي وحماية البيئة والاستدامة' }
    ],
    order: 1,
    isActive: true
  },
  {
    _type: 'expertiseArea',
    key: 'MENTAL_HEALTH',
    label: [
      { _key: 'en', value: 'Mental Health & Wellbeing' },
      { _key: 'es', value: 'Salud Mental y Bienestar' },
      { _key: 'fr', value: 'Santé Mentale et Bien-être' },
      { _key: 'ar', value: 'الصحة النفسية والرفاهية' }
    ],
    description: [
      { _key: 'en', value: 'Mental health support, psychological wellbeing, therapy' },
      { _key: 'es', value: 'Apoyo de salud mental, bienestar psicológico, terapia' },
      { _key: 'fr', value: 'Soutien en santé mentale, bien-être psychologique, thérapie' },
      { _key: 'ar', value: 'دعم الصحة النفسية والرفاهية النفسية والعلاج' }
    ],
    order: 2,
    isActive: true
  },
  {
    _type: 'expertiseArea',
    key: 'HEALTH',
    label: [
      { _key: 'en', value: 'Health & Healthcare' },
      { _key: 'es', value: 'Salud y Atención Médica' },
      { _key: 'fr', value: 'Santé et Soins de Santé' },
      { _key: 'ar', value: 'الصحة والرعاية الصحية' }
    ],
    description: [
      { _key: 'en', value: 'Public health, healthcare access, medical research' },
      { _key: 'es', value: 'Salud pública, acceso a la atención médica, investigación médica' },
      { _key: 'fr', value: 'Santé publique, accès aux soins de santé, recherche médicale' },
      { _key: 'ar', value: 'الصحة العامة والوصول للرعاية الصحية والبحوث الطبية' }
    ],
    order: 3,
    isActive: true
  },
  {
    _type: 'expertiseArea',
    key: 'EDUCATION',
    label: [
      { _key: 'en', value: 'Education & Learning' },
      { _key: 'es', value: 'Educación y Aprendizaje' },
      { _key: 'fr', value: 'Éducation et Apprentissage' },
      { _key: 'ar', value: 'التعليم والتعلم' }
    ],
    description: [
      { _key: 'en', value: 'Educational access, learning systems, school reform' },
      { _key: 'es', value: 'Acceso educativo, sistemas de aprendizaje, reforma escolar' },
      { _key: 'fr', value: 'Accès éducatif, systèmes d\'apprentissage, réforme scolaire' },
      { _key: 'ar', value: 'الوصول التعليمي وأنظمة التعلم وإصلاح المدارس' }
    ],
    order: 4,
    isActive: true
  },
  {
    _type: 'expertiseArea',
    key: 'SOCIAL_JUSTICE',
    label: [
      { _key: 'en', value: 'Social Justice & Equity' },
      { _key: 'es', value: 'Justicia Social y Equidad' },
      { _key: 'fr', value: 'Justice Sociale et Équité' },
      { _key: 'ar', value: 'العدالة الاجتماعية والإنصاف' }
    ],
    description: [
      { _key: 'en', value: 'Human rights, equality, anti-discrimination work' },
      { _key: 'es', value: 'Derechos humanos, igualdad, trabajo anti-discriminación' },
      { _key: 'fr', value: 'Droits humains, égalité, travail anti-discrimination' },
      { _key: 'ar', value: 'حقوق الإنسان والمساواة ومكافحة التمييز' }
    ],
    order: 5,
    isActive: true
  }
]

async function createWorkTypesAndExpertise() {
  console.log('Starting to populate work types and expertise areas...')

  try {
    console.log('Creating work types...')
    const workTypeResults = await Promise.all(
      workTypes.map(async (workType) => {
        // Check if work type already exists
        const existing = await client.fetch(
          `*[_type == "workType" && key == $key][0]`,
          { key: workType.key }
        )

        if (existing) {
          console.log(`Updating existing work type: ${workType.key}`)
          return await client
            .patch(existing._id)
            .set(workType)
            .commit()
        } else {
          console.log(`Creating new work type: ${workType.key}`)
          return await client.create(workType)
        }
      })
    )

    console.log('Creating expertise areas...')
    const expertiseResults = await Promise.all(
      expertiseAreas.map(async (expertise) => {
        // Check if expertise area already exists
        const existing = await client.fetch(
          `*[_type == "expertiseArea" && key == $key][0]`,
          { key: expertise.key }
        )

        if (existing) {
          console.log(`Updating existing expertise area: ${expertise.key}`)
          return await client
            .patch(existing._id)
            .set(expertise)
            .commit()
        } else {
          console.log(`Creating new expertise area: ${expertise.key}`)
          return await client.create(expertise)
        }
      })
    )

    console.log('✅ Successfully created/updated work types and expertise areas')
    console.log(`Work Types: ${workTypeResults.length}`)
    console.log(`Expertise Areas: ${expertiseResults.length}`)

  } catch (error) {
    console.error('❌ Error creating work types and expertise areas:', error)
    process.exit(1)
  }
}

// Run the script
createWorkTypesAndExpertise()