#!/usr/bin/env node

/**
 * Populate Onboarding Content in Sanity
 *
 * This script creates onboarding content documents in all supported languages
 * to provide proper translations for the onboarding flow.
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_EDITOR_TOKEN,
  useCdn: false,
})

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Onboarding content data for each language
const onboardingContent = {
  en: {
    language: 'en',
    title: 'Onboarding Content - English',

    // Welcome Step
    welcomeTitle: 'Welcome to the Community Hub',
    welcomeSubtitle: 'Connect with changemakers, share knowledge, and amplify your impact in your community and beyond.',
    welcomeFeatures: [
      {
        title: 'Connect & Collaborate',
        description: 'Find like-minded individuals and organizations working on similar challenges.'
      },
      {
        title: 'Share Your Work',
        description: 'Showcase your projects, research, and initiatives to inspire others.'
      },
      {
        title: 'Access Resources',
        description: 'Discover tools, funding opportunities, and knowledge to advance your work.'
      }
    ],
    welcomeSteps: [
      'Tell us about yourself',
      'Share your work and expertise',
      'Add recent projects',
      'Set your privacy preferences'
    ],
    getStartedText: 'Get Started',
    timeEstimate: 'Takes about 5 minutes',

    // Step Descriptions
    basicInfoTitle: 'Basic Information',
    basicInfoDescription: 'Help us get to know you better. This information will be used to create your profile and connect you with relevant opportunities.',
    workInfoTitle: 'Work & Expertise',
    workInfoDescription: 'Tell us about your professional background and areas of expertise. This helps us match you with relevant collaborators and opportunities.',
    recentWorkTitle: 'Recent Work',
    recentWorkDescription: 'Share some of your recent projects or initiatives. This gives others insight into your work and can spark collaboration.',

    // Privacy Settings
    privacyTitle: 'Privacy Settings',
    privacyDescription: 'Control how your information is shared and who can find you in the community.',
    searchabilityTitle: 'Profile Discoverability',
    searchabilityDescription: 'Allow others to find your profile when searching the community.',
    searchabilityHint: 'When enabled, your profile may appear in search results and recommendations',
    visibilityTitle: 'Profile Visibility',
    visibilityDescription: 'Choose who can view your full profile information.',
    visibilityOptions: {
      publicTitle: 'Public',
      publicDescription: 'Anyone can view your profile, including non-members',
      membersTitle: 'Members Only',
      membersDescription: 'Only community members can view your profile',
      privateTitle: 'Private',
      privateDescription: 'Your profile is only visible to you'
    },
    profileInfoTitle: 'Information Visibility',
    profileInfoDescription: 'Choose which parts of your profile are visible to others.',
    privacyFieldHints: {
      emailHint: 'Allow others to see your email address for direct contact',
      phoneHint: 'Display your phone number for collaboration opportunities',
      workHint: 'Show your professional background and current work',
      socialHint: 'Display links to your social media and professional profiles',
      locationHint: 'Show your city and country for local connections'
    },

    // Review & Submit
    reviewTitle: 'Almost Done!',
    reviewDescription: 'Please review your information before completing your profile setup.',
    reviewReadyTitle: 'Ready to Join',
    reviewReadyDescription: 'Your profile is ready! Complete the setup to start connecting with the community.',
    completeOnboardingText: 'Complete Setup',

    // Redirect Dialog
    redirectDialogTitle: 'Complete Your Profile',
    redirectDialogMessage: 'To get the most out of the community, we recommend completing your profile. This helps others find and connect with you.',
    proceedToOnboardingText: 'Complete Profile',
    continueToHubText: 'Continue to Hub',
    oneTimeWaiverText: 'You can complete this later',

    // Field Hints
    basicInfoFieldHints: {
      usernameHint: 'This will be your unique identifier in the community. Choose something memorable!',
      bioHint: 'A brief introduction about yourself and your interests. This appears on your profile.',
      languageHint: 'Select your preferred language for platform communications'
    },
    workInfoFieldHints: {
      workTypesDescription: 'Select all that apply to your current or recent work',
      expertiseDescription: 'Choose the areas where you have knowledge or experience',
      workBioHint: 'Describe your professional background and current focus areas',
      socialLinksDescription: 'Add links to help others learn more about your work'
    },
    recentWorkFieldHints: {
      workLinkHint: 'Link to project website, publication, or portfolio',
      isOngoingHint: 'Check if this project is still active',
      noWorkDescription: 'No worries! You can add work examples later from your profile.'
    }
  },

  es: {
    language: 'es',
    title: 'Contenido de Incorporación - Español',

    // Welcome Step
    welcomeTitle: 'Bienvenido al Centro Comunitario',
    welcomeSubtitle: 'Conecta con agentes de cambio, comparte conocimiento y amplifica tu impacto en tu comunidad y más allá.',
    welcomeFeatures: [
      {
        title: 'Conectar y Colaborar',
        description: 'Encuentra personas y organizaciones con ideas afines que trabajen en desafíos similares.'
      },
      {
        title: 'Comparte tu Trabajo',
        description: 'Muestra tus proyectos, investigaciones e iniciativas para inspirar a otros.'
      },
      {
        title: 'Accede a Recursos',
        description: 'Descubre herramientas, oportunidades de financiación y conocimiento para avanzar en tu trabajo.'
      }
    ],
    welcomeSteps: [
      'Cuéntanos sobre ti',
      'Comparte tu trabajo y experiencia',
      'Añade proyectos recientes',
      'Configura tus preferencias de privacidad'
    ],
    getStartedText: 'Comenzar',
    timeEstimate: 'Toma aproximadamente 5 minutos',

    // Step Descriptions
    basicInfoTitle: 'Información Básica',
    basicInfoDescription: 'Ayúdanos a conocerte mejor. Esta información se utilizará para crear tu perfil y conectarte con oportunidades relevantes.',
    workInfoTitle: 'Trabajo y Experiencia',
    workInfoDescription: 'Cuéntanos sobre tu experiencia profesional y áreas de especialización. Esto nos ayuda a conectarte con colaboradores y oportunidades relevantes.',
    recentWorkTitle: 'Trabajo Reciente',
    recentWorkDescription: 'Comparte algunos de tus proyectos o iniciativas recientes. Esto da a otros una idea de tu trabajo y puede generar colaboración.',

    // Privacy Settings
    privacyTitle: 'Configuración de Privacidad',
    privacyDescription: 'Controla cómo se comparte tu información y quién puede encontrarte en la comunidad.',
    searchabilityTitle: 'Descubrimiento de Perfil',
    searchabilityDescription: 'Permite que otros encuentren tu perfil al buscar en la comunidad.',
    searchabilityHint: 'Cuando esté habilitado, tu perfil puede aparecer en resultados de búsqueda y recomendaciones',
    visibilityTitle: 'Visibilidad del Perfil',
    visibilityDescription: 'Elige quién puede ver la información completa de tu perfil.',
    visibilityOptions: {
      publicTitle: 'Público',
      publicDescription: 'Cualquiera puede ver tu perfil, incluyendo no miembros',
      membersTitle: 'Solo Miembros',
      membersDescription: 'Solo los miembros de la comunidad pueden ver tu perfil',
      privateTitle: 'Privado',
      privateDescription: 'Tu perfil solo es visible para ti'
    },
    profileInfoTitle: 'Visibilidad de Información',
    profileInfoDescription: 'Elige qué partes de tu perfil son visibles para otros.',
    privacyFieldHints: {
      emailHint: 'Permite que otros vean tu dirección de correo electrónico para contacto directo',
      phoneHint: 'Muestra tu número de teléfono para oportunidades de colaboración',
      workHint: 'Muestra tu experiencia profesional y trabajo actual',
      socialHint: 'Muestra enlaces a tus redes sociales y perfiles profesionales',
      locationHint: 'Muestra tu ciudad y país para conexiones locales'
    },

    // Review & Submit
    reviewTitle: '¡Casi Terminado!',
    reviewDescription: 'Por favor revisa tu información antes de completar la configuración de tu perfil.',
    reviewReadyTitle: 'Listo para Unirse',
    reviewReadyDescription: '¡Tu perfil está listo! Completa la configuración para comenzar a conectar con la comunidad.',
    completeOnboardingText: 'Completar Configuración',

    // Redirect Dialog
    redirectDialogTitle: 'Completa tu Perfil',
    redirectDialogMessage: 'Para aprovechar al máximo la comunidad, recomendamos completar tu perfil. Esto ayuda a otros a encontrarte y conectar contigo.',
    proceedToOnboardingText: 'Completar Perfil',
    continueToHubText: 'Continuar al Centro',
    oneTimeWaiverText: 'Puedes completar esto más tarde',

    // Field Hints
    basicInfoFieldHints: {
      usernameHint: 'Este será tu identificador único en la comunidad. ¡Elige algo memorable!',
      bioHint: 'Una breve introducción sobre ti y tus intereses. Esto aparece en tu perfil.',
      languageHint: 'Selecciona tu idioma preferido para las comunicaciones de la plataforma'
    },
    workInfoFieldHints: {
      workTypesDescription: 'Selecciona todos los que se apliquen a tu trabajo actual o reciente',
      expertiseDescription: 'Elige las áreas donde tienes conocimiento o experiencia',
      workBioHint: 'Describe tu experiencia profesional y áreas de enfoque actuales',
      socialLinksDescription: 'Añade enlaces para ayudar a otros a conocer más sobre tu trabajo'
    },
    recentWorkFieldHints: {
      workLinkHint: 'Enlace al sitio web del proyecto, publicación o portafolio',
      isOngoingHint: 'Marca si este proyecto sigue activo',
      noWorkDescription: '¡No te preocupes! Puedes añadir ejemplos de trabajo más tarde desde tu perfil.'
    }
  },

  fr: {
    language: 'fr',
    title: 'Contenu d\'Intégration - Français',

    // Welcome Step
    welcomeTitle: 'Bienvenue au Centre Communautaire',
    welcomeSubtitle: 'Connectez-vous avec des agents de changement, partagez des connaissances et amplifiez votre impact dans votre communauté et au-delà.',
    welcomeFeatures: [
      {
        title: 'Connecter et Collaborer',
        description: 'Trouvez des individus et organisations partageant les mêmes idées travaillant sur des défis similaires.'
      },
      {
        title: 'Partagez Votre Travail',
        description: 'Présentez vos projets, recherches et initiatives pour inspirer les autres.'
      },
      {
        title: 'Accédez aux Ressources',
        description: 'Découvrez des outils, opportunités de financement et connaissances pour faire avancer votre travail.'
      }
    ],
    welcomeSteps: [
      'Parlez-nous de vous',
      'Partagez votre travail et expertise',
      'Ajoutez des projets récents',
      'Définissez vos préférences de confidentialité'
    ],
    getStartedText: 'Commencer',
    timeEstimate: 'Prend environ 5 minutes',

    // Step Descriptions
    basicInfoTitle: 'Informations de Base',
    basicInfoDescription: 'Aidez-nous à mieux vous connaître. Ces informations seront utilisées pour créer votre profil et vous connecter avec des opportunités pertinentes.',
    workInfoTitle: 'Travail et Expertise',
    workInfoDescription: 'Parlez-nous de votre expérience professionnelle et de vos domaines d\'expertise. Cela nous aide à vous connecter avec des collaborateurs et opportunités pertinents.',
    recentWorkTitle: 'Travail Récent',
    recentWorkDescription: 'Partagez certains de vos projets ou initiatives récents. Cela donne aux autres un aperçu de votre travail et peut susciter la collaboration.',

    // Privacy Settings
    privacyTitle: 'Paramètres de Confidentialité',
    privacyDescription: 'Contrôlez comment vos informations sont partagées et qui peut vous trouver dans la communauté.',
    searchabilityTitle: 'Découvrabilité du Profil',
    searchabilityDescription: 'Permettez aux autres de trouver votre profil lors de recherches dans la communauté.',
    searchabilityHint: 'Lorsque activé, votre profil peut apparaître dans les résultats de recherche et recommandations',
    visibilityTitle: 'Visibilité du Profil',
    visibilityDescription: 'Choisissez qui peut voir les informations complètes de votre profil.',
    visibilityOptions: {
      publicTitle: 'Public',
      publicDescription: 'Tout le monde peut voir votre profil, y compris les non-membres',
      membersTitle: 'Membres Seulement',
      membersDescription: 'Seuls les membres de la communauté peuvent voir votre profil',
      privateTitle: 'Privé',
      privateDescription: 'Votre profil n\'est visible que par vous'
    },
    profileInfoTitle: 'Visibilité des Informations',
    profileInfoDescription: 'Choisissez quelles parties de votre profil sont visibles aux autres.',
    privacyFieldHints: {
      emailHint: 'Permettre aux autres de voir votre adresse e-mail pour un contact direct',
      phoneHint: 'Afficher votre numéro de téléphone pour des opportunités de collaboration',
      workHint: 'Montrer votre expérience professionnelle et travail actuel',
      socialHint: 'Afficher les liens vers vos réseaux sociaux et profils professionnels',
      locationHint: 'Montrer votre ville et pays pour des connexions locales'
    },

    // Review & Submit
    reviewTitle: 'Presque Terminé !',
    reviewDescription: 'Veuillez réviser vos informations avant de compléter la configuration de votre profil.',
    reviewReadyTitle: 'Prêt à Rejoindre',
    reviewReadyDescription: 'Votre profil est prêt ! Complétez la configuration pour commencer à vous connecter avec la communauté.',
    completeOnboardingText: 'Terminer la Configuration',

    // Redirect Dialog
    redirectDialogTitle: 'Complétez Votre Profil',
    redirectDialogMessage: 'Pour tirer le meilleur parti de la communauté, nous recommandons de compléter votre profil. Cela aide les autres à vous trouver et se connecter avec vous.',
    proceedToOnboardingText: 'Compléter le Profil',
    continueToHubText: 'Continuer vers le Centre',
    oneTimeWaiverText: 'Vous pouvez compléter ceci plus tard',

    // Field Hints
    basicInfoFieldHints: {
      usernameHint: 'Ce sera votre identifiant unique dans la communauté. Choisissez quelque chose de mémorable !',
      bioHint: 'Une brève introduction sur vous et vos intérêts. Ceci apparaît sur votre profil.',
      languageHint: 'Sélectionnez votre langue préférée pour les communications de la plateforme'
    },
    workInfoFieldHints: {
      workTypesDescription: 'Sélectionnez tous ceux qui s\'appliquent à votre travail actuel ou récent',
      expertiseDescription: 'Choisissez les domaines où vous avez des connaissances ou de l\'expérience',
      workBioHint: 'Décrivez votre expérience professionnelle et domaines de focus actuels',
      socialLinksDescription: 'Ajoutez des liens pour aider les autres à en savoir plus sur votre travail'
    },
    recentWorkFieldHints: {
      workLinkHint: 'Lien vers le site web du projet, publication ou portfolio',
      isOngoingHint: 'Cochez si ce projet est toujours actif',
      noWorkDescription: 'Pas de souci ! Vous pouvez ajouter des exemples de travail plus tard depuis votre profil.'
    }
  },

  ar: {
    language: 'ar',
    title: 'محتوى التأهيل - العربية',

    // Welcome Step
    welcomeTitle: 'مرحباً بك في المركز المجتمعي',
    welcomeSubtitle: 'تواصل مع صناع التغيير، شارك المعرفة وضاعف تأثيرك في مجتمعك وخارجه.',
    welcomeFeatures: [
      {
        title: 'التواصل والتعاون',
        description: 'ابحث عن الأفراد والمنظمات ذات التفكير المتشابه الذين يعملون على تحديات مماثلة.'
      },
      {
        title: 'شارك عملك',
        description: 'اعرض مشاريعك وأبحاثك ومبادراتك لإلهام الآخرين.'
      },
      {
        title: 'الوصول للموارد',
        description: 'اكتشف الأدوات وفرص التمويل والمعرفة لتطوير عملك.'
      }
    ],
    welcomeSteps: [
      'أخبرنا عن نفسك',
      'شارك عملك وخبرتك',
      'أضف المشاريع الحديثة',
      'اضبط تفضيلات الخصوصية'
    ],
    getStartedText: 'ابدأ',
    timeEstimate: 'يستغرق حوالي 5 دقائق',

    // Step Descriptions
    basicInfoTitle: 'المعلومات الأساسية',
    basicInfoDescription: 'ساعدنا في التعرف عليك بشكل أفضل. ستُستخدم هذه المعلومات لإنشاء ملفك الشخصي وربطك بالفرص ذات الصلة.',
    workInfoTitle: 'العمل والخبرة',
    workInfoDescription: 'أخبرنا عن خلفيتك المهنية ومجالات خبرتك. هذا يساعدنا في ربطك بالمتعاونين والفرص ذات الصلة.',
    recentWorkTitle: 'العمل الحديث',
    recentWorkDescription: 'شارك بعض مشاريعك أو مبادراتك الحديثة. هذا يعطي الآخرين نظرة على عملك ويمكن أن يثير التعاون.',

    // Privacy Settings
    privacyTitle: 'إعدادات الخصوصية',
    privacyDescription: 'تحكم في كيفية مشاركة معلوماتك ومن يمكنه العثور عليك في المجتمع.',
    searchabilityTitle: 'قابلية اكتشاف الملف الشخصي',
    searchabilityDescription: 'السماح للآخرين بالعثور على ملفك الشخصي عند البحث في المجتمع.',
    searchabilityHint: 'عند التفعيل، قد يظهر ملفك الشخصي في نتائج البحث والتوصيات',
    visibilityTitle: 'رؤية الملف الشخصي',
    visibilityDescription: 'اختر من يمكنه عرض معلومات ملفك الشخصي الكاملة.',
    visibilityOptions: {
      publicTitle: 'عام',
      publicDescription: 'يمكن لأي شخص عرض ملفك الشخصي، بما في ذلك غير الأعضاء',
      membersTitle: 'الأعضاء فقط',
      membersDescription: 'فقط أعضاء المجتمع يمكنهم عرض ملفك الشخصي',
      privateTitle: 'خاص',
      privateDescription: 'ملفك الشخصي مرئي لك فقط'
    },
    profileInfoTitle: 'رؤية المعلومات',
    profileInfoDescription: 'اختر أي أجزاء من ملفك الشخصي مرئية للآخرين.',
    privacyFieldHints: {
      emailHint: 'السماح للآخرين برؤية عنوان بريدك الإلكتروني للتواصل المباشر',
      phoneHint: 'عرض رقم هاتفك لفرص التعاون',
      workHint: 'إظهار خلفيتك المهنية وعملك الحالي',
      socialHint: 'عرض روابط وسائل التواصل الاجتماعي والملفات المهنية',
      locationHint: 'إظهار مدينتك وبلدك للتواصل المحلي'
    },

    // Review & Submit
    reviewTitle: 'تقريباً انتهينا!',
    reviewDescription: 'يرجى مراجعة معلوماتك قبل إكمال إعداد ملفك الشخصي.',
    reviewReadyTitle: 'جاهز للانضمام',
    reviewReadyDescription: 'ملفك الشخصي جاهز! أكمل الإعداد لبدء التواصل مع المجتمع.',
    completeOnboardingText: 'إكمال الإعداد',

    // Redirect Dialog
    redirectDialogTitle: 'أكمل ملفك الشخصي',
    redirectDialogMessage: 'للاستفادة القصوى من المجتمع، نوصي بإكمال ملفك الشخصي. هذا يساعد الآخرين في العثور عليك والتواصل معك.',
    proceedToOnboardingText: 'إكمال الملف الشخصي',
    continueToHubText: 'متابعة إلى المركز',
    oneTimeWaiverText: 'يمكنك إكمال هذا لاحقاً',

    // Field Hints
    basicInfoFieldHints: {
      usernameHint: 'سيكون هذا معرفك الفريد في المجتمع. اختر شيئاً لا يُنسى!',
      bioHint: 'مقدمة مختصرة عنك وعن اهتماماتك. تظهر في ملفك الشخصي.',
      languageHint: 'اختر لغتك المفضلة لتواصل المنصة'
    },
    workInfoFieldHints: {
      workTypesDescription: 'اختر كل ما ينطبق على عملك الحالي أو الحديث',
      expertiseDescription: 'اختر المجالات التي لديك فيها معرفة أو خبرة',
      workBioHint: 'صف خلفيتك المهنية ومجالات تركيزك الحالية',
      socialLinksDescription: 'أضف روابط لمساعدة الآخرين في معرفة المزيد عن عملك'
    },
    recentWorkFieldHints: {
      workLinkHint: 'رابط لموقع المشروع أو المنشور أو المحفظة',
      isOngoingHint: 'ضع علامة إذا كان هذا المشروع لا يزال نشطاً',
      noWorkDescription: 'لا بأس! يمكنك إضافة أمثلة للعمل لاحقاً من ملفك الشخصي.'
    }
  }
}

// Check if content already exists
async function checkExistingContent() {
  log('blue', '🔍 Checking for existing onboarding content...')

  try {
    const existing = await client.fetch(`*[_type == "onboardingContent"] | order(language asc) { language, title }`)

    if (existing.length > 0) {
      log('yellow', `Found ${existing.length} existing content document(s):`)
      existing.forEach(doc => {
        log('green', `  • ${doc.language}: ${doc.title}`)
      })
      return existing.map(doc => doc.language)
    } else {
      log('yellow', 'No existing onboarding content found.')
      return []
    }
  } catch (error) {
    log('red', `❌ Error checking existing content: ${error.message}`)
    return []
  }
}

// Create onboarding content documents
async function populateOnboardingContent() {
  log('blue', '🚀 Starting onboarding content population...')

  const existingLanguages = await checkExistingContent()
  const languages = ['en', 'es', 'fr', 'ar']
  const languagesToCreate = languages.filter(lang => !existingLanguages.includes(lang))

  if (languagesToCreate.length === 0) {
    log('green', '✅ All onboarding content already exists!')
    return
  }

  log('cyan', `📝 Creating content for languages: ${languagesToCreate.join(', ')}`)

  try {
    const transaction = client.transaction()

    languagesToCreate.forEach(lang => {
      const content = onboardingContent[lang]
      if (content) {
        transaction.create({
          _type: 'onboardingContent',
          ...content
        })
        log('blue', `  • Creating ${lang} content...`)
      }
    })

    const result = await transaction.commit()

    log('green', `✅ Successfully created ${languagesToCreate.length} onboarding content document(s)`)

    if (Array.isArray(result)) {
      result.forEach((doc, index) => {
        const lang = languagesToCreate[index]
        log('green', `  • ${lang}: ${doc._id}`)
      })
    }

    log('cyan', '\n📋 Next steps:')
    log('cyan', '1. Review content in Sanity Studio')
    log('cyan', '2. Update translations as needed')
    log('cyan', '3. Test the onboarding flow')

  } catch (error) {
    log('red', `❌ Error creating content: ${error.message}`)
    process.exit(1)
  }
}

// Main function
async function main() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_EDITOR_TOKEN) {
    log('red', '❌ Missing required environment variables')
    log('yellow', 'Required: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_EDITOR_TOKEN')
    process.exit(1)
  }

  try {
    await populateOnboardingContent()
    log('green', '\n🎉 Onboarding content population completed!')
  } catch (error) {
    log('red', `❌ Error: ${error.message}`)
    process.exit(1)
  }
}

// Run the script
main()