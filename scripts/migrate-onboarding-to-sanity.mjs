#!/usr/bin/env node

/**
 * Migration script to populate Sanity with existing onboarding translations
 * This will create onboarding content documents for all 4 languages
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

// Get current directory (ES modules)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_EDITOR_TOKEN, // Use editor token for write operations
  useCdn: false,
})

// Language mapping
const languages = ['en', 'es', 'fr', 'ar']
const languageNames = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية'
}

// Load translation files
function loadTranslations() {
  const translations = {}

  for (const lang of languages) {
    const filePath = path.join(__dirname, '..', 'messages', `${lang}.json`)
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      translations[lang] = JSON.parse(content)
    } catch (error) {
      console.error(`Error loading ${lang}.json:`, error.message)
      process.exit(1)
    }
  }

  return translations
}

// Create onboarding content document for a language
function createOnboardingContent(lang, translations) {
  const t = translations[lang]?.onboarding?.steps || {}

  return {
    _id: `onboarding-content-${lang}`,
    _type: 'onboardingContent',
    language: lang,
    title: `Onboarding Content - ${languageNames[lang]}`,

    // Welcome Step - using content from current implementation
    welcomeTitle: "Welcome to our Global Community!",
    welcomeSubtitle: lang === 'en'
      ? "Join climate researchers, activists, and experts from around the world working together to create meaningful change."
      : lang === 'es'
      ? "Únete a investigadores del clima, activistas y expertos de todo el mundo trabajando juntos para crear un cambio significativo."
      : lang === 'fr'
      ? "Rejoignez les chercheurs climatiques, activistes et experts du monde entier travaillant ensemble pour créer un changement significatif."
      : "انضم إلى باحثي المناخ والناشطين والخبراء من جميع أنحاء العالم الذين يعملون معاً لإحداث تغيير هادف.",

    welcomeFeatures: [
      {
        title: lang === 'en' ? "Global Community" : lang === 'es' ? "Comunidad Global" : lang === 'fr' ? "Communauté Mondiale" : "مجتمع عالمي",
        description: lang === 'en'
          ? "Connect with climate minds from every continent and background"
          : lang === 'es'
          ? "Conecta con mentes climáticas de todos los continentes y trasfondos"
          : lang === 'fr'
          ? "Connectez-vous avec des esprits climatiques de tous les continents et horizons"
          : "تواصل مع عقول مناخية من جميع القارات والخلفيات"
      },
      {
        title: lang === 'en' ? "Collaborate" : lang === 'es' ? "Colaborar" : lang === 'fr' ? "Collaborer" : "تعاون",
        description: lang === 'en'
          ? "Work together on research, advocacy, and actionable solutions"
          : lang === 'es'
          ? "Trabajen juntos en investigación, promoción y soluciones accionables"
          : lang === 'fr'
          ? "Travaillez ensemble sur la recherche, le plaidoyer et les solutions concrètes"
          : "اعملوا معاً في البحث والدعوة والحلول القابلة للتنفيذ"
      },
      {
        title: lang === 'en' ? "Share Expertise" : lang === 'es' ? "Compartir Experiencia" : lang === 'fr' ? "Partager l'Expertise" : "شارك الخبرة",
        description: lang === 'en'
          ? "Contribute your unique perspective and learn from others"
          : lang === 'es'
          ? "Contribuye con tu perspectiva única y aprende de otros"
          : lang === 'fr'
          ? "Contribuez avec votre perspective unique et apprenez des autres"
          : "ساهم بمنظورك الفريد وتعلم من الآخرين"
      },
      {
        title: lang === 'en' ? "Create Impact" : lang === 'es' ? "Crear Impacto" : lang === 'fr' ? "Créer un Impact" : "أحدث تأثيراً",
        description: lang === 'en'
          ? "Turn ideas into action with real-world climate solutions"
          : lang === 'es'
          ? "Convierte ideas en acción con soluciones climáticas del mundo real"
          : lang === 'fr'
          ? "Transformez les idées en action avec des solutions climatiques réelles"
          : "حول الأفكار إلى عمل مع حلول مناخية حقيقية"
      }
    ],

    welcomeSteps: [
      lang === 'en' ? "Tell us about yourself and your background" :
      lang === 'es' ? "Cuéntanos sobre ti y tu trasfondo" :
      lang === 'fr' ? "Parlez-nous de vous et de votre background" :
      "أخبرنا عن نفسك وخلفيتك",

      lang === 'en' ? "Share your work experience and expertise areas" :
      lang === 'es' ? "Comparte tu experiencia laboral y áreas de especialización" :
      lang === 'fr' ? "Partagez votre expérience professionnelle et domaines d'expertise" :
      "شارك تجربتك المهنية ومجالات خبرتك",

      lang === 'en' ? "Add recent projects to showcase your contributions" :
      lang === 'es' ? "Agrega proyectos recientes para mostrar tus contribuciones" :
      lang === 'fr' ? "Ajoutez des projets récents pour présenter vos contributions" :
      "أضف مشاريع حديثة لإظهار مساهماتك",

      lang === 'en' ? "Choose your privacy and visibility settings" :
      lang === 'es' ? "Elige tu configuración de privacidad y visibilidad" :
      lang === 'fr' ? "Choisissez vos paramètres de confidentialité et de visibilité" :
      "اختر إعدادات الخصوصية والرؤية"
    ],

    getStartedText: lang === 'en' ? "Get Started" : lang === 'es' ? "Comenzar" : lang === 'fr' ? "Commencer" : "ابدأ",
    timeEstimate: lang === 'en' ? "This will take about 5 minutes" :
                  lang === 'es' ? "Esto tomará aproximadamente 5 minutos" :
                  lang === 'fr' ? "Cela prendra environ 5 minutes" :
                  "سيستغرق هذا حوالي 5 دقائق",

    // Step Descriptions
    basicInfoTitle: lang === 'en' ? "Basic Information" : lang === 'es' ? "Información Básica" : lang === 'fr' ? "Informations de Base" : "المعلومات الأساسية",
    basicInfoDescription: lang === 'en'
      ? "Tell us a bit about yourself. This information will help others find and connect with you."
      : lang === 'es'
      ? "Cuéntanos un poco sobre ti. Esta información ayudará a otros a encontrarte y conectar contigo."
      : lang === 'fr'
      ? "Parlez-nous un peu de vous. Ces informations aideront les autres à vous trouver et à se connecter avec vous."
      : "أخبرنا قليلاً عن نفسك. هذه المعلومات ستساعد الآخرين في العثور عليك والتواصل معك.",

    basicInfoFieldHints: {
      usernameHint: lang === 'en'
        ? "This will be used in your profile URL (example.com/profiles/your-username)"
        : lang === 'es'
        ? "Esto se usará en la URL de tu perfil (ejemplo.com/profiles/tu-usuario)"
        : lang === 'fr'
        ? "Ceci sera utilisé dans l'URL de votre profil (exemple.com/profiles/votre-nom-utilisateur)"
        : "سيتم استخدام هذا في رابط ملفك الشخصي (مثال.com/profiles/اسم-المستخدم)",

      bioHint: lang === 'en'
        ? "Share what makes you unique and what you're passionate about"
        : lang === 'es'
        ? "Comparte lo que te hace único y lo que te apasiona"
        : lang === 'fr'
        ? "Partagez ce qui vous rend unique et ce qui vous passionne"
        : "شارك ما يجعلك فريداً وما تتحمس له",

      languageHint: lang === 'en'
        ? "Choose your preferred language for the platform"
        : lang === 'es'
        ? "Elige tu idioma preferido para la plataforma"
        : lang === 'fr'
        ? "Choisissez votre langue préférée pour la plateforme"
        : "اختر لغتك المفضلة للمنصة"
    },

    // Continue with other sections...
    workInfoTitle: lang === 'en' ? "Work Information" : lang === 'es' ? "Información Laboral" : lang === 'fr' ? "Informations Professionnelles" : "معلومات العمل",
    workInfoDescription: lang === 'en'
      ? "Help us understand your professional background and areas of expertise."
      : lang === 'es'
      ? "Ayúdanos a entender tu trasfondo profesional y áreas de especialización."
      : lang === 'fr'
      ? "Aidez-nous à comprendre votre parcours professionnel et vos domaines d'expertise."
      : "ساعدنا في فهم خلفيتك المهنية ومجالات خبرتك.",

    // Navigation texts
    navigationTexts: {
      next: lang === 'en' ? "Next" : lang === 'es' ? "Siguiente" : lang === 'fr' ? "Suivant" : "التالي",
      previous: lang === 'en' ? "Previous" : lang === 'es' ? "Anterior" : lang === 'fr' ? "Précédent" : "السابق",
      continue: lang === 'en' ? "Continue" : lang === 'es' ? "Continuar" : lang === 'fr' ? "Continuer" : "متابعة",
      cancel: lang === 'en' ? "Cancel" : lang === 'es' ? "Cancelar" : lang === 'fr' ? "Annuler" : "إلغاء"
    }
  }
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting onboarding content migration to Sanity...')

  try {
    const translations = loadTranslations()
    const documents = []

    // Create documents for each language
    for (const lang of languages) {
      console.log(`📝 Creating onboarding content for ${languageNames[lang]}...`)
      const doc = createOnboardingContent(lang, translations)
      documents.push(doc)
    }

    // Upload to Sanity
    console.log('⬆️  Uploading documents to Sanity...')
    const transaction = client.transaction()

    documents.forEach(doc => {
      transaction.createOrReplace(doc)
    })

    const result = await transaction.commit()
    console.log('✅ Migration completed successfully!')

    if (Array.isArray(result)) {
      console.log(`📊 Created ${result.length} onboarding content documents`)
      result.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${languageNames[doc.language]} (${doc._id})`)
      })
    } else {
      console.log('📊 Documents created successfully')
      console.log('Result:', result)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrate()