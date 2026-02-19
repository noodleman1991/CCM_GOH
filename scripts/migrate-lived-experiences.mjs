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

// YouTube videos organized by category from the original page
const LIVED_EXPERIENCE_VIDEOS = {
  'Vulnerable Populations': [
    { id: '-l5Jj6yRDNk', title: 'Vulnerable Population Experience 1' },
    { id: 'wVoF1Uwzbw8', title: 'Vulnerable Population Experience 2' },
    { id: 'aygVf3fMKXs', title: 'Vulnerable Population Experience 3' },
    { id: 'p3bJ9UJt1ok', title: 'Vulnerable Population Experience 4' },
    { id: 'vJi3wDP1XLY', title: 'Vulnerable Population Experience 5' },
    { id: 'qcRxbc8IM5g', title: 'Vulnerable Population Experience 6' },
    { id: '3VTei68Svww', title: 'Vulnerable Population Experience 7' },
  ],
  'Central and Southern Asia': [
    { id: 'iSV7ysa2V0I', title: 'CSA Experience 1' },
    { id: 'oKIKcX2g2L0', title: 'CSA Experience 2' },
    { id: 'lt8Tdgf4Jvk', title: 'CSA Experience 3' },
    { id: 'kTLJTecMhjo', title: 'CSA Experience 4' },
  ],
  'Eastern and South Eastern Asia': [
    { id: 'kmvBn_b_ACo', title: 'ESEA Experience 1' },
    { id: 'vScMdtY5yog', title: 'ESEA Experience 2' },
    { id: 'svoo80yd_n0', title: 'ESEA Experience 3' },
    { id: 'FkmM8MNIjfU', title: 'ESEA Experience 4' },
  ],
  'Europe and North America': [
    { id: 'VvEbtvRiQP8', title: 'ENA Experience 1' },
    { id: 'rAaR8KURgiA', title: 'ENA Experience 2' },
    { id: 'PzYeRJftbHE', title: 'ENA Experience 3' },
    { id: 'Qe9oJGekXN4', title: 'ENA Experience 4' },
    { id: 'GZ79Efkevmo', title: 'ENA Experience 5' },
  ],
  'Latin America and the Caribbean': [
    { id: 'XfwqQv0lACs', title: 'LAC Experience 1' },
    { id: 'RUJadJpliKo', title: 'LAC Experience 2' },
    { id: '4zBE3HohcV8', title: 'LAC Experience 3' },
    { id: 'w9usmJ0k_P4', title: 'LAC Experience 4' },
  ],
  'Northern Africa and Western Asia': [
    { id: 'mQfCBPfzoVo', title: 'NAWA Experience 1' },
    { id: 'ZgzNYrZBxfc', title: 'NAWA Experience 2' },
    { id: 'P23ixTJGAXQ', title: 'NAWA Experience 3' },
    { id: 'EoWwHl17wfc', title: 'NAWA Experience 4' },
  ],
  'Oceania': [
    { id: 'ARe9EBXcT3k', title: 'Oceania Experience 1' },
    { id: 'OnAfRHv6iV4', title: 'Oceania Experience 2' },
    { id: '5eGz6sITYtA', title: 'Oceania Experience 3' },
  ],
  'Sub-Saharan Africa': [
    { id: 'mKBYOfBsfVs', title: 'SSA Experience 1' },
    { id: 'SF5AKnC0PIk', title: 'SSA Experience 2' },
    { id: 'GxzycZLicJw', title: 'SSA Experience 3' },
    { id: 'ecQAH7r0R_g', title: 'SSA Experience 4' },
  ],
};

// Mapping categories to regional communities
const CATEGORY_TO_COMMUNITY = {
  'Central and Southern Asia': 'central-and-southern-asia',
  'Eastern and South Eastern Asia': 'eastern-and-south-eastern-asia',
  'Europe and North America': 'europe-and-northern-america',
  'Latin America and the Caribbean': 'latin-america-and-the-caribbean',
  'Northern Africa and Western Asia': 'northern-africa-and-western-asia',
  'Oceania': 'oceania',
  'Sub-Saharan Africa': 'sub-saharan-africa',
};

async function createLivedExperienceDocuments() {
  console.log('\n📹 Creating Lived Experience Documents...\n');

  const createdDocs = [];
  let totalCreated = 0;

  for (const [category, videos] of Object.entries(LIVED_EXPERIENCE_VIDEOS)) {
    console.log(`\n🎬 ${category} (${videos.length} videos):`);

    for (const video of videos) {
      const docId = `lived-experience-${video.id}`;

      // Create YouTube URL
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

      // Create document
      const doc = {
        _type: 'livedExperience',
        _id: docId,
        language: 'en', // Default to English
        title: {
          en: video.title,
        },
        slug: {
          _type: 'slug',
          current: `lived-experience-${video.id}`,
        },
        description: {
          en: `A lived experience video from ${category}.`,
        },
        videoLink: videoUrl,
        publishedAt: new Date().toISOString(),
        featured: false,
        noindex: false,
        // Note: author and relatedCommunity would need to be set manually or via references
      };

      try {
        await client.createOrReplace(doc);
        console.log(`  ✅ ${video.title} (${video.id})`);
        createdDocs.push({ category, ...video });
        totalCreated++;
      } catch (error) {
        console.error(`  ❌ Error creating ${video.id}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Created ${totalCreated} lived experience documents\n`);
  return createdDocs;
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

async function createLivedExperiencesPage(lang, imageRegistry) {
  console.log(`\n📄 Creating Lived Experiences page (${lang})...`);

  const headerImage = Object.values(imageRegistry).find(img =>
    img.filename?.includes('hubLivedExperiencespng')
  );

  const translations = {
    'Lived Experiences': {
      es: 'Experiencias Vividas',
      fr: 'Expériences Vécues',
      ar: 'التجارب المعيشية'
    },
    'Vulnerable Populations Lived Experiences': {
      es: 'Experiencias Vividas de Poblaciones Vulnerables',
      fr: 'Expériences Vécues des Populations Vulnérables',
      ar: 'التجارب المعيشية للسكان المعرضين للخطر'
    },
    'Central and Southern Asia Lived Experiences': {
      es: 'Experiencias Vividas de Asia Central y del Sur',
      fr: 'Expériences Vécues d\'Asie Centrale et du Sud',
      ar: 'التجارب المعيشية من آسيا الوسطى والجنوبية'
    },
    'Eastern and South Eastern Asia Lived Experiences': {
      es: 'Experiencias Vividas de Asia Oriental y Sudoriental',
      fr: 'Expériences Vécues d\'Asie de l\'Est et du Sud-Est',
      ar: 'التجارب المعيشية من آسيا الشرقية والجنوبية الشرقية'
    },
    'Europe & North America Lived Experiences': {
      es: 'Experiencias Vividas de Europa y América del Norte',
      fr: 'Expériences Vécues d\'Europe et d\'Amérique du Nord',
      ar: 'التجارب المعيشية من أوروبا وأمريكا الشمالية'
    },
    'Latin America and the Caribbean Lived Experiences': {
      es: 'Experiencias Vividas de América Latina y el Caribe',
      fr: 'Expériences Vécues d\'Amérique Latine et des Caraïbes',
      ar: 'التجارب المعيشية من أمريكا اللاتينية والكاريبي'
    },
    'Northern Africa and Western Asia Lived Experiences': {
      es: 'Experiencias Vividas del Norte de África y Asia Occidental',
      fr: 'Expériences Vécues d\'Afrique du Nord et d\'Asie Occidentale',
      ar: 'التجارب المعيشية من شمال أفريقيا وغرب آسيا'
    },
    'Oceania Lived Experiences': {
      es: 'Experiencias Vividas de Oceanía',
      fr: 'Expériences Vécues d\'Océanie',
      ar: 'التجارب المعيشية من أوقيانوسيا'
    },
    'Sub-Saharan Africa Lived Experiences': {
      es: 'Experiencias Vividas de África Subsahariana',
      fr: 'Expériences Vécues d\'Afrique Subsaharienne',
      ar: 'التجارب المعيشية من أفريقيا جنوب الصحراء'
    },
  };

  function translate(text, targetLang) {
    if (lang === 'en') return text;
    return translations[text]?.[targetLang] || text;
  }

  const mainDescription = lang === 'en'
    ? "Lived experience is a foundational source of expertise to be engaged when addressing the mental health consequences of climate change. Listening to and learning from various individuals and communities that are directly affected by the interrelated challenges of climate change and mental health is fundamental to creating impactful research and action. Importantly, lived experiences help all efforts at this intersection to generate feasible solutions for and with the most impacted groups, leading to more inclusive research and action. The stories shown below, and the insights within them, reflect a commitment to moving beyond tokenization, and towards valuing and uplifting the contribution of lived experiences to this growing field."
    : "Lived experience is a foundational source of expertise to be engaged when addressing the mental health consequences of climate change. Listening to and learning from various individuals and communities that are directly affected by the interrelated challenges of climate change and mental health is fundamental to creating impactful research and action.";

  const page = {
    _type: 'page',
    _id: `page-lived-experiences-${lang}`,
    title: translate('Lived Experiences', lang),
    language: lang,
    slug: {
      _type: 'slug',
      current: 'lived-experiences'
    },
    blocks: [
      // Hero section
      {
        _type: 'hero-1',
        _key: 'hero',
        title: translate('Lived Experiences', lang),
        body: createBlockContent(mainDescription),
        ...(headerImage && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: headerImage.assetId
            },
            alt: headerImage.alt || 'Lived Experiences'
          }
        }),
        imagePosition: 'right'
      },

      // Note: Would ideally use lived-experiences-carousel block here
      // For now using cta sections as placeholders for each category
      {
        _type: 'cta-1',
        _key: 'vulnerable-pop',
        title: translate('Vulnerable Populations Lived Experiences', lang),
        body: createBlockContent(''),
        sectionWidth: 'full',
        stackAlign: 'center'
      },

      {
        _type: 'cta-1',
        _key: 'csa',
        title: translate('Central and Southern Asia Lived Experiences', lang),
        body: createBlockContent(''),
        sectionWidth: 'full',
        stackAlign: 'center'
      },

      {
        _type: 'cta-1',
        _key: 'esea',
        title: translate('Eastern and South Eastern Asia Lived Experiences', lang),
        body: createBlockContent(''),
        sectionWidth: 'full',
        stackAlign: 'center'
      },

      {
        _type: 'cta-1',
        _key: 'ena',
        title: translate('Europe & North America Lived Experiences', lang),
        body: createBlockContent(''),
        sectionWidth: 'full',
        stackAlign: 'center'
      },

      {
        _type: 'cta-1',
        _key: 'lac',
        title: translate('Latin America and the Caribbean Lived Experiences', lang),
        body: createBlockContent(''),
        sectionWidth: 'full',
        stackAlign: 'center'
      },

      {
        _type: 'cta-1',
        _key: 'nawa',
        title: translate('Northern Africa and Western Asia Lived Experiences', lang),
        body: createBlockContent(''),
        sectionWidth: 'full',
        stackAlign: 'center'
      },

      {
        _type: 'cta-1',
        _key: 'oceania',
        title: translate('Oceania Lived Experiences', lang),
        body: createBlockContent(''),
        sectionWidth: 'full',
        stackAlign: 'center'
      },

      {
        _type: 'cta-1',
        _key: 'ssa',
        title: translate('Sub-Saharan Africa Lived Experiences', lang),
        body: createBlockContent(''),
        sectionWidth: 'full',
        stackAlign: 'center'
      },
    ],
    meta_title: `${translate('Lived Experiences', lang)} | Connecting Climate Minds`,
    meta_description: lang === 'en'
      ? "A library of lived experiences shared by people across the globe, providing invaluable insights into impacts and solutions of climate change and mental health."
      : "A library of lived experiences shared by people across the globe, providing invaluable insights into impacts and solutions of climate change and mental health.",
    noindex: false
  };

  await client.createOrReplace(page);
  console.log(`✅ Created Lived Experiences page (${lang})`);
}

async function main() {
  console.log('🚀 Migrating Lived Experiences Page\n');
  console.log('='.repeat(60));

  // Step 1: Create all lived experience video documents
  const docs = await createLivedExperienceDocuments();

  // Step 2: Load image registry
  const registryPath = join(__dirname, '../image-asset-mapping.json');
  const imageRegistry = await fs.readJson(registryPath);
  console.log(`\n✓ Loaded image registry with ${Object.keys(imageRegistry).length} images\n`);

  // Step 3: Create pages in all languages
  const languages = ['en', 'es', 'fr', 'ar'];
  for (const lang of languages) {
    await createLivedExperiencesPage(lang, imageRegistry);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Lived Experience Documents: ${docs.length}`);
  console.log('Pages created: 4 (en, es, fr, ar)');
  console.log('='.repeat(60));
  console.log('\n✨ Migration completed successfully!');
  console.log('\n🌐 Test URLs:');
  console.log('  /en/lived-experiences');
  console.log('  /es/lived-experiences');
  console.log('  /fr/lived-experiences');
  console.log('  /ar/lived-experiences');
  console.log('\n📝 Next steps:');
  console.log('  1. Add author references to video documents in Sanity');
  console.log('  2. Add relatedCommunity references where applicable');
  console.log('  3. Update video titles with actual YouTube titles');
  console.log('  4. Consider using lived-experiences-carousel block for better UX');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
