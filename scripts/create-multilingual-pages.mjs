import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
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

// Simple translations for homepage sections
const TRANSLATIONS = {
  es: {
    'Home': 'Inicio',
    'Welcome to the Connecting Climate Minds Hub, where the worlds of mental health and climate change research unite.':
      'Bienvenido al Hub de Connecting Climate Minds, donde los mundos de la investigación en salud mental y cambio climático se unen.',
    'View our Research': 'Ver nuestra investigación',
    'Prioritizing Global Research and Action for Climate Change and Mental Health':
      'Priorizando la Investigación y Acción Global para el Cambio Climático y la Salud Mental',
    'Create an Account': 'Crear una cuenta',
    // Add more as needed - this is a starter set
  },
  fr: {
    'Home': 'Accueil',
    'Welcome to the Connecting Climate Minds Hub, where the worlds of mental health and climate change research unite.':
      'Bienvenue au Hub Connecting Climate Minds, où les mondes de la recherche en santé mentale et changement climatique s\'unissent.',
    'View our Research': 'Voir notre recherche',
    'Create an Account': 'Créer un compte',
  },
  ar: {
    'Home': 'الصفحة الرئيسية',
    'View our Research': 'عرض بحثنا',
    'Create an Account': 'إنشاء حساب',
  }
};

const UNCERTAIN_TRANSLATIONS = [];

function translate(text, targetLang) {
  if (!text) return text;

  // Check if we have a direct translation
  if (TRANSLATIONS[targetLang] && TRANSLATIONS[targetLang][text]) {
    return TRANSLATIONS[targetLang][text];
  }

  // Mark as uncertain and return English for now
  UNCERTAIN_TRANSLATIONS.push({
    original: text,
    language: targetLang,
    context: 'Homepage content',
    suggested: text // Keep English as placeholder
  });

  return text; // Return English as fallback
}

async function fetchEnglishHomepage() {
  console.log('📖 Fetching English homepage...');
  const homepage = await client.fetch(`
    *[_type == "homepage" && language == "en"][0] {
      ...,
      "englishContent": @
    }
  `);

  if (!homepage) {
    throw new Error('English homepage not found!');
  }

  console.log('✓ Found English homepage\n');
  return homepage;
}

async function createTranslatedHomepage(englishHomepage, targetLang) {
  const langNames = { es: 'Spanish', fr: 'French', ar: 'Arabic' };
  console.log(`\n🌐 Creating ${langNames[targetLang]} homepage...`);

  const translatedHomepage = {
    _type: 'homepage',
    _id: `homepage-${targetLang}`,
    title: translate(englishHomepage.title, targetLang),
    language: targetLang,
    slug: {
      _type: 'slug',
      current: 'index'
    },

    // Copy structure but translate text
    heroWelcome: {
      ...englishHomepage.heroWelcome,
      title: translate(englishHomepage.heroWelcome?.title, targetLang),
      links: englishHomepage.heroWelcome?.links?.map(link => ({
        ...link,
        title: translate(link.title, targetLang)
      }))
    },

    // For now, copy other sections - full translation would go here
    globalAgenda: englishHomepage.globalAgenda,
    howToUse: englishHomepage.howToUse,
    agendasModule: englishHomepage.agendasModule,
    livedExperiences: englishHomepage.livedExperiences,
    regionalCommunities: englishHomepage.regionalCommunities,
    collaboration: englishHomepage.collaboration,
    news: englishHomepage.news,
    projectInfo: englishHomepage.projectInfo,
    mentalHealthDefinition: englishHomepage.mentalHealthDefinition,
    partnerLogos: englishHomepage.partnerLogos,

    meta_title: translate(englishHomepage.meta_title, targetLang),
    meta_description: translate(englishHomepage.meta_description, targetLang),
    noindex: false,
  };

  // Create or replace in Sanity
  const result = await client.createOrReplace(translatedHomepage);
  console.log(`✅ Created homepage-${targetLang}`);

  return result;
}

async function createGlobalAgendaPage(lang) {
  const langNames = { en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic' };
  console.log(`\n📄 Creating ${langNames[lang]} Global Agenda page...`);

  // Load image registry for image references
  const registryPath = join(__dirname, '../image-asset-mapping.json');
  const imageRegistry = await fs.readJson(registryPath);

  // Find header image
  const headerImage = Object.values(imageRegistry).find(img =>
    img.filename?.includes('globalAgendaHeader')
  );

  const page = {
    _type: 'page',
    _id: `page-global-agenda-${lang}`,
    title: lang === 'en' ? 'Global Agenda' :
           lang === 'es' ? 'Agenda Global' :
           lang === 'fr' ? 'Programme Mondial' :
           'الأجندة العالمية',
    language: lang,
    slug: {
      _type: 'slug',
      current: 'global-agenda'
    },
    blocks: [
      // Hero section
      {
        _type: 'hero-1',
        _key: 'hero',
        title: lang === 'en' ? 'Global Research and Action Agenda for Climate Change and Mental Health' :
               lang === 'es' ? 'Agenda Global de Investigación y Acción para el Cambio Climático y la Salud Mental' :
               lang === 'fr' ? 'Programme mondial de recherche et d\'action pour le changement climatique et la santé mentale' :
               'الأجندة العالمية للبحث والعمل بشأن تغير المناخ والصحة النفسية',
        body: null,
        ...(headerImage && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: headerImage.assetId
            },
            alt: headerImage.alt
          }
        }),
        imagePosition: 'right'
      },
      // PDF Downloads section
      {
        _type: 'split-row',
        _key: 'pdf-downloads',
        colorVariant: 'light',
        splitColumns: [
          {
            _type: 'split-content',
            _key: 'pdf-content',
            title: lang === 'en' ? 'Downloadable PDF Version' :
                   lang === 'es' ? 'Versión PDF Descargable' :
                   lang === 'fr' ? 'Version PDF Téléchargeable' :
                   'نسخة PDF قابلة للتنزيل',
            body: [
              {
                _type: 'block',
                _key: 'block1',
                style: 'normal',
                children: [{
                  _type: 'span',
                  _key: 'span1',
                  text: lang === 'en' ? 'Access the pdf version of the Global Research and Action Agenda here.' :
                        lang === 'es' ? 'Accede a la versión en PDF de la Agenda Global de Investigación y Acción aquí.' :
                        lang === 'fr' ? 'Accédez ici à la version PDF du Programme mondial de recherche et d\'action.' :
                        'الوصول إلى نسخة PDF من الأجندة العالمية للبحث والعمل هنا.',
                  marks: []
                }],
                markDefs: []
              }
            ]
          }
        ]
      }
    ],
    meta_title: lang === 'en' ? 'Global Agenda | Connecting Climate Minds' :
                lang === 'es' ? 'Agenda Global | Connecting Climate Minds' :
                lang === 'fr' ? 'Programme Mondial | Connecting Climate Minds' :
                'الأجندة العالمية | Connecting Climate Minds',
    meta_description: lang === 'en' ? 'The Global Research and Action Agenda sets a vision for the climate and mental health field.' :
                      lang === 'es' ? 'La Agenda Global de Investigación y Acción establece una visión para el campo del clima y la salud mental.' :
                      lang === 'fr' ? 'Le Programme mondial de recherche et d\'action établit une vision pour le domaine du climat et de la santé mentale.' :
                      'تحدد الأجندة العالمية للبحث والعمل رؤية لمجال المناخ والصحة النفسية.',
    noindex: false
  };

  const result = await client.createOrReplace(page);
  console.log(`✅ Created global-agenda page (${lang})`);

  return result;
}

async function saveUncertainTranslations() {
  if (UNCERTAIN_TRANSLATIONS.length === 0) {
    console.log('\n✓ No uncertain translations!');
    return;
  }

  const outputPath = join(__dirname, '../UNCERTAIN_TRANSLATIONS.md');
  let content = '# Uncertain Translations Report\n\n';
  content += `Generated: ${new Date().toISOString()}\n\n`;
  content += `Total uncertain translations: ${UNCERTAIN_TRANSLATIONS.length}\n\n`;
  content += '---\n\n';

  const byLanguage = {
    es: UNCERTAIN_TRANSLATIONS.filter(t => t.language === 'es'),
    fr: UNCERTAIN_TRANSLATIONS.filter(t => t.language === 'fr'),
    ar: UNCERTAIN_TRANSLATIONS.filter(t => t.language === 'ar'),
  };

  for (const [lang, translations] of Object.entries(byLanguage)) {
    const langName = lang === 'es' ? 'Spanish' : lang === 'fr' ? 'French' : 'Arabic';
    content += `## ${langName} (${translations.length} items)\n\n`;

    translations.forEach((t, i) => {
      content += `### ${i + 1}. ${t.context}\n\n`;
      content += `**Original (EN):** ${t.original}\n\n`;
      content += `**Current (using EN):** ${t.suggested}\n\n`;
      content += `**Action needed:** Provide ${langName} translation\n\n`;
      content += '---\n\n';
    });
  }

  await fs.writeFile(outputPath, content, 'utf-8');
  console.log(`\n📝 Uncertain translations saved to: UNCERTAIN_TRANSLATIONS.md`);
}

async function main() {
  console.log('🚀 Multilingual Pages Creation\n');
  console.log('='.repeat(60));

  // Fetch English homepage as template
  const englishHomepage = await fetchEnglishHomepage();

  // Create translated homepages
  for (const lang of ['es', 'fr', 'ar']) {
    await createTranslatedHomepage(englishHomepage, lang);
  }

  // Create global agenda pages
  for (const lang of ['en', 'es', 'fr', 'ar']) {
    await createGlobalAgendaPage(lang);
  }

  // Save uncertain translations report
  await saveUncertainTranslations();

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('Homepages created: 3 (es, fr, ar)');
  console.log('Global Agenda pages created: 4 (en, es, fr, ar)');
  console.log(`Uncertain translations: ${UNCERTAIN_TRANSLATIONS.length}`);
  console.log('='.repeat(60));
  console.log('\n✨ Multilingual pages created successfully!');
  console.log('\n⚠️  NOTE: Most content is currently in English.');
  console.log('   Review UNCERTAIN_TRANSLATIONS.md for items needing translation.');
  console.log('\n✓ You can now view these pages in Sanity Studio at /studio');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
