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

async function createCaseStudiesIndexPage(lang, imageRegistry) {
  console.log(`\n📄 Creating Case Studies Index page (${lang})...`);

  const headerImage = Object.values(imageRegistry).find(img =>
    img.filename?.includes('caseStudiesHeader') || img.filename?.includes('case-stud')
  );

  const translations = {
    'Case Studies': {
      es: 'Estudios de Caso',
      fr: 'Études de Cas',
      ar: 'دراسات الحالة'
    },
    'Explore real-world examples of climate change and mental health interventions, research, and initiatives from around the globe. These case studies showcase innovative approaches, community-led solutions, and evidence-based practices that address the mental health impacts of climate change.': {
      es: 'Explore ejemplos del mundo real de intervenciones, investigaciones e iniciativas sobre cambio climático y salud mental de todo el mundo. Estos estudios de caso muestran enfoques innovadores, soluciones lideradas por la comunidad y prácticas basadas en evidencia que abordan los impactos del cambio climático en la salud mental.',
      fr: 'Explorez des exemples concrets d\'interventions, de recherches et d\'initiatives en matière de changement climatique et de santé mentale du monde entier. Ces études de cas présentent des approches innovantes, des solutions menées par les communautés et des pratiques fondées sur des données probantes qui traitent des impacts du changement climatique sur la santé mentale.',
      ar: 'استكشف أمثلة من العالم الحقيقي للتدخلات والأبحاث والمبادرات المتعلقة بتغير المناخ والصحة النفسية من جميع أنحاء العالم. تعرض دراسات الحالة هذه أساليب مبتكرة وحلولًا بقيادة المجتمع وممارسات قائمة على الأدلة تعالج تأثيرات تغير المناخ على الصحة النفسية.'
    },
    'Browse Case Studies': {
      es: 'Explorar Estudios de Caso',
      fr: 'Parcourir les Études de Cas',
      ar: 'تصفح دراسات الحالة'
    },
    'Submit Your Case Study': {
      es: 'Enviar tu Estudio de Caso',
      fr: 'Soumettre Votre Étude de Cas',
      ar: 'قدم دراسة حالتك'
    },
    'Share your work': {
      es: 'Comparte tu trabajo',
      fr: 'Partagez votre travail',
      ar: 'شارك عملك'
    },
    'Have you led or participated in a climate and mental health initiative? Share your experience with the global community by submitting your case study.': {
      es: '¿Has liderado o participado en una iniciativa de clima y salud mental? Comparte tu experiencia con la comunidad global enviando tu estudio de caso.',
      fr: 'Avez-vous dirigé ou participé à une initiative sur le climat et la santé mentale? Partagez votre expérience avec la communauté mondiale en soumettant votre étude de cas.',
      ar: 'هل قدت أو شاركت في مبادرة للمناخ والصحة النفسية؟ شارك تجربتك مع المجتمع العالمي من خلال تقديم دراسة حالتك.'
    },
    'Submit Case Study': {
      es: 'Enviar Estudio de Caso',
      fr: 'Soumettre une Étude de Cas',
      ar: 'قدم دراسة حالة'
    }
  };

  function translate(text, targetLang) {
    if (targetLang === 'en') return text;
    return translations[text]?.[targetLang] || text;
  }

  const page = {
    _type: 'page',
    _id: `page-case-studies-index-${lang}`,
    title: translate('Case Studies', lang),
    language: lang,
    slug: {
      _type: 'slug',
      current: 'research-and-action/case-studies'
    },
    blocks: [
      // Hero section
      {
        _type: 'hero-1',
        _key: 'hero',
        title: translate('Case Studies', lang),
        body: createBlockContent(translate('Explore real-world examples of climate change and mental health interventions, research, and initiatives from around the globe. These case studies showcase innovative approaches, community-led solutions, and evidence-based practices that address the mental health impacts of climate change.', lang)),
        ...(headerImage && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: headerImage.assetId
            },
            alt: translate('Case Studies', lang)
          }
        }),
        imagePosition: 'right'
      },

      // Case Studies List Section
      {
        _type: 'cta-1',
        _key: 'browse-studies',
        title: translate('Browse Case Studies', lang),
        body: createBlockContent(''),
        sectionWidth: 'full',
        stackAlign: 'center'
      },

      // Submit CTA
      {
        _type: 'split-row',
        _key: 'submit-cta',
        colorVariant: 'light',
        splitColumns: [{
          _type: 'split-content',
          _key: 'submit-content',
          title: translate('Share your work', lang),
          body: createBlockContent(translate('Have you led or participated in a climate and mental health initiative? Share your experience with the global community by submitting your case study.', lang)),
          links: [{
            _key: 'submit-link',
            _type: 'link',
            title: translate('Submit Case Study', lang),
            href: `/${lang}/case-studies/submit`,
            buttonVariant: { variant: 'primary' }
          }]
        }]
      }
    ],
    meta_title: `${translate('Case Studies', lang)} | Connecting Climate Minds`,
    meta_description: translate('Explore real-world examples of climate change and mental health interventions, research, and initiatives from around the globe. These case studies showcase innovative approaches, community-led solutions, and evidence-based practices that address the mental health impacts of climate change.', lang),
    noindex: false
  };

  try {
    await client.createOrReplace(page);
    console.log(`✅ Created Case Studies Index page (${lang})`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating page (${lang}):`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Creating Case Studies Index Pages\n');
  console.log('='.repeat(60));

  // Load image registry
  const registryPath = join(__dirname, '../image-asset-mapping.json');
  let imageRegistry = {};
  try {
    imageRegistry = await fs.readJson(registryPath);
    console.log(`✓ Loaded image registry with ${Object.keys(imageRegistry).length} images\n`);
  } catch (error) {
    console.log('⚠️  No image registry found, proceeding without images\n');
  }

  const languages = ['en', 'es', 'fr', 'ar'];
  const results = [];

  for (const lang of languages) {
    const success = await createCaseStudiesIndexPage(lang, imageRegistry);
    results.push({ lang, success });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Pages created: ${results.filter(r => r.success).length}/4`);
  console.log('='.repeat(60));
  console.log('\n✨ Case Studies Index pages created successfully!');
  console.log('\n🌐 Test URLs:');
  console.log('  /en/research-and-action/case-studies');
  console.log('  /es/research-and-action/case-studies');
  console.log('  /fr/research-and-action/case-studies');
  console.log('  /ar/research-and-action/case-studies');
  console.log('\n📝 Note: Case studies will be dynamically loaded on these pages.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
