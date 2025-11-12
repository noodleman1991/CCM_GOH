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

async function fetchGlobalAgendaPages() {
  console.log('🔍 Fetching global agenda page documents...');

  const pages = await client.fetch(`
    *[_type == "page" && slug.current == "global-agenda"]{
      _id,
      _rev,
      title,
      language,
      slug,
      blocks
    }
  `);

  console.log(`✓ Found ${pages.length} global agenda pages\n`);
  return pages;
}

async function updatePageWithCompleteContent(page) {
  const lang = page.language;
  const langNames = { en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic' };

  console.log(`📝 Updating ${langNames[lang]} page...`);
  console.log(`   Current slug: ${page.slug.current}`);

  // Load image registry
  const registryPath = join(__dirname, '../image-asset-mapping.json');
  const imageRegistry = await fs.readJson(registryPath);
  const headerImage = Object.values(imageRegistry).find(img =>
    img.filename?.includes('globalAgendaHeader')
  );

  const updatedPage = {
    ...page,
    // Fix the slug
    slug: {
      _type: 'slug',
      current: 'research-and-action/global-agenda'
    },
    // Complete blocks array with all sections
    blocks: [
      // Section 1: Hero
      {
        _type: 'hero-1',
        _key: 'hero',
        title: lang === 'en' ? 'Global Research and Action Agenda for Climate Change and Mental Health' :
               lang === 'es' ? 'Agenda Global de Investigación y Acción para el Cambio Climático y la Salud Mental' :
               lang === 'fr' ? 'Programme mondial de recherche et d\'action pour le changement climatique et la santé mentale' :
               'الأجندة العالمية للبحث والعمل بشأن تغير المناخ والصحة النفسية',
        body: [{
          _type: 'block',
          _key: 'block1',
          style: 'normal',
          children: [{
            _type: 'span',
            _key: 'span1',
            text: lang === 'en' ? 'The Global Research and Action Agenda sets a vision for the climate and mental health field to understand and respond to the mental health consequences of a changing climate and ensure climate action promotes good mental health and wellbeing.' :
                  lang === 'es' ? 'La Agenda Global de Investigación y Acción establece una visión para el campo del clima y la salud mental para comprender y responder a las consecuencias de salud mental de un clima cambiante y garantizar que la acción climática promueva una buena salud mental y bienestar.' :
                  lang === 'fr' ? 'Le Programme mondial de recherche et d\'action établit une vision pour le domaine du climat et de la santé mentale afin de comprendre et de répondre aux conséquences sur la santé mentale d\'un climat changeant et de garantir que l\'action climatique favorise une bonne santé mentale et un bien-être.' :
                  'تحدد الأجندة العالمية للبحث والعمل رؤية لمجال المناخ والصحة النفسية لفهم العواقب الصحية النفسية لتغير المناخ والاستجابة لها، وضمان تعزيز العمل المناخي لصحة نفسية جيدة ورفاهية.',
            marks: []
          }],
          markDefs: []
        }, {
          _type: 'block',
          _key: 'block2',
          style: 'normal',
          children: [{
            _type: 'span',
            _key: 'span2',
            text: lang === 'en' ? 'It sets out priorities for research and action developed with 960+ experts in research, policy, practice, and lived experience across 90 countries.' :
                  lang === 'es' ? 'Establece prioridades de investigación y acción desarrolladas con más de 960 expertos en investigación, políticas, práctica y experiencia vivida en 90 países.' :
                  lang === 'fr' ? 'Il établit des priorités de recherche et d\'action développées avec plus de 960 experts en recherche, politique, pratique et expérience vécue dans 90 pays.' :
                  'يحدد أولويات البحث والعمل التي تم تطويرها مع أكثر من 960 خبيرًا في البحث والسياسة والممارسة والخبرة المعيشية عبر 90 دولة.',
            marks: []
          }],
          markDefs: []
        }],
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

      // Section 2: PDF Downloads
      {
        _type: 'split-row',
        _key: 'pdf-section',
        colorVariant: 'light',
        splitColumns: [{
          _type: 'split-content',
          _key: 'pdf-content',
          title: lang === 'en' ? 'Downloadable PDF Version' :
                 lang === 'es' ? 'Versión PDF Descargable' :
                 lang === 'fr' ? 'Version PDF Téléchargeable' :
                 'نسخة PDF قابلة للتنزيل',
          body: [{
            _type: 'block',
            _key: 'pdf-desc',
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
          }],
          links: [
            { _key: 'link-en', _type: 'link', title: lang === 'en' ? 'View Agenda (English)' : lang === 'es' ? 'Ver Agenda (Inglés)' : lang === 'fr' ? 'Voir l\'agenda (Anglais)' : 'عرض الأجندة (الإنجليزية)', href: '#', buttonVariant: { variant: 'secondary' }},
            { _key: 'link-ar', _type: 'link', title: 'عرض الأجندة (العربية)', href: '#', buttonVariant: { variant: 'secondary' }},
            { _key: 'link-es', _type: 'link', title: 'Ver Agenda (Español)', href: '#', buttonVariant: { variant: 'secondary' }},
            { _key: 'link-pt', _type: 'link', title: 'Ver Agenda (Português)', href: '#', buttonVariant: { variant: 'secondary' }},
            { _key: 'link-fr', _type: 'link', title: 'Voir l\'agenda (Français)', href: '#', buttonVariant: { variant: 'secondary' }}
          ]
        }]
      },

      // Section 3: Accessible Reader + Summary Side by Side
      {
        _type: 'split-row',
        _key: 'reader-summary',
        colorVariant: 'default',
        splitColumns: [
          {
            _type: 'split-content',
            _key: 'reader-content',
            title: lang === 'en' ? 'Accessible Reader Version' :
                   lang === 'es' ? 'Versión de Lector Accesible' :
                   lang === 'fr' ? 'Version lecteur accessible' :
                   'نسخة القارئ الميسرة',
            body: [{
              _type: 'block',
              _key: 'reader-desc',
              style: 'normal',
              children: [{
                _type: 'span',
                _key: 'span1',
                text: lang === 'en' ? 'Click here to access an online version of the Global Research and Action Agenda.' :
                      lang === 'es' ? 'Haz clic aquí para acceder a una versión en línea de la Agenda Global de Investigación y Acción.' :
                      lang === 'fr' ? 'Cliquez ici pour accéder à une version en ligne du Programme mondial de recherche et d\'action.' :
                      'انقر هنا للوصول إلى نسخة عبر الإنترنت من الأجندة العالمية للبحث والعمل.',
                marks: []
              }],
              markDefs: []
            }],
            links: [{
              _key: 'reader-link',
              _type: 'link',
              title: lang === 'en' ? 'View Accessible Reader' :
                     lang === 'es' ? 'Ver Lector Accesible' :
                     lang === 'fr' ? 'Voir le lecteur accessible' :
                     'عرض القارئ الميسر',
              href: '#',
              buttonVariant: { variant: 'primary' }
            }]
          },
          {
            _type: 'split-content',
            _key: 'summary-content',
            title: lang === 'en' ? 'Summary Slidedeck' :
                   lang === 'es' ? 'Presentación Resumida' :
                   lang === 'fr' ? 'Présentation Résumée' :
                   'ملخص العرض التقديمي',
            body: [{
              _type: 'block',
              _key: 'summary-desc',
              style: 'normal',
              children: [{
                _type: 'span',
                _key: 'span1',
                text: lang === 'en' ? 'Access here a summary of the Global Research and Action Agenda.' :
                      lang === 'es' ? 'Accede aquí a un resumen de la Agenda Global de Investigación y Acción.' :
                      lang === 'fr' ? 'Accédez ici à un résumé du Programme mondial de recherche et d\'action.' :
                      'الوصول هنا إلى ملخص الأجندة العالمية للبحث والعمل.',
                marks: []
              }],
              markDefs: []
            }],
            links: [{
              _key: 'summary-link',
              _type: 'link',
              title: lang === 'en' ? 'View Summary Slidedeck (English)' :
                     lang === 'es' ? 'Ver Presentación Resumida (Inglés)' :
                     lang === 'fr' ? 'Voir Présentation Résumée (Anglais)' :
                     'عرض ملخص العرض التقديمي (الإنجليزية)',
              href: '#',
              buttonVariant: { variant: 'secondary' }
            }]
          }
        ]
      },

      // Section 4: Video Explainer
      {
        _type: 'cta-1',
        _key: 'video-explainer',
        title: lang === 'en' ? '1-minute Explainer' :
               lang === 'es' ? 'Explicación de 1 minuto' :
               lang === 'fr' ? 'Explicatif d\'1 minute' :
               'شرح دقيقة واحدة',
        body: [{
          _type: 'block',
          _key: 'video-desc',
          style: 'normal',
          children: [{
            _type: 'span',
            _key: 'span1',
            text: lang === 'en' ? 'Check out this video for a 1-minute explainer of the Global Agenda.' :
                  lang === 'es' ? 'Mira este video para una explicación de 1 minuto de la Agenda Global.' :
                  lang === 'fr' ? 'Consultez cette vidéo pour un explicatif d\'1 minute du Programme mondial.' :
                  'شاهد هذا الفيديو لشرح مدته دقيقة واحدة للأجندة العالمية.',
            marks: []
          }],
          markDefs: []
        }],
        links: [{
          _key: 'video-link',
          _type: 'link',
          title: lang === 'en' ? 'View 1-minute Explainer' :
                 lang === 'es' ? 'Ver Explicación de 1 minuto' :
                 lang === 'fr' ? 'Voir l\'explicatif d\'1 minute' :
                 'عرض شرح دقيقة واحدة',
          href: '#',
          buttonVariant: { variant: 'primary' }
        }],
        sectionWidth: 'default',
        stackAlign: 'center'
      }
    ]
  };

  // Update in Sanity
  try {
    await client
      .patch(page._id)
      .set({
        slug: updatedPage.slug,
        blocks: updatedPage.blocks
      })
      .commit();

    console.log(`✅ Updated ${langNames[lang]} page`);
    console.log(`   New slug: ${updatedPage.slug.current}\n`);
    return { success: true, language: lang };
  } catch (error) {
    console.error(`❌ Error updating ${langNames[lang]}:`, error.message);
    return { success: false, language: lang, error: error.message };
  }
}

async function main() {
  console.log('🚀 Fix Global Agenda Pages\n');
  console.log('='.repeat(60));

  const pages = await fetchGlobalAgendaPages();

  if (pages.length === 0) {
    console.log('❌ No global agenda pages found!');
    console.log('   Make sure pages were created with slug "global-agenda"');
    return;
  }

  const results = [];
  for (const page of pages) {
    const result = await updatePageWithCompleteContent(page);
    results.push(result);
  }

  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Pages processed: ${pages.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  console.log('='.repeat(60));
  console.log('\n✨ Pages updated!');
  console.log('\n🌐 Test URLs:');
  console.log('   /en/research-and-action/global-agenda');
  console.log('   /es/research-and-action/global-agenda');
  console.log('   /fr/research-and-action/global-agenda');
  console.log('   /ar/research-and-action/global-agenda');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
