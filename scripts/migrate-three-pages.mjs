import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

// Translation dictionary
const TRANSLATIONS = {
  // About page
  'The Journey of Connecting Climate Minds': {
    es: 'El Viaje de Connecting Climate Minds',
    fr: 'Le Parcours de Connecting Climate Minds',
    ar: 'رحلة Connecting Climate Minds'
  },
  'Connecting Climate Minds Project': {
    es: 'Proyecto Connecting Climate Minds',
    fr: 'Projet Connecting Climate Minds',
    ar: 'مشروع Connecting Climate Minds'
  },
  'Connecting Climate Minds Hub': {
    es: 'Hub de Connecting Climate Minds',
    fr: 'Hub Connecting Climate Minds',
    ar: 'مركز Connecting Climate Minds'
  },
  'Who is involved': {
    es: 'Quién está involucrado',
    fr: 'Qui est impliqué',
    ar: 'من المشارك'
  },
  'Find out more': {
    es: 'Descubre más',
    fr: 'En savoir plus',
    ar: 'اعرف المزيد'
  },
  'Create an Account': {
    es: 'Crear una cuenta',
    fr: 'Créer un compte',
    ar: 'إنشاء حساب'
  },
  'View Team': {
    es: 'Ver equipo',
    fr: 'Voir l\'équipe',
    ar: 'عرض الفريق'
  },
  // Toolkits page
  'Toolkits': {
    es: 'Herramientas',
    fr: 'Boîtes à outils',
    ar: 'أدوات'
  },
  'View Toolkit': {
    es: 'Ver herramienta',
    fr: 'Voir la boîte à outils',
    ar: 'عرض الأداة'
  },
  // Community Agendas page
  'Agendas for populations facing amplified climate mental health impacts': {
    es: 'Agendas para poblaciones que enfrentan impactos amplificados del cambio climático en la salud mental',
    fr: 'Agendas pour les populations confrontées à des impacts amplifiés du changement climatique sur la santé mentale',
    ar: 'جداول أعمال للسكان الذين يواجهون تأثيرات مضخمة لتغير المناخ على الصحة النفسية'
  },
  'Youth Research and Action Agenda': {
    es: 'Agenda de Investigación y Acción Juvenil',
    fr: 'Programme de recherche et d\'action pour les jeunes',
    ar: 'جدول أعمال البحث والعمل للشباب'
  },
  'Indigenous Communities Research and Action Agenda': {
    es: 'Agenda de Investigación y Acción de Comunidades Indígenas',
    fr: 'Programme de recherche et d\'action des communautés autochtones',
    ar: 'جدول أعمال البحث والعمل للمجتمعات الأصلية'
  },
  'Small Farmer and Fisher Peoples Research and Action Agenda': {
    es: 'Agenda de Investigación y Acción de Pequeños Agricultores y Pescadores',
    fr: 'Programme de recherche et d\'action des petits agriculteurs et pêcheurs',
    ar: 'جدول أعمال البحث والعمل للمزارعين الصغار والصيادين'
  },
  'Summary Agenda': {
    es: 'Agenda resumida',
    fr: 'Résumé de l\'agenda',
    ar: 'ملخص جدول الأعمال'
  },
  'Full Agenda': {
    es: 'Agenda completa',
    fr: 'Agenda complet',
    ar: 'جدول الأعمال الكامل'
  },
  'Youth Declaration': {
    es: 'Declaración Juvenil',
    fr: 'Déclaration de la jeunesse',
    ar: 'إعلان الشباب'
  }
};

const UNCERTAIN_TRANSLATIONS = [];

function translate(text, targetLang) {
  if (!text) return text;

  // Check if we have a translation
  if (TRANSLATIONS[text] && TRANSLATIONS[text][targetLang]) {
    return TRANSLATIONS[text][targetLang];
  }

  // Mark as uncertain and return English
  UNCERTAIN_TRANSLATIONS.push({
    original: text,
    language: targetLang,
    context: 'Page content'
  });

  return text; // English fallback
}

function createBlockContent(text) {
  return [{
    _type: 'block',
    _key: `block-${Math.random().toString(36).substr(2, 9)}`,
    style: 'normal',
    children: [{
      _type: 'span',
      _key: `span-${Math.random().toString(36).substr(2, 9)}`,
      text: text,
      marks: []
    }],
    markDefs: []
  }];
}

async function createAboutPage(lang, imageRegistry) {
  console.log(`\n📄 Creating About page (${lang})...`);

  const headerImage = Object.values(imageRegistry).find(img => img.filename?.includes('hubAboutpng'));
  const peopleImage = Object.values(imageRegistry).find(img => img.filename?.includes('peoplepng'));
  const hubImage = Object.values(imageRegistry).find(img => img.filename?.includes('hubWelcomeToTheHubV2Png'));

  const page = {
    _type: 'page',
    _id: `page-about-${lang}`,
    title: lang === 'en' ? 'About' : translate('About', lang),
    language: lang,
    slug: {
      _type: 'slug',
      current: 'about'
    },
    blocks: [
      // Hero section
      {
        _type: 'hero-1',
        _key: 'hero',
        title: translate('The Journey of Connecting Climate Minds', lang),
        body: createBlockContent(
          lang === 'en'
            ? "Below you'll find the story of how Connecting Climate Minds came to be, our mission, and the passionate team behind our quest to integrate mental health and climate change research and action."
            : translate("Below you'll find the story of how Connecting Climate Minds came to be, our mission, and the passionate team behind our quest to integrate mental health and climate change research and action.", lang)
        ),
        ...(headerImage && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: headerImage.assetId
            },
            alt: headerImage.alt || 'About header'
          }
        }),
        imagePosition: 'right'
      },

      // CCM Project section
      {
        _type: 'split-row',
        _key: 'ccm-project',
        colorVariant: 'default',
        splitColumns: [{
          _type: 'split-content',
          _key: 'project-content',
          title: translate('Connecting Climate Minds Project', lang),
          body: createBlockContent(
            lang === 'en'
              ? "What is Connecting Climate Minds all about? The short answer: Connection. Connecting Climate Minds is working to foster connections between people all over the world to come together to understand and respond to the deep interconnections between climate change and mental health. Our core aims are to 1) develop an aligned and inclusive agenda for research and action, grounded in lived experience expertise of mental health challenges in the context of climate change, and 2) build connected communities of practice for climate change and mental health in seven global regions, equipped to enact this agenda."
              : translate("What is Connecting Climate Minds all about? The short answer: Connection. Connecting Climate Minds is working to foster connections between people all over the world to come together to understand and respond to the deep interconnections between climate change and mental health. Our core aims are to 1) develop an aligned and inclusive agenda for research and action, grounded in lived experience expertise of mental health challenges in the context of climate change, and 2) build connected communities of practice for climate change and mental health in seven global regions, equipped to enact this agenda.", lang)
          ),
          ...(peopleImage && {
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: peopleImage.assetId
              },
              alt: peopleImage.alt || 'People illustration'
            }
          }),
          links: [{
            _key: 'find-more',
            _type: 'link',
            title: translate('Find out more', lang),
            href: 'https://www.connectingclimateminds.org/about',
            buttonVariant: { variant: 'primary' }
          }]
        }]
      },

      // Hub section
      {
        _type: 'split-row',
        _key: 'hub-section',
        colorVariant: 'light',
        splitColumns: [{
          _type: 'split-content',
          _key: 'hub-content',
          title: translate('Connecting Climate Minds Hub', lang),
          body: createBlockContent(
            lang === 'en'
              ? "The Connecting Climate Minds Hub is an innovative digital platform designed to unite the fields of mental health and climate change. It serves as a collaborative space for researchers, policymakers, educators, and community groups to share knowledge, resources, and experiences. Its aim is to foster understanding, encourage interdisciplinary collaboration, and drive impactful action, all while providing a supportive community for those dedicated to these critical global issues."
              : translate("The Connecting Climate Minds Hub is an innovative digital platform designed to unite the fields of mental health and climate change. It serves as a collaborative space for researchers, policymakers, educators, and community groups to share knowledge, resources, and experiences. Its aim is to foster understanding, encourage interdisciplinary collaboration, and drive impactful action, all while providing a supportive community for those dedicated to these critical global issues.", lang)
          ),
          ...(hubImage && {
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: hubImage.assetId
              },
              alt: hubImage.alt || 'Hub illustration'
            }
          }),
          links: [{
            _key: 'create-account',
            _type: 'link',
            title: translate('Create an Account', lang),
            href: '/sign-up',
            buttonVariant: { variant: 'primary' }
          }]
        }]
      },

      // Partner logos section
      {
        _type: 'cta-1',
        _key: 'partners',
        title: translate('Who is involved', lang),
        body: createBlockContent(
          lang === 'en'
            ? "We are a Wellcome funded project that brings together expertise across research, policy, practice, design, and lived experience from across the globe."
            : translate("We are a Wellcome funded project that brings together expertise across research, policy, practice, design, and lived experience from across the globe.", lang)
        ),
        links: [{
          _key: 'view-team',
          _type: 'link',
          title: translate('View Team', lang),
          href: 'https://www.connectingclimateminds.org/team',
          buttonVariant: { variant: 'secondary' }
        }],
        sectionWidth: 'default',
        stackAlign: 'center'
      }
    ],
    meta_title: lang === 'en' ? 'About | Connecting Climate Minds' : `${translate('About', lang)} | Connecting Climate Minds`,
    meta_description: lang === 'en'
      ? "The story of how Connecting Climate Minds came to be, our mission, and the passionate team behind our quest to integrate mental health and climate change research and action."
      : translate("The story of how Connecting Climate Minds came to be, our mission, and the passionate team behind our quest to integrate mental health and climate change research and action.", lang),
    noindex: false
  };

  await client.createOrReplace(page);
  console.log(`✅ Created About page (${lang})`);
}

async function createToolkitsPage(lang, imageRegistry) {
  console.log(`\n📄 Creating Toolkits page (${lang})...`);

  const headerImage = Object.values(imageRegistry).find(img => img.filename?.includes('toolkitHeaderpng'));
  const toolkit1Image = Object.values(imageRegistry).find(img => img.filename?.includes('toolkits1Png'));
  const toolkit2Image = Object.values(imageRegistry).find(img => img.filename?.includes('toolkits2Png'));
  const toolkit3Image = Object.values(imageRegistry).find(img => img.filename?.includes('toolkits3Png'));

  const page = {
    _type: 'page',
    _id: `page-toolkits-${lang}`,
    title: translate('Toolkits', lang),
    language: lang,
    slug: {
      _type: 'slug',
      current: 'research-and-action/toolkits'
    },
    blocks: [
      // Hero section
      {
        _type: 'hero-1',
        _key: 'hero',
        title: translate('Toolkits', lang),
        body: createBlockContent(
          lang === 'en'
            ? "The toolkits are practical guides that help researchers and actors from diverse backgrounds to: 1) come into the climate and mental health field and conduct research appropriately; 2) translate evidence to policy and practice; and 3) meaningfully involve people with lived experience in climate and mental health research."
            : translate("The toolkits are practical guides that help researchers and actors from diverse backgrounds to: 1) come into the climate and mental health field and conduct research appropriately; 2) translate evidence to policy and practice; and 3) meaningfully involve people with lived experience in climate and mental health research.", lang)
        ),
        ...(headerImage && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: headerImage.assetId
            },
            alt: headerImage.alt || 'Toolkits header'
          }
        }),
        imagePosition: 'right'
      },

      // Note: Toolkit cards would ideally use a custom grid block type
      // For now using split-row with 3 columns
      {
        _type: 'split-row',
        _key: 'toolkits-grid',
        colorVariant: 'default',
        splitColumns: [
          {
            _type: 'split-content',
            _key: 'toolkit-1',
            title: lang === 'en' ? 'Climate Change and Mental Health: An Introductory Toolkit for Researchers' : translate('Climate Change and Mental Health: An Introductory Toolkit for Researchers', lang),
            body: createBlockContent(
              lang === 'en'
                ? "Progress to protect the mental health of increasing numbers of people exposed to climate hazards and to enable climate action that brings co-benefits for mental health depends on researchers from diverse backgrounds bringing their perspectives, methods, and datasets. This toolkit aims to provide researchers from various disciplines with an understanding of why the climate and mental health nexus is important and where research and action are needed for the climate and mental health field based on key emerging insights from Connecting Climate Minds."
                : translate("Progress to protect the mental health of increasing numbers of people exposed to climate hazards and to enable climate action that brings co-benefits for mental health depends on researchers from diverse backgrounds bringing their perspectives, methods, and datasets. This toolkit aims to provide researchers from various disciplines with an understanding of why the climate and mental health nexus is important and where research and action are needed for the climate and mental health field based on key emerging insights from Connecting Climate Minds.", lang)
            ),
            ...(toolkit1Image && {
              image: {
                _type: 'image',
                asset: {
                  _type: 'reference',
                  _ref: toolkit1Image.assetId
                },
                alt: toolkit1Image.alt || 'Research toolkit'
              }
            }),
            links: [{
              _key: 'view-toolkit-1',
              _type: 'link',
              title: translate('View Toolkit', lang),
              href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Research%20Toolkit_compressed.pdf?t=2024-03-19T11%3A22%3A26.397Z',
              buttonVariant: { variant: 'primary' }
            }]
          },
          {
            _type: 'split-content',
            _key: 'toolkit-2',
            title: lang === 'en' ? 'Toolkit for decision-makers taking action to support mental health in the climate crisis' : translate('Toolkit for decision-makers taking action to support mental health in the climate crisis', lang),
            body: createBlockContent(
              lang === 'en'
                ? "This toolkit aims to provide policymakers, decision-makers, NGOs, and practitioners with a concise overview of the climate-mental health nexus, its importance, key messages, and practical ways to engage."
                : translate("This toolkit aims to provide policymakers, decision-makers, NGOs, and practitioners with a concise overview of the climate-mental health nexus, its importance, key messages, and practical ways to engage.", lang)
            ),
            ...(toolkit2Image && {
              image: {
                _type: 'image',
                asset: {
                  _type: 'reference',
                  _ref: toolkit2Image.assetId
                },
                alt: toolkit2Image.alt || 'Decision-makers toolkit'
              }
            }),
            links: [{
              _key: 'view-toolkit-2',
              _type: 'link',
              title: translate('View Toolkit', lang),
              href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Humanitarian_Toolkit_v2_compressed.pdf?t=2024-06-06T16%3A28%3A13.868Z',
              buttonVariant: { variant: 'primary' }
            }]
          },
          {
            _type: 'split-content',
            _key: 'toolkit-3',
            title: lang === 'en' ? 'Deepening Research & Practice: A Lived Experience Engagement Toolkit by Connecting Climate Minds' : translate('Deepening Research & Practice: A Lived Experience Engagement Toolkit by Connecting Climate Minds', lang),
            body: createBlockContent(
              lang === 'en'
                ? "Drawing upon the collective wisdom of experts and individuals with firsthand experience and lessons from international collaborations, the toolkit offers practical guidance on navigating the complexities of lived experience engagement in the context of climate change and mental health research and practice."
                : translate("Drawing upon the collective wisdom of experts and individuals with firsthand experience and lessons from international collaborations, the toolkit offers practical guidance on navigating the complexities of lived experience engagement in the context of climate change and mental health research and practice.", lang)
            ),
            ...(toolkit3Image && {
              image: {
                _type: 'image',
                asset: {
                  _type: 'reference',
                  _ref: toolkit3Image.assetId
                },
                alt: toolkit3Image.alt || 'Lived Experience toolkit'
              }
            }),
            links: [{
              _key: 'view-toolkit-3',
              _type: 'link',
              title: translate('View Toolkit', lang),
              href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/LE%20Toolkit_compressed.pdf?t=2024-03-19T11%3A22%3A51.639Z',
              buttonVariant: { variant: 'primary' }
            }]
          }
        ]
      }
    ],
    meta_title: translate('Toolkits', lang) + ' | Connecting Climate Minds',
    meta_description: lang === 'en'
      ? "A series of toolkits that help researchers and actors from diverse backgrounds to navigate research and action in mental health and climate change."
      : translate("A series of toolkits that help researchers and actors from diverse backgrounds to navigate research and action in mental health and climate change.", lang),
    noindex: false
  };

  await client.createOrReplace(page);
  console.log(`✅ Created Toolkits page (${lang})`);
}

async function createCommunityAgendasPage(lang, imageRegistry) {
  console.log(`\n📄 Creating Community Agendas page (${lang})...`);

  const headerImage = Object.values(imageRegistry).find(img => img.filename?.includes('thematicAgendaHeaderPng'));
  const youthImage = Object.values(imageRegistry).find(img => img.filename?.includes('ypAgendaPng'));
  const indigenousImage = Object.values(imageRegistry).find(img => img.filename?.includes('indigenousAgendapng'));
  const farmerImage = Object.values(imageRegistry).find(img => img.filename?.includes('farmerAgendaPng'));

  const page = {
    _type: 'page',
    _id: `page-community-agendas-${lang}`,
    title: lang === 'en' ? 'Community Agendas' : translate('Community Agendas', lang),
    language: lang,
    slug: {
      _type: 'slug',
      current: 'research-and-action/community-agendas'
    },
    blocks: [
      // Hero section
      {
        _type: 'hero-1',
        _key: 'hero',
        title: translate('Agendas for populations facing amplified climate mental health impacts', lang),
        body: createBlockContent(
          lang === 'en'
            ? "Research and Action Agendas created through dialogues with youth, small farmers and fisher people and Indigenous communities aim to target efforts to understand and respond to the unique insights, vulnerabilities and sources of resilience these groups are experiencing in the climate crisis, and the implications for action on mental health and climate change."
            : translate("Research and Action Agendas created through dialogues with youth, small farmers and fisher people and Indigenous communities aim to target efforts to understand and respond to the unique insights, vulnerabilities and sources of resilience these groups are experiencing in the climate crisis, and the implications for action on mental health and climate change.", lang)
        ),
        ...(headerImage && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: headerImage.assetId
            },
            alt: headerImage.alt || 'Community agendas header'
          }
        }),
        imagePosition: 'right'
      },

      // Agendas grid
      {
        _type: 'split-row',
        _key: 'agendas-grid',
        colorVariant: 'default',
        splitColumns: [
          // Youth Agenda
          {
            _type: 'split-content',
            _key: 'youth-agenda',
            title: translate('Youth Research and Action Agenda', lang),
            body: createBlockContent(
              lang === 'en'
                ? "This agenda sets out priorities for research that can support youth mental health in the context of climate change, and priority actions to enact and translate that research, informed by insights shared by young people around the world."
                : translate("This agenda sets out priorities for research that can support youth mental health in the context of climate change, and priority actions to enact and translate that research, informed by insights shared by young people around the world.", lang)
            ),
            ...(youthImage && {
              image: {
                _type: 'image',
                asset: {
                  _type: 'reference',
                  _ref: youthImage.assetId
                },
                alt: youthImage.alt || 'Youth agenda'
              }
            }),
            links: [
              {
                _key: 'youth-summary',
                _type: 'link',
                title: translate('Summary Agenda', lang),
                href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents//Youth%20Research%20and%20Action%20Agenda%20Summary-compressed.pdf',
                buttonVariant: { variant: 'primary' }
              },
              {
                _key: 'youth-full',
                _type: 'link',
                title: translate('Full Agenda', lang),
                href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents//Full%20TRAA%20youth%2018-03%20(1).pdf',
                buttonVariant: { variant: 'secondary' }
              },
              {
                _key: 'youth-declaration',
                _type: 'link',
                title: translate('Youth Declaration', lang),
                href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Connecting_Climate_Minds__Youth_Declaration.pdf',
                buttonVariant: { variant: 'secondary' }
              }
            ]
          },
          // Indigenous Agenda
          {
            _type: 'split-content',
            _key: 'indigenous-agenda',
            title: translate('Indigenous Communities Research and Action Agenda', lang),
            body: createBlockContent(
              lang === 'en'
                ? "This agenda sets out priorities for research that can inform action to meet the needs of Indigenous People experiencing and responding to the mental health impacts of climate change, informed by insights shared by Indigenous People and communities around the world."
                : translate("This agenda sets out priorities for research that can inform action to meet the needs of Indigenous People experiencing and responding to the mental health impacts of climate change, informed by insights shared by Indigenous People and communities around the world.", lang)
            ),
            ...(indigenousImage && {
              image: {
                _type: 'image',
                asset: {
                  _type: 'reference',
                  _ref: indigenousImage.assetId
                },
                alt: indigenousImage.alt || 'Indigenous agenda'
              }
            }),
            links: [
              {
                _key: 'indigenous-summary',
                _type: 'link',
                title: translate('Summary Agenda', lang),
                href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents//Indigenous%20Communities%20Research%20and%20Action%20Agenda%20Summary-compressed.pdf',
                buttonVariant: { variant: 'primary' }
              },
              {
                _key: 'indigenous-full',
                _type: 'link',
                title: translate('Full Agenda', lang),
                href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents//Full%20TRAA%20Indigenous%2018-03%20(1).pdf',
                buttonVariant: { variant: 'secondary' }
              },
              {
                _key: 'indigenous-summary-es',
                _type: 'link',
                title: 'Resumen de la Agenda (Spanish)',
                href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Indigenous%20Summary-ES.pdf',
                buttonVariant: { variant: 'secondary' }
              },
              {
                _key: 'indigenous-full-es',
                _type: 'link',
                title: 'Agenda completa (Spanish)',
                href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Indigenous%20Full-ES.pdf',
                buttonVariant: { variant: 'secondary' }
              }
            ]
          },
          // Farmers Agenda
          {
            _type: 'split-content',
            _key: 'farmers-agenda',
            title: translate('Small Farmer and Fisher Peoples Research and Action Agenda', lang),
            body: createBlockContent(
              lang === 'en'
                ? "This agenda sets out priorities for research that can inform action to meet the needs of small farmers and fisher people experiencing and responding to the mental health impacts of climate change, informed by insights shared by small farmers and fisher people around the world."
                : translate("This agenda sets out priorities for research that can inform action to meet the needs of small farmers and fisher people experiencing and responding to the mental health impacts of climate change, informed by insights shared by small farmers and fisher people around the world.", lang)
            ),
            ...(farmerImage && {
              image: {
                _type: 'image',
                asset: {
                  _type: 'reference',
                  _ref: farmerImage.assetId
                },
                alt: farmerImage.alt || 'Farmers agenda'
              }
            }),
            links: [
              {
                _key: 'farmers-summary',
                _type: 'link',
                title: translate('Summary Agenda', lang),
                href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents//Small%20Farmers%20and%20Fisher%20Peoples%20Research%20and%20Action%20Agenda%20Summary-compressed.pdf',
                buttonVariant: { variant: 'primary' }
              },
              {
                _key: 'farmers-full',
                _type: 'link',
                title: translate('Full Agenda', lang),
                href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents//Full%20TRAA%20farmers%2018-03%20(1).pdf',
                buttonVariant: { variant: 'secondary' }
              }
            ]
          }
        ]
      }
    ],
    meta_title: (lang === 'en' ? 'Community Agendas' : translate('Community Agendas', lang)) + ' | Connecting Climate Minds',
    meta_description: lang === 'en'
      ? "Research and Action Agendas created by youth, small farmers and fisher people and Indigenous communities aiming to understand and respond the mental health and climate change crises."
      : translate("Research and Action Agendas created by youth, small farmers and fisher people and Indigenous communities aiming to understand and respond the mental health and climate change crises.", lang),
    noindex: false
  };

  await client.createOrReplace(page);
  console.log(`✅ Created Community Agendas page (${lang})`);
}

async function saveUncertainTranslations() {
  if (UNCERTAIN_TRANSLATIONS.length === 0) {
    console.log('\n✓ No uncertain translations!');
    return;
  }

  const outputPath = join(__dirname, '../UNCERTAIN_TRANSLATIONS_THREE_PAGES.md');
  const uniqueTranslations = [...new Map(UNCERTAIN_TRANSLATIONS.map(t =>
    [`${t.original}-${t.language}`, t]
  )).values()];

  let content = '# Uncertain Translations Report - About, Toolkits, Community Agendas\n\n';
  content += `Generated: ${new Date().toISOString()}\n\n`;
  content += `Total uncertain translations: ${uniqueTranslations.length}\n\n`;
  content += '---\n\n';

  const byLanguage = {
    es: uniqueTranslations.filter(t => t.language === 'es'),
    fr: uniqueTranslations.filter(t => t.language === 'fr'),
    ar: uniqueTranslations.filter(t => t.language === 'ar'),
  };

  for (const [lang, translations] of Object.entries(byLanguage)) {
    if (translations.length === 0) continue;

    const langName = lang === 'es' ? 'Spanish' : lang === 'fr' ? 'French' : 'Arabic';
    content += `## ${langName} (${translations.length} items)\n\n`;

    translations.forEach((t, i) => {
      content += `### ${i + 1}. ${t.context}\n\n`;
      content += `**Original (EN):** ${t.original}\n\n`;
      content += `**Current (using EN):** ${t.original}\n\n`;
      content += `**Action needed:** Provide ${langName} translation\n\n`;
      content += '---\n\n';
    });
  }

  await fs.writeFile(outputPath, content, 'utf-8');
  console.log(`\n📝 Uncertain translations saved to: UNCERTAIN_TRANSLATIONS_THREE_PAGES.md`);
}

async function main() {
  console.log('🚀 Migrating 3 Pages: About, Toolkits, Community Agendas\n');
  console.log('='.repeat(60));

  // Load image registry
  const registryPath = join(__dirname, '../image-asset-mapping.json');
  const imageRegistry = await fs.readJson(registryPath);
  console.log(`✓ Loaded image registry with ${Object.keys(imageRegistry).length} images\n`);

  const languages = ['en', 'es', 'fr', 'ar'];

  for (const lang of languages) {
    await createAboutPage(lang, imageRegistry);
    await createToolkitsPage(lang, imageRegistry);
    await createCommunityAgendasPage(lang, imageRegistry);
  }

  await saveUncertainTranslations();

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('Pages created: 12 (3 pages × 4 languages)');
  console.log('  - About: 4 language versions');
  console.log('  - Toolkits: 4 language versions');
  console.log('  - Community Agendas: 4 language versions');
  console.log(`Uncertain translations: ${UNCERTAIN_TRANSLATIONS.length}`);
  console.log('='.repeat(60));
  console.log('\n✨ Migration completed successfully!');
  console.log('\n🌐 Test URLs:');
  console.log('  /en/about, /es/about, /fr/about, /ar/about');
  console.log('  /en/research-and-action/toolkits');
  console.log('  /en/research-and-action/community-agendas');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
