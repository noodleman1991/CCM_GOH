/**
 * Script to populate Sanity with comprehensive onboarding content in all supported languages
 * Run this script to create localized onboarding content documents
 *
 * Usage: node scripts/populate-onboarding-content.js
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

const onboardingContent = {
  en: {
    _type: 'onboardingContent',
    language: 'en',
    title: 'Welcome to Our Community',

    // Welcome Step Content
    welcomeTitle: 'Welcome to Our Community',
    welcomeSubtitle: 'Let\'s get you started on your journey',
    welcomeDescription: 'We\'re excited to have you join our global community of changemakers. This quick setup will help us connect you with the right people and opportunities.',
    welcomeFeatures: [
      {
        title: 'Connect with Changemakers',
        description: 'Find and collaborate with like-minded individuals working on similar causes worldwide.'
      },
      {
        title: 'Share Your Impact',
        description: 'Document and showcase your work through case studies, reports, and testimonials.'
      },
      {
        title: 'Access Resources',
        description: 'Discover tools, research, and funding opportunities to amplify your work.'
      },
      {
        title: 'Build Your Network',
        description: 'Join regional communities and connect with organizations in your area.'
      }
    ],
    welcomeSteps: 'We\'ll guide you through 4 simple steps to set up your profile.',
    gettingStartedTitle: 'Getting Started',
    gettingStartedDescription: 'Complete these steps to unlock the full potential of our platform.',
    getStartedText: 'Get Started',
    timeEstimate: 'Takes about 5-7 minutes',

    // Step Descriptions
    basicInfoTitle: 'Tell us about yourself',
    basicInfoDescription: 'Share your basic information so others can find and connect with you.',
    basicInfoFieldHints: 'Your name will be visible to other community members. Choose a display name you\'re comfortable sharing publicly.',

    workInfoTitle: 'Your work and expertise',
    workInfoDescription: 'Help us understand your background and areas of interest.',
    workInfoFieldHints: 'Select the work types and expertise areas that best describe your current or past experience. This helps us suggest relevant connections and opportunities.',

    recentWorkTitle: 'Your recent activities',
    recentWorkDescription: 'Share what you\'ve been working on recently.',
    recentWorkFieldHints: 'Describe your current projects or recent accomplishments. This gives others insight into your active areas of work.',

    // Privacy Settings
    privacyTitle: 'Privacy preferences',
    privacyDescription: 'Control how others can find and interact with you.',
    searchabilityTitle: 'Search visibility',
    searchabilityDescription: 'Allow others to find you through search',
    searchabilityHint: 'When enabled, other members can discover your profile through search. You can change this anytime in your account settings.',
    visibilityTitle: 'Profile visibility',
    visibilityDescription: 'Choose who can see your profile information',
    visibilityOptions: 'Select your preferred visibility level for your profile information.',
    profileInfoTitle: 'Information sharing',
    profileInfoDescription: 'What information should be visible to others',
    privacyFieldHints: 'These settings help protect your privacy while enabling meaningful connections. You can update these preferences anytime.',

    // Review & Submit
    reviewTitle: 'Review your information',
    reviewDescription: 'Please review all the information before completing your profile.',
    reviewReadyTitle: 'You\'re all set!',
    reviewReadyDescription: 'Your profile is ready to go. You can always update your information later in your account settings.',
    completeOnboardingText: 'Complete Setup',

    // Redirect Dialog
    redirectDialogTitle: 'Complete Your Profile',
    redirectDialogMessage: 'To access all features and connect with other community members, please complete your profile setup first.',
    proceedToOnboardingText: 'Complete Profile',
    continueToHubText: 'Skip for Now',
    oneTimeWaiverText: 'Don\'t show this message again',

    // Navigation
    navigationTexts: {
      next: 'Next',
      previous: 'Previous',
      skip: 'Skip',
      finish: 'Finish'
    },

    // Validation Messages
    validationMessages: {
      required: 'This field is required',
      emailInvalid: 'Please enter a valid email address',
      nameTooShort: 'Name must be at least 2 characters',
      descriptionTooLong: 'Description must be less than 500 characters'
    },

    // Field Labels
    fieldLabels: {
      basicInfo: {
        firstName: 'First Name',
        lastName: 'Last Name',
        displayName: 'Display Name',
        email: 'Email Address',
        location: 'Location',
        bio: 'Short Bio',
        website: 'Personal Website',
        country: 'Country',
        city: 'City',
        firstNamePlaceholder: 'Enter your first name',
        lastNamePlaceholder: 'Enter your last name',
        displayNamePlaceholder: 'Choose how others will see your name',
        bioPlaceholder: 'Tell us a bit about yourself...',
        countryPlaceholder: 'Select your country',
        cityPlaceholder: 'Enter your city'
      },
      workInfo: {
        workTypes: 'Type of Work',
        expertiseAreas: 'Areas of Expertise',
        experienceLevel: 'Experience Level',
        currentRole: 'Current Role',
        organization: 'Organization/Institution',
        position: 'Position/Title',
        workBio: 'Professional Bio',
        linkedin: 'LinkedIn Profile',
        portfolio: 'Portfolio',
        github: 'GitHub Profile',
        website: 'Website',
        personalWebsite: 'Personal Website',
        linkedinProfile: 'LinkedIn',
        githubProfile: 'GitHub',
        twitterHandle: 'Twitter',
        socialLinks: 'Social Links',
        organizationPlaceholder: 'Enter your organization name',
        positionPlaceholder: 'Enter your job title or role',
        workBioPlaceholder: 'Describe your professional background and experience...',
        linkedinPlaceholder: 'your-linkedin-username',
        portfolioPlaceholder: 'https://yourportfolio.com',
        githubPlaceholder: 'your-github-username',
        websitePlaceholder: 'https://yourwebsite.com'
      },
      recentWork: {
        title: 'Project Title',
        description: 'Description',
        link: 'Project Link',
        startDate: 'Start Date',
        endDate: 'End Date',
        isOngoing: 'Currently working on this',
        titlePlaceholder: 'Enter project title',
        descriptionPlaceholder: 'Describe what you accomplished or are working on...',
        linkPlaceholder: 'https://example.com (optional)'
      }
    },

    // Privacy Field Labels
    privacyFieldLabels: {
      searchable: 'Make my profile searchable',
      showEmail: 'Show email to other members',
      showLocation: 'Show my location',
      showOrganization: 'Show my organization',
      contactable: 'Allow others to contact me'
    },

    // Visibility Options
    visibilityLabels: {
      public: 'Public - Visible to everyone',
      members: 'Members only - Visible to logged-in members',
      connections: 'Connections only - Visible to my connections',
      private: 'Private - Only visible to me'
    }
  },

  es: {
    _type: 'onboardingContent',
    language: 'es',
    title: 'Bienvenido a Nuestra Comunidad',

    // Welcome Step Content
    welcomeTitle: 'Bienvenido a Nuestra Comunidad',
    welcomeSubtitle: 'Comencemos tu viaje',
    welcomeDescription: 'Nos emociona tenerte en nuestra comunidad global de agentes de cambio. Esta configuración rápida nos ayudará a conectarte con las personas y oportunidades adecuadas.',
    welcomeFeatures: [
      {
        title: 'Conecta con Agentes de Cambio',
        description: 'Encuentra y colabora con personas afines que trabajan en causas similares en todo el mundo.'
      },
      {
        title: 'Comparte tu Impacto',
        description: 'Documenta y muestra tu trabajo a través de estudios de caso, informes y testimonios.'
      },
      {
        title: 'Accede a Recursos',
        description: 'Descubre herramientas, investigación y oportunidades de financiamiento para amplificar tu trabajo.'
      },
      {
        title: 'Construye tu Red',
        description: 'Únete a comunidades regionales y conéctate con organizaciones en tu área.'
      }
    ],
    welcomeSteps: 'Te guiaremos a través de 4 pasos simples para configurar tu perfil.',
    gettingStartedTitle: 'Comenzando',
    gettingStartedDescription: 'Completa estos pasos para desbloquear todo el potencial de nuestra plataforma.',
    getStartedText: 'Comenzar',
    timeEstimate: 'Toma aproximadamente 5-7 minutos',

    // Step Descriptions
    basicInfoTitle: 'Cuéntanos sobre ti',
    basicInfoDescription: 'Comparte tu información básica para que otros puedan encontrarte y conectar contigo.',
    basicInfoFieldHints: 'Tu nombre será visible para otros miembros de la comunidad. Elige un nombre de usuario con el que te sientas cómodo compartiendo públicamente.',

    workInfoTitle: 'Tu trabajo y experiencia',
    workInfoDescription: 'Ayúdanos a entender tu trasfondo y áreas de interés.',
    workInfoFieldHints: 'Selecciona los tipos de trabajo y áreas de experiencia que mejor describan tu experiencia actual o pasada. Esto nos ayuda a sugerir conexiones y oportunidades relevantes.',

    recentWorkTitle: 'Tus actividades recientes',
    recentWorkDescription: 'Comparte en qué has estado trabajando recientemente.',
    recentWorkFieldHints: 'Describe tus proyectos actuales o logros recientes. Esto da a otros una idea de tus áreas de trabajo activas.',

    // Privacy Settings
    privacyTitle: 'Preferencias de privacidad',
    privacyDescription: 'Controla cómo otros pueden encontrarte e interactuar contigo.',
    searchabilityTitle: 'Visibilidad en búsquedas',
    searchabilityDescription: 'Permitir que otros te encuentren a través de búsquedas',
    searchabilityHint: 'Cuando esté habilitado, otros miembros pueden descubrir tu perfil a través de búsquedas. Puedes cambiar esto en cualquier momento en la configuración de tu cuenta.',
    visibilityTitle: 'Visibilidad del perfil',
    visibilityDescription: 'Elige quién puede ver la información de tu perfil',
    visibilityOptions: 'Selecciona tu nivel de visibilidad preferido para la información de tu perfil.',
    profileInfoTitle: 'Compartir información',
    profileInfoDescription: 'Qué información debe ser visible para otros',
    privacyFieldHints: 'Estas configuraciones ayudan a proteger tu privacidad mientras permiten conexiones significativas. Puedes actualizar estas preferencias en cualquier momento.',

    // Review & Submit
    reviewTitle: 'Revisa tu información',
    reviewDescription: 'Por favor revisa toda la información antes de completar tu perfil.',
    reviewReadyTitle: '¡Estás listo!',
    reviewReadyDescription: 'Tu perfil está listo. Siempre puedes actualizar tu información más tarde en la configuración de tu cuenta.',
    completeOnboardingText: 'Completar Configuración',

    // Redirect Dialog
    redirectDialogTitle: 'Completa tu Perfil',
    redirectDialogMessage: 'Para acceder a todas las funciones y conectar con otros miembros de la comunidad, por favor completa primero la configuración de tu perfil.',
    proceedToOnboardingText: 'Completar Perfil',
    continueToHubText: 'Omitir por Ahora',
    oneTimeWaiverText: 'No mostrar este mensaje nuevamente',

    // Navigation
    navigationTexts: {
      next: 'Siguiente',
      previous: 'Anterior',
      skip: 'Omitir',
      finish: 'Finalizar'
    },

    // Validation Messages
    validationMessages: {
      required: 'Este campo es obligatorio',
      emailInvalid: 'Por favor ingresa una dirección de email válida',
      nameTooShort: 'El nombre debe tener al menos 2 caracteres',
      descriptionTooLong: 'La descripción debe ser menor a 500 caracteres'
    },

    // Field Labels
    fieldLabels: {
      basicInfo: {
        firstName: 'Nombre',
        lastName: 'Apellido',
        displayName: 'Nombre de Usuario',
        email: 'Dirección de Email',
        location: 'Ubicación',
        bio: 'Biografía Breve',
        website: 'Sitio Web Personal',
        country: 'País',
        city: 'Ciudad',
        firstNamePlaceholder: 'Ingresa tu nombre',
        lastNamePlaceholder: 'Ingresa tu apellido',
        displayNamePlaceholder: 'Elige cómo otros verán tu nombre',
        bioPlaceholder: 'Cuéntanos un poco sobre ti...',
        countryPlaceholder: 'Selecciona tu país',
        cityPlaceholder: 'Ingresa tu ciudad'
      },
      workInfo: {
        workTypes: 'Tipo de Trabajo',
        expertiseAreas: 'Áreas de Experiencia',
        experienceLevel: 'Nivel de Experiencia',
        currentRole: 'Rol Actual',
        organization: 'Organización/Institución',
        position: 'Posición/Título',
        workBio: 'Biografía Profesional',
        linkedin: 'Perfil de LinkedIn',
        portfolio: 'Portafolio',
        github: 'Perfil de GitHub',
        website: 'Sitio Web',
        personalWebsite: 'Sitio Web Personal',
        linkedinProfile: 'LinkedIn',
        githubProfile: 'GitHub',
        twitterHandle: 'Twitter',
        socialLinks: 'Enlaces Sociales',
        organizationPlaceholder: 'Ingresa el nombre de tu organización',
        positionPlaceholder: 'Ingresa tu título o rol',
        workBioPlaceholder: 'Describe tu experiencia y trayectoria profesional...',
        linkedinPlaceholder: 'tu-usuario-linkedin',
        portfolioPlaceholder: 'https://tuportafolio.com',
        githubPlaceholder: 'tu-usuario-github',
        websitePlaceholder: 'https://tusitio.com'
      },
      recentWork: {
        title: 'Título del Proyecto',
        description: 'Descripción',
        link: 'Enlace del Proyecto',
        startDate: 'Fecha de Inicio',
        endDate: 'Fecha de Finalización',
        isOngoing: 'Actualmente trabajando en esto',
        titlePlaceholder: 'Ingresa el título del proyecto',
        descriptionPlaceholder: 'Describe lo que lograste o en lo que estás trabajando...',
        linkPlaceholder: 'https://ejemplo.com (opcional)'
      }
    },

    // Privacy Field Labels
    privacyFieldLabels: {
      searchable: 'Hacer mi perfil buscable',
      showEmail: 'Mostrar email a otros miembros',
      showLocation: 'Mostrar mi ubicación',
      showOrganization: 'Mostrar mi organización',
      contactable: 'Permitir que otros me contacten'
    },

    // Visibility Options
    visibilityLabels: {
      public: 'Público - Visible para todos',
      members: 'Solo miembros - Visible para miembros conectados',
      connections: 'Solo conexiones - Visible para mis conexiones',
      private: 'Privado - Solo visible para mí'
    }
  },

  fr: {
    _type: 'onboardingContent',
    language: 'fr',
    title: 'Bienvenue dans Notre Communauté',

    // Welcome Step Content
    welcomeTitle: 'Bienvenue dans Notre Communauté',
    welcomeSubtitle: 'Commençons votre parcours',
    welcomeDescription: 'Nous sommes ravis de vous accueillir dans notre communauté mondiale d\'acteurs du changement. Cette configuration rapide nous aidera à vous connecter avec les bonnes personnes et opportunités.',
    welcomeFeatures: [
      {
        title: 'Connectez-vous avec des Acteurs du Changement',
        description: 'Trouvez et collaborez avec des personnes partageant les mêmes idées et travaillant sur des causes similaires dans le monde entier.'
      },
      {
        title: 'Partagez votre Impact',
        description: 'Documentez et présentez votre travail à travers des études de cas, rapports et témoignages.'
      },
      {
        title: 'Accédez aux Ressources',
        description: 'Découvrez des outils, recherches et opportunités de financement pour amplifier votre travail.'
      },
      {
        title: 'Construisez votre Réseau',
        description: 'Rejoignez des communautés régionales et connectez-vous avec des organisations de votre région.'
      }
    ],
    welcomeSteps: 'Nous vous guiderons à travers 4 étapes simples pour configurer votre profil.',
    gettingStartedTitle: 'Pour Commencer',
    gettingStartedDescription: 'Complétez ces étapes pour débloquer tout le potentiel de notre plateforme.',
    getStartedText: 'Commencer',
    timeEstimate: 'Prend environ 5-7 minutes',

    // Step Descriptions
    basicInfoTitle: 'Parlez-nous de vous',
    basicInfoDescription: 'Partagez vos informations de base pour que d\'autres puissent vous trouver et se connecter avec vous.',
    basicInfoFieldHints: 'Votre nom sera visible aux autres membres de la communauté. Choisissez un nom d\'affichage que vous êtes à l\'aise de partager publiquement.',

    workInfoTitle: 'Votre travail et expertise',
    workInfoDescription: 'Aidez-nous à comprendre votre parcours et vos domaines d\'intérêt.',
    workInfoFieldHints: 'Sélectionnez les types de travail et domaines d\'expertise qui décrivent le mieux votre expérience actuelle ou passée. Cela nous aide à suggérer des connexions et opportunités pertinentes.',

    recentWorkTitle: 'Vos activités récentes',
    recentWorkDescription: 'Partagez ce sur quoi vous avez travaillé récemment.',
    recentWorkFieldHints: 'Décrivez vos projets actuels ou accomplissements récents. Cela donne aux autres un aperçu de vos domaines de travail actifs.',

    // Privacy Settings
    privacyTitle: 'Préférences de confidentialité',
    privacyDescription: 'Contrôlez comment les autres peuvent vous trouver et interagir avec vous.',
    searchabilityTitle: 'Visibilité de recherche',
    searchabilityDescription: 'Permettre aux autres de vous trouver par recherche',
    searchabilityHint: 'Lorsqu\'activé, d\'autres membres peuvent découvrir votre profil par recherche. Vous pouvez changer cela à tout moment dans les paramètres de votre compte.',
    visibilityTitle: 'Visibilité du profil',
    visibilityDescription: 'Choisissez qui peut voir les informations de votre profil',
    visibilityOptions: 'Sélectionnez votre niveau de visibilité préféré pour les informations de votre profil.',
    profileInfoTitle: 'Partage d\'informations',
    profileInfoDescription: 'Quelles informations doivent être visibles aux autres',
    privacyFieldHints: 'Ces paramètres aident à protéger votre vie privée tout en permettant des connexions significatives. Vous pouvez mettre à jour ces préférences à tout moment.',

    // Review & Submit
    reviewTitle: 'Vérifiez vos informations',
    reviewDescription: 'Veuillez vérifier toutes les informations avant de compléter votre profil.',
    reviewReadyTitle: 'Vous êtes prêt !',
    reviewReadyDescription: 'Votre profil est prêt. Vous pouvez toujours mettre à jour vos informations plus tard dans les paramètres de votre compte.',
    completeOnboardingText: 'Terminer la Configuration',

    // Redirect Dialog
    redirectDialogTitle: 'Complétez votre Profil',
    redirectDialogMessage: 'Pour accéder à toutes les fonctionnalités et vous connecter avec d\'autres membres de la communauté, veuillez d\'abord compléter la configuration de votre profil.',
    proceedToOnboardingText: 'Compléter le Profil',
    continueToHubText: 'Ignorer pour Maintenant',
    oneTimeWaiverText: 'Ne plus afficher ce message',

    // Navigation
    navigationTexts: {
      next: 'Suivant',
      previous: 'Précédent',
      skip: 'Ignorer',
      finish: 'Terminer'
    },

    // Validation Messages
    validationMessages: {
      required: 'Ce champ est obligatoire',
      emailInvalid: 'Veuillez entrer une adresse email valide',
      nameTooShort: 'Le nom doit avoir au moins 2 caractères',
      descriptionTooLong: 'La description doit faire moins de 500 caractères'
    },

    // Field Labels
    fieldLabels: {
      basicInfo: {
        firstName: 'Prénom',
        lastName: 'Nom de famille',
        displayName: 'Nom d\'affichage',
        email: 'Adresse Email',
        location: 'Localisation',
        bio: 'Biographie Courte',
        website: 'Site Web Personnel'
      },
      workInfo: {
        workType: 'Type de Travail',
        expertiseAreas: 'Domaines d\'Expertise',
        experienceLevel: 'Niveau d\'Expérience',
        currentRole: 'Rôle Actuel',
        organization: 'Organisation/Institution'
      },
      recentWork: {
        currentProject: 'Projet Actuel',
        projectDescription: 'Description du Projet',
        achievements: 'Accomplissements Récents',
        interests: 'Domaines d\'Intérêt'
      }
    },

    // Privacy Field Labels
    privacyFieldLabels: {
      searchable: 'Rendre mon profil cherchable',
      showEmail: 'Montrer l\'email aux autres membres',
      showLocation: 'Montrer ma localisation',
      showOrganization: 'Montrer mon organisation',
      contactable: 'Permettre aux autres de me contacter'
    },

    // Visibility Options
    visibilityLabels: {
      public: 'Public - Visible par tous',
      members: 'Membres seulement - Visible par les membres connectés',
      connections: 'Connexions seulement - Visible par mes connexions',
      private: 'Privé - Visible par moi seulement'
    }
  },

  ar: {
    _type: 'onboardingContent',
    language: 'ar',
    title: 'مرحباً بك في مجتمعنا',

    // Welcome Step Content
    welcomeTitle: 'مرحباً بك في مجتمعنا',
    welcomeSubtitle: 'لنبدأ رحلتك معنا',
    welcomeDescription: 'نحن متحمسون لانضمامك إلى مجتمعنا العالمي من صناع التغيير. هذا الإعداد السريع سيساعدنا على ربطك بالأشخاص والفرص المناسبة.',
    welcomeFeatures: [
      {
        title: 'تواصل مع صناع التغيير',
        description: 'اعثر وتعاون مع الأشخاص الذين يشاركونك نفس التفكير ويعملون على قضايا مماثلة حول العالم.'
      },
      {
        title: 'شارك تأثيرك',
        description: 'وثق واعرض عملك من خلال دراسات الحالة والتقارير والشهادات.'
      },
      {
        title: 'الوصول للموارد',
        description: 'اكتشف الأدوات والبحوث وفرص التمويل لتضخيم عملك.'
      },
      {
        title: 'ابن شبكتك',
        description: 'انضم إلى المجتمعات الإقليمية وتواصل مع المنظمات في منطقتك.'
      }
    ],
    welcomeSteps: 'سنرشدك من خلال 4 خطوات بسيطة لإعداد ملفك الشخصي.',
    gettingStartedTitle: 'البداية',
    gettingStartedDescription: 'أكمل هذه الخطوات لإطلاق الإمكانيات الكاملة لمنصتنا.',
    getStartedText: 'ابدأ',
    timeEstimate: 'يستغرق حوالي 5-7 دقائق',

    // Step Descriptions
    basicInfoTitle: 'أخبرنا عن نفسك',
    basicInfoDescription: 'شارك معلوماتك الأساسية حتى يتمكن الآخرون من العثور عليك والتواصل معك.',
    basicInfoFieldHints: 'اسمك سيكون مرئياً لأعضاء المجتمع الآخرين. اختر اسم عرض تشعر بالراحة في مشاركته علناً.',

    workInfoTitle: 'عملك وخبرتك',
    workInfoDescription: 'ساعدنا على فهم خلفيتك ومجالات اهتمامك.',
    workInfoFieldHints: 'اختر أنواع العمل ومجالات الخبرة التي تصف تجربتك الحالية أو السابقة بأفضل شكل. هذا يساعدنا على اقتراح اتصالات وفرص ذات صلة.',

    recentWorkTitle: 'أنشطتك الحديثة',
    recentWorkDescription: 'شارك ما كنت تعمل عليه مؤخراً.',
    recentWorkFieldHints: 'صف مشاريعك الحالية أو إنجازاتك الحديثة. هذا يعطي الآخرين فكرة عن مجالات عملك النشطة.',

    // Privacy Settings
    privacyTitle: 'تفضيلات الخصوصية',
    privacyDescription: 'تحكم في كيفية عثور الآخرين عليك والتفاعل معك.',
    searchabilityTitle: 'رؤية البحث',
    searchabilityDescription: 'السماح للآخرين بالعثور عليك من خلال البحث',
    searchabilityHint: 'عند التفعيل، يمكن لأعضاء آخرين اكتشاف ملفك الشخصي من خلال البحث. يمكنك تغيير هذا في أي وقت في إعدادات حسابك.',
    visibilityTitle: 'رؤية الملف الشخصي',
    visibilityDescription: 'اختر من يمكنه رؤية معلومات ملفك الشخصي',
    visibilityOptions: 'اختر مستوى الرؤية المفضل لديك لمعلومات ملفك الشخصي.',
    profileInfoTitle: 'مشاركة المعلومات',
    profileInfoDescription: 'ما المعلومات التي يجب أن تكون مرئية للآخرين',
    privacyFieldHints: 'هذه الإعدادات تساعد على حماية خصوصيتك مع تمكين اتصالات مفيدة. يمكنك تحديث هذه التفضيلات في أي وقت.',

    // Review & Submit
    reviewTitle: 'راجع معلوماتك',
    reviewDescription: 'يرجى مراجعة جميع المعلومات قبل إكمال ملفك الشخصي.',
    reviewReadyTitle: 'كل شيء جاهز!',
    reviewReadyDescription: 'ملفك الشخصي جاهز للانطلاق. يمكنك دائماً تحديث معلوماتك لاحقاً في إعدادات حسابك.',
    completeOnboardingText: 'إكمال الإعداد',

    // Redirect Dialog
    redirectDialogTitle: 'أكمل ملفك الشخصي',
    redirectDialogMessage: 'للوصول لجميع الميزات والتواصل مع أعضاء المجتمع الآخرين، يرجى إكمال إعداد ملفك الشخصي أولاً.',
    proceedToOnboardingText: 'إكمال الملف الشخصي',
    continueToHubText: 'تخطي الآن',
    oneTimeWaiverText: 'عدم إظهار هذه الرسالة مرة أخرى',

    // Navigation
    navigationTexts: {
      next: 'التالي',
      previous: 'السابق',
      skip: 'تخطي',
      finish: 'إنهاء'
    },

    // Validation Messages
    validationMessages: {
      required: 'هذا الحقل مطلوب',
      emailInvalid: 'يرجى إدخال عنوان بريد إلكتروني صالح',
      nameTooShort: 'الاسم يجب أن يكون على الأقل حرفين',
      descriptionTooLong: 'الوصف يجب أن يكون أقل من 500 حرف'
    },

    // Field Labels
    fieldLabels: {
      basicInfo: {
        firstName: 'الاسم الأول',
        lastName: 'اسم العائلة',
        displayName: 'اسم العرض',
        email: 'عنوان البريد الإلكتروني',
        location: 'الموقع',
        bio: 'السيرة المختصرة',
        website: 'الموقع الشخصي'
      },
      workInfo: {
        workType: 'نوع العمل',
        expertiseAreas: 'مجالات الخبرة',
        experienceLevel: 'مستوى الخبرة',
        currentRole: 'الدور الحالي',
        organization: 'المنظمة/المؤسسة'
      },
      recentWork: {
        currentProject: 'المشروع الحالي',
        projectDescription: 'وصف المشروع',
        achievements: 'الإنجازات الحديثة',
        interests: 'مجالات الاهتمام'
      }
    },

    // Privacy Field Labels
    privacyFieldLabels: {
      searchable: 'جعل ملفي الشخصي قابل للبحث',
      showEmail: 'إظهار البريد الإلكتروني لأعضاء آخرين',
      showLocation: 'إظهار موقعي',
      showOrganization: 'إظهار منظمتي',
      contactable: 'السماح للآخرين بالتواصل معي'
    },

    // Visibility Options
    visibilityLabels: {
      public: 'عام - مرئي للجميع',
      members: 'الأعضاء فقط - مرئي للأعضاء المسجلين',
      connections: 'الاتصالات فقط - مرئي لاتصالاتي',
      private: 'خاص - مرئي لي فقط'
    }
  }
}

async function createOnboardingContent() {
  console.log('Starting to populate onboarding content...')

  try {
    const results = await Promise.all(
      Object.entries(onboardingContent).map(async ([language, content]) => {
        console.log(`Creating content for language: ${language}`)

        // Check if content already exists
        const existing = await client.fetch(
          `*[_type == "onboardingContent" && language == $language][0]`,
          { language }
        )

        if (existing) {
          console.log(`Updating existing content for ${language}`)
          return await client
            .patch(existing._id)
            .set(content)
            .commit()
        } else {
          console.log(`Creating new content for ${language}`)
          return await client.create(content)
        }
      })
    )

    console.log('✅ Successfully created/updated onboarding content for all languages:', results.length)
    console.log('Content created for languages:', Object.keys(onboardingContent))

  } catch (error) {
    console.error('❌ Error creating onboarding content:', error)
    process.exit(1)
  }
}

// Run the script
createOnboardingContent()