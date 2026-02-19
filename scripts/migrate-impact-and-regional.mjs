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

// ==================== IMPACT REPORTS PAGE ====================

async function createImpactReportsPage(lang, imageRegistry) {
  console.log(`\n📄 Creating Impact Reports page (${lang})...`);

  const headerImage = Object.values(imageRegistry).find(img =>
    img.filename?.includes('impactReportHeaderpng')
  );

  const report1Image = Object.values(imageRegistry).find(img =>
    img.filename?.includes('impactReport1Png')
  );

  const report2Image = Object.values(imageRegistry).find(img =>
    img.filename?.includes('impactReport2Png')
  );

  const report3Image = Object.values(imageRegistry).find(img =>
    img.filename?.includes('impactReport3Png')
  );

  const translations = {
    'Impact Reports': {
      es: 'Informes de Impacto',
      fr: 'Rapports d\'Impact',
      ar: 'تقارير الأثر'
    },
    'Impact reports outline the demonstrable diversity and impact of activities and collaboration fostered through Connecting Climate Minds to advance research and action on climate change and mental health.': {
      es: 'Los informes de impacto describen la diversidad demostrable y el impacto de las actividades y la colaboración fomentadas a través de Connecting Climate Minds para avanzar en la investigación y la acción sobre el cambio climático y la salud mental.',
      fr: 'Les rapports d\'impact décrivent la diversité démontrable et l\'impact des activités et de la collaboration favorisées par Connecting Climate Minds pour faire progresser la recherche et l\'action sur le changement climatique et la santé mentale.',
      ar: 'تحدد تقارير الأثر التنوع الواضح والأثر للأنشطة والتعاون الذي تم تعزيزه من خلال ربط العقول المناخية لتعزيز البحث والعمل بشأن تغير المناخ والصحة النفسية.'
    },
    'Connecting Climate Minds Regional Communities of Practice Impact Report': {
      es: 'Informe de Impacto de las Comunidades Regionales de Práctica de Connecting Climate Minds',
      fr: 'Rapport d\'Impact des Communautés Régionales de Pratique de Connecting Climate Minds',
      ar: 'تقرير أثر المجتمعات الإقليمية للممارسة في ربط العقول المناخية'
    },
    'View Impact Report': {
      es: 'Ver Informe de Impacto',
      fr: 'Voir le Rapport d\'Impact',
      ar: 'عرض تقرير الأثر'
    },
    'Connecting Climate Minds Lived Experience Working Group Impact Report': {
      es: 'Informe de Impacto del Grupo de Trabajo de Experiencia Vivida de Connecting Climate Minds',
      fr: 'Rapport d\'Impact du Groupe de Travail sur l\'Expérience Vécue de Connecting Climate Minds',
      ar: 'تقرير أثر فريق العمل للتجربة المعيشية في ربط العقول المناخية'
    },
    'Connecting Climate Minds Global Event Impact Report': {
      es: 'Informe de Impacto del Evento Global de Connecting Climate Minds',
      fr: 'Rapport d\'Impact de l\'Événement Mondial de Connecting Climate Minds',
      ar: 'تقرير أثر الحدث العالمي لربط العقول المناخية'
    }
  };

  function translate(text, targetLang) {
    if (targetLang === 'en') return text;
    return translations[text]?.[targetLang] || text;
  }

  const page = {
    _type: 'page',
    _id: `page-impact-reports-${lang}`,
    title: translate('Impact Reports', lang),
    language: lang,
    slug: {
      _type: 'slug',
      current: 'research-and-action/impact-reports'
    },
    blocks: [
      // Hero section
      {
        _type: 'hero-1',
        _key: 'hero',
        title: translate('Impact Reports', lang),
        body: createBlockContent(translate('Impact reports outline the demonstrable diversity and impact of activities and collaboration fostered through Connecting Climate Minds to advance research and action on climate change and mental health.', lang)),
        ...(headerImage && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: headerImage.assetId
            },
            alt: headerImage.alt || 'Impact Reports'
          }
        }),
        imagePosition: 'right'
      },

      // Report 1: Regional Communities
      {
        _type: 'split-row',
        _key: 'report-1',
        colorVariant: 'default',
        splitColumns: [{
          _type: 'split-content',
          _key: 'report-1-content',
          title: translate('Connecting Climate Minds Regional Communities of Practice Impact Report', lang),
          ...(report1Image && {
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: report1Image.assetId
              },
              alt: 'Regional Communities Impact Report'
            }
          }),
          links: [{
            _key: 'report-1-link',
            _type: 'link',
            title: translate('View Impact Report', lang),
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Regional_Impact_Report_v4_compressed.pdf',
            buttonVariant: { variant: 'primary' }
          }]
        }]
      },

      // Report 2: Lived Experience
      {
        _type: 'split-row',
        _key: 'report-2',
        colorVariant: 'light',
        splitColumns: [{
          _type: 'split-content',
          _key: 'report-2-content',
          title: translate('Connecting Climate Minds Lived Experience Working Group Impact Report', lang),
          ...(report2Image && {
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: report2Image.assetId
              },
              alt: 'Lived Experience Impact Report'
            }
          }),
          links: [{
            _key: 'report-2-link',
            _type: 'link',
            title: translate('View Impact Report', lang),
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Thematic_Impact_Report_v5_compressed.pdf',
            buttonVariant: { variant: 'primary' }
          }]
        }]
      },

      // Report 3: Global Event
      {
        _type: 'split-row',
        _key: 'report-3',
        colorVariant: 'default',
        splitColumns: [{
          _type: 'split-content',
          _key: 'report-3-content',
          title: translate('Connecting Climate Minds Global Event Impact Report', lang),
          ...(report3Image && {
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: report3Image.assetId
              },
              alt: 'Global Event Impact Report'
            }
          }),
          links: [{
            _key: 'report-3-link',
            _type: 'link',
            title: translate('View Impact Report', lang),
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Global_Event_Impact_Report_v4_compressed.pdf',
            buttonVariant: { variant: 'primary' }
          }]
        }]
      }
    ],
    meta_title: `${translate('Impact Reports', lang)} | Connecting Climate Minds`,
    meta_description: translate('Impact reports outline the demonstrable diversity and impact of activities and collaboration fostered through Connecting Climate Minds to advance research and action on climate change and mental health.', lang),
    noindex: false
  };

  await client.createOrReplace(page);
  console.log(`✅ Created Impact Reports page (${lang})`);
}

// ==================== REGIONAL AGENDAS PAGE ====================

async function createRegionalAgendasPage(lang, imageRegistry) {
  console.log(`\n📄 Creating Regional Agendas page (${lang})...`);

  const headerImage = Object.values(imageRegistry).find(img =>
    img.filename?.includes('regionalAgendaHeaderpng')
  );

  const regionalImages = {
    ssa: Object.values(imageRegistry).find(img => img.filename?.includes('subSaharanAfricajpg')),
    nawa: Object.values(imageRegistry).find(img => img.filename?.includes('northernAfricaAndWesternAsiajpg')),
    csa: Object.values(imageRegistry).find(img => img.filename?.includes('centralAndSouthernAsiajpg')),
    esea: Object.values(imageRegistry).find(img => img.filename?.includes('easternAndSouthEasternAsiajpg')),
    lac: Object.values(imageRegistry).find(img => img.filename?.includes('latinAmericaAndTheCaribbeanjpg')),
    oceania: Object.values(imageRegistry).find(img => img.filename?.includes('oceaniajpg')),
    ena: Object.values(imageRegistry).find(img => img.filename?.includes('europeAndNorthernAmericajpg'))
  };

  const translations = {
    'Regional Agendas': {
      es: 'Agendas Regionales',
      fr: 'Programmes Régionaux',
      ar: 'جداول الأعمال الإقليمية'
    },
    'The Regional Agendas set out aligned and inclusive priorities for research and action in seven global regions (in line with the Sustainable Development Goal regional groupings), grounded in the needs of those experiencing and responding to climate-related mental health impacts.': {
      es: 'Las Agendas Regionales establecen prioridades alineadas e inclusivas para la investigación y la acción en siete regiones globales (en línea con las agrupaciones regionales de los Objetivos de Desarrollo Sostenible), basadas en las necesidades de quienes experimentan y responden a los impactos de salud mental relacionados con el clima.',
      fr: 'Les Programmes Régionaux établissent des priorités alignées et inclusives pour la recherche et l\'action dans sept régions mondiales (conformément aux groupes régionaux des Objectifs de développement durable), fondées sur les besoins de ceux qui vivent et répondent aux impacts sur la santé mentale liés au climat.',
      ar: 'تحدد جداول الأعمال الإقليمية أولويات متوافقة وشاملة للبحث والعمل في سبع مناطق عالمية (بما يتماشى مع التجمعات الإقليمية لأهداف التنمية المستدامة)، بناءً على احتياجات أولئك الذين يعانون ويستجيبون لتأثيرات الصحة النفسية المرتبطة بالمناخ.'
    },
    'Sub-Saharan Africa': {
      es: 'África Subsahariana',
      fr: 'Afrique Subsaharienne',
      ar: 'أفريقيا جنوب الصحراء'
    },
    'Northern Africa and Western Asia': {
      es: 'África del Norte y Asia Occidental',
      fr: 'Afrique du Nord et Asie Occidentale',
      ar: 'شمال أفريقيا وغرب آسيا'
    },
    'Central and Southern Asia': {
      es: 'Asia Central y del Sur',
      fr: 'Asie Centrale et du Sud',
      ar: 'آسيا الوسطى والجنوبية'
    },
    'Eastern and South-Eastern Asia': {
      es: 'Asia Oriental y Sudoriental',
      fr: 'Asie de l\'Est et du Sud-Est',
      ar: 'آسيا الشرقية والجنوبية الشرقية'
    },
    'Latin America and the Caribbean': {
      es: 'América Latina y el Caribe',
      fr: 'Amérique Latine et Caraïbes',
      ar: 'أمريكا اللاتينية والكاريبي'
    },
    'Oceania': {
      es: 'Oceanía',
      fr: 'Océanie',
      ar: 'أوقيانوسيا'
    },
    'Europe and Northern America': {
      es: 'Europa y América del Norte',
      fr: 'Europe et Amérique du Nord',
      ar: 'أوروبا وأمريكا الشمالية'
    },
    'Regional Agenda': {
      es: 'Agenda Regional',
      fr: 'Programme Régional',
      ar: 'جدول الأعمال الإقليمي'
    },
    'Summary Agenda': {
      es: 'Resumen de la Agenda',
      fr: 'Résumé du Programme',
      ar: 'ملخص جدول الأعمال'
    },
    'Full Agenda': {
      es: 'Agenda Completa',
      fr: 'Programme Complet',
      ar: 'جدول الأعمال الكامل'
    }
  };

  function translate(text, targetLang) {
    if (targetLang === 'en') return text;
    return translations[text]?.[targetLang] || text;
  }

  // Helper function to create regional agenda section
  function createRegionalSection(key, regionName, image, summaryUrl, fullUrl, additionalLanguages = []) {
    const section = {
      _type: 'split-row',
      _key: key,
      colorVariant: 'light',
      splitColumns: [{
        _type: 'split-content',
        _key: `${key}-content`,
        title: translate(regionName, lang),
        body: createBlockContent(translate('Regional Agenda', lang)),
        ...(image && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: image.assetId
            },
            alt: translate(regionName, lang)
          }
        }),
        links: [
          {
            _key: `${key}-summary`,
            _type: 'link',
            title: translate('Summary Agenda', lang),
            href: summaryUrl,
            buttonVariant: { variant: 'primary' }
          },
          {
            _key: `${key}-full`,
            _type: 'link',
            title: translate('Full Agenda', lang),
            href: fullUrl,
            buttonVariant: { variant: 'secondary' }
          },
          ...additionalLanguages
        ]
      }]
    };
    return section;
  }

  const page = {
    _type: 'page',
    _id: `page-regional-agendas-${lang}`,
    title: translate('Regional Agendas', lang),
    language: lang,
    slug: {
      _type: 'slug',
      current: 'research-and-action/regional-agendas'
    },
    blocks: [
      // Hero section
      {
        _type: 'hero-1',
        _key: 'hero',
        title: translate('Regional Agendas', lang),
        body: createBlockContent(translate('The Regional Agendas set out aligned and inclusive priorities for research and action in seven global regions (in line with the Sustainable Development Goal regional groupings), grounded in the needs of those experiencing and responding to climate-related mental health impacts.', lang)),
        ...(headerImage && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: headerImage.assetId
            },
            alt: translate('Regional Agendas', lang)
          }
        }),
        imagePosition: 'right'
      },

      // Sub-Saharan Africa (with French)
      createRegionalSection(
        'ssa',
        'Sub-Saharan Africa',
        regionalImages.ssa,
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/SSA%20(summary)_compressed.pdf',
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Full%20RRAA%20Sub-Saharan%20Africa%2017-03.pdf',
        [
          {
            _key: 'ssa-fr-summary',
            _type: 'link',
            title: 'Résumé de l\'agenda (Français)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Sub-saharan%20Summary-FR.pdf',
            buttonVariant: { variant: 'secondary' }
          },
          {
            _key: 'ssa-fr-full',
            _type: 'link',
            title: 'Agenda complet (Français)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Sub-saharan%20full-FR.pdf',
            buttonVariant: { variant: 'secondary' }
          }
        ]
      ),

      // Northern Africa and Western Asia (with Arabic)
      createRegionalSection(
        'nawa',
        'Northern Africa and Western Asia',
        regionalImages.nawa,
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/MENA%20(summary)_compressed.pdf',
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Full%20RRAA%20Northern%20Africa%20and%20Western%20Asia%2018-03.pdf',
        [
          {
            _key: 'nawa-ar-summary',
            _type: 'link',
            title: 'ملخص جدول الأعمال (العربية)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Northern%20Africa%20Summary-AR.pdf',
            buttonVariant: { variant: 'secondary' }
          },
          {
            _key: 'nawa-ar-full',
            _type: 'link',
            title: 'جدول الأعمال الكامل (العربية)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Northern%20Africa%20Full-AR.pdf',
            buttonVariant: { variant: 'secondary' }
          }
        ]
      ),

      // Central and Southern Asia
      createRegionalSection(
        'csa',
        'Central and Southern Asia',
        regionalImages.csa,
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CSA%20(summary)_compressed.pdf',
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Full%20RRAA%20Central%20and%20Southern%20Asia%2018-03.pdf'
      ),

      // Eastern and South-Eastern Asia
      createRegionalSection(
        'esea',
        'Eastern and South-Eastern Asia',
        regionalImages.esea,
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/ESEA%20(summary)_compressed.pdf',
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Full%20RRAA%20Eastern%20and%20South-Eastern%20Asia%2017-03.pdf'
      ),

      // Latin America and the Caribbean (with French, Spanish, Portuguese)
      createRegionalSection(
        'lac',
        'Latin America and the Caribbean',
        regionalImages.lac,
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/LAC%20(summary)_compressed.pdf',
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Full%20RRAA%20Latin%20America%20and%20the%20Caribbean%2017-03.pdf',
        [
          {
            _key: 'lac-es-summary',
            _type: 'link',
            title: 'Resumen de la Agenda (Español)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Latin%20America%20Summary-ES.pdf',
            buttonVariant: { variant: 'secondary' }
          },
          {
            _key: 'lac-es-full',
            _type: 'link',
            title: 'Agenda Completa (Español)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Latin%20America%20Full-ES.pdf',
            buttonVariant: { variant: 'secondary' }
          },
          {
            _key: 'lac-fr-summary',
            _type: 'link',
            title: 'Résumé de l\'agenda (Français)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Latin%20America%20Summary-FR.pdf',
            buttonVariant: { variant: 'secondary' }
          },
          {
            _key: 'lac-fr-full',
            _type: 'link',
            title: 'Agenda complet (Français)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Latin%20America%20Full-FR.pdf',
            buttonVariant: { variant: 'secondary' }
          },
          {
            _key: 'lac-pt-summary',
            _type: 'link',
            title: 'Resumo da Agenda (Português)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Latin%20America%20Summary-PT.pdf',
            buttonVariant: { variant: 'secondary' }
          },
          {
            _key: 'lac-pt-full',
            _type: 'link',
            title: 'Agenda Completa (Português)',
            href: 'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/CCM%20Latin%20America%20Full-PT.pdf',
            buttonVariant: { variant: 'secondary' }
          }
        ]
      ),

      // Oceania
      createRegionalSection(
        'oceania',
        'Oceania',
        regionalImages.oceania,
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Oceania%20(summary)_compressed.pdf',
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Full%20RRAA%20Oceania%2017-03.pdf'
      ),

      // Europe and Northern America
      createRegionalSection(
        'ena',
        'Europe and Northern America',
        regionalImages.ena,
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/ENA%20(summary)_compressed.pdf',
        'https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Full%20RRAA%20Europe%20and%20Northern%20America%2018-03.pdf'
      )
    ],
    meta_title: `${translate('Regional Agendas', lang)} | Connecting Climate Minds`,
    meta_description: translate('The Regional Agendas set out aligned and inclusive priorities for research and action in seven global regions (in line with the Sustainable Development Goal regional groupings), grounded in the needs of those experiencing and responding to climate-related mental health impacts.', lang),
    noindex: false
  };

  await client.createOrReplace(page);
  console.log(`✅ Created Regional Agendas page (${lang})`);
}

// ==================== MAIN FUNCTION ====================

async function main() {
  console.log('🚀 Migrating Impact Reports and Regional Agendas Pages\n');
  console.log('='.repeat(60));

  // Load image registry
  const registryPath = join(__dirname, '../image-asset-mapping.json');
  const imageRegistry = await fs.readJson(registryPath);
  console.log(`\n✓ Loaded image registry with ${Object.keys(imageRegistry).length} images\n`);

  const languages = ['en', 'es', 'fr', 'ar'];

  console.log('\n📊 CREATING IMPACT REPORTS PAGES');
  console.log('='.repeat(60));
  for (const lang of languages) {
    await createImpactReportsPage(lang, imageRegistry);
  }

  console.log('\n📊 CREATING REGIONAL AGENDAS PAGES');
  console.log('='.repeat(60));
  for (const lang of languages) {
    await createRegionalAgendasPage(lang, imageRegistry);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('Impact Reports pages created: 4 (en, es, fr, ar)');
  console.log('Regional Agendas pages created: 4 (en, es, fr, ar)');
  console.log('Total pages: 8');
  console.log('='.repeat(60));
  console.log('\n✨ Migration completed successfully!');
  console.log('\n🌐 Test URLs:');
  console.log('  Impact Reports:');
  console.log('    /en/research-and-action/impact-reports');
  console.log('    /es/research-and-action/impact-reports');
  console.log('    /fr/research-and-action/impact-reports');
  console.log('    /ar/research-and-action/impact-reports');
  console.log('  Regional Agendas:');
  console.log('    /en/research-and-action/regional-agendas');
  console.log('    /es/research-and-action/regional-agendas');
  console.log('    /fr/research-and-action/regional-agendas');
  console.log('    /ar/research-and-action/regional-agendas');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
