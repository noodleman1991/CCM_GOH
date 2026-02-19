import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

// Load translations
const translations = JSON.parse(readFileSync('/tmp/agenda-translations.json', 'utf8'));

function translateText(text, lang) {
  if (!text) return text;

  // Check if exact match exists in titles
  if (translations.titles[text] && translations.titles[text][lang]) {
    return translations.titles[text][lang];
  }

  // Check for description patterns
  for (const [pattern, trans] of Object.entries(translations.descriptions)) {
    if (text.includes(pattern)) {
      let translated = text;
      // Replace the pattern
      translated = translated.replace(pattern, trans[lang]);

      // Handle regional names that appear after patterns
      const regionMappings = {
        'Central and Southern Asia': {
          es: 'Asia Central y Meridional',
          fr: 'l\'Asie Centrale et Méridionale',
          ar: 'آسيا الوسطى والجنوبية'
        },
        'Eastern and South-Eastern Asia': {
          es: 'Asia Oriental y Sudoriental',
          fr: 'l\'Asie de l\'Est et du Sud-Est',
          ar: 'شرق وجنوب شرق آسيا'
        },
        'Europe and Northern America': {
          es: 'Europa y América del Norte',
          fr: 'l\'Europe et l\'Amérique du Nord',
          ar: 'أوروبا وأمريكا الشمالية'
        },
        'Latin America and the Caribbean': {
          es: 'América Latina y el Caribe',
          fr: 'l\'Amérique Latine et les Caraïbes',
          ar: 'أمريكا اللاتينية والكاريبي'
        },
        'Northern Africa and Western Asia': {
          es: 'el Norte de África y Asia Occidental',
          fr: 'l\'Afrique du Nord et l\'Asie Occidentale',
          ar: 'شمال أفريقيا وغرب آسيا'
        },
        'Oceania': {
          es: 'Oceanía',
          fr: 'l\'Océanie',
          ar: 'أوقيانوسيا'
        },
        'Sub-Saharan Africa': {
          es: 'África Subsahariana',
          fr: 'l\'Afrique Subsaharienne',
          ar: 'أفريقيا جنوب الصحراء الكبرى'
        }
      };

      for (const [region, regionTrans] of Object.entries(regionMappings)) {
        if (translated.includes(region)) {
          translated = translated.replace(region, regionTrans[lang]);
        }
      }

      // Handle agenda name references in "An executive summary of the..."
      for (const [title, titleTrans] of Object.entries(translations.titles)) {
        if (translated.includes(title)) {
          translated = translated.replace(title, titleTrans[lang]);
        }
      }

      return translated;
    }
  }

  return text; // Return original if no translation found
}

function translateSubtitle(subtitle, lang) {
  if (!subtitle) return subtitle;

  // Check common subtitles
  if (translations.common[lang][subtitle]) {
    return translations.common[lang][subtitle];
  }

  // Check if it contains patterns like "Regional priorities for X"
  for (const [pattern, trans] of Object.entries(translations.common[lang])) {
    if (subtitle.includes(pattern)) {
      let translated = subtitle.replace(pattern, trans);

      // Handle regional names
      const regionMappings = {
        'Central and Southern Asia': {
          es: 'Asia Central y Meridional',
          fr: 'l\'Asie Centrale et Méridionale',
          ar: 'آسيا الوسطى والجنوبية'
        },
        'Eastern and South-Eastern Asia': {
          es: 'Asia Oriental y Sudoriental',
          fr: 'l\'Asie de l\'Est et du Sud-Est',
          ar: 'شرق وجنوب شرق آسيا'
        },
        'Europe and Northern America': {
          es: 'Europa y América del Norte',
          fr: 'l\'Europe et l\'Amérique du Nord',
          ar: 'أوروبا وأمريكا الشمالية'
        },
        'Latin America and the Caribbean': {
          es: 'América Latina y el Caribe',
          fr: 'l\'Amérique Latine et les Caraïbes',
          ar: 'أمريكا اللاتينية والكاريبي'
        },
        'Northern Africa and Western Asia': {
          es: 'el Norte de África y Asia Occidental',
          fr: 'l\'Afrique du Nord et l\'Asie Occidentale',
          ar: 'شمال أفريقيا وغرب آسيا'
        },
        'Oceania': {
          es: 'Oceanía',
          fr: 'l\'Océanie',
          ar: 'أوقيانوسيا'
        },
        'Sub-Saharan Africa': {
          es: 'África Subsahariana',
          fr: 'l\'Afrique Subsaharienne',
          ar: 'أفريقيا جنوب الصحراء الكبرى'
        }
      };

      for (const [region, regionTrans] of Object.entries(regionMappings)) {
        if (translated.includes(region)) {
          translated = translated.replace(region, regionTrans[lang]);
        }
      }

      return translated;
    }
  }

  return subtitle;
}

async function translateAgenda(agenda) {
  console.log(`\n📄 Processing: ${agenda.enTitle}`);
  console.log(`   ID: ${agenda._id}`);

  const updates = {
    title: {},
    subtitle: {},
    description: {}
  };

  // Keep English
  updates.title.en = agenda.enTitle;
  updates.subtitle.en = agenda.enSubtitle || '';
  updates.description.en = agenda.enDescription || '';

  // Translate to each language
  for (const lang of ['es', 'fr', 'ar']) {
    // Title
    updates.title[lang] = translateText(agenda.enTitle, lang);
    console.log(`    ✓ Translated title to ${lang}: ${updates.title[lang]}`);

    // Subtitle
    if (agenda.enSubtitle) {
      updates.subtitle[lang] = translateSubtitle(agenda.enSubtitle, lang);
      console.log(`    ✓ Translated subtitle to ${lang}`);
    }

    // Description
    if (agenda.enDescription) {
      updates.description[lang] = translateText(agenda.enDescription, lang);
      console.log(`    ✓ Translated description to ${lang}`);
    }
  }

  return updates;
}

async function updateInSanity(docId, updates) {
  try {
    await sanityClient
      .patch(docId)
      .set({
        title: updates.title,
        subtitle: updates.subtitle,
        description: updates.description
      })
      .commit();

    console.log(`    ✅ Updated in Sanity`);
    return true;
  } catch (error) {
    console.error(`    ❌ Error updating in Sanity:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🌍 Agenda & Report Translation Script\n');
  console.log('='.repeat(70));
  console.log('Fetching agendas and reports from Sanity...\n');

  // Fetch all agendas and reports
  const documents = await sanityClient.fetch(`
    *[_type == "agenda" || _type == "report"] | order(title.en asc) {
      _id,
      _type,
      "enTitle": title.en,
      "enSubtitle": subtitle.en,
      "enDescription": description.en
    }
  `);

  console.log(`Found ${documents.length} documents\n`);
  console.log('='.repeat(70));

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    console.log(`\n[${i + 1}/${documents.length}] Processing...`);

    // Skip if no English title
    if (!doc.enTitle) {
      console.log(`    ⚠️  Skipped - no English title`);
      skippedCount++;
      continue;
    }

    try {
      // Translate
      const updates = await translateAgenda(doc);

      // Update in Sanity
      const success = await updateInSanity(doc._id, updates);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

    } catch (error) {
      console.error(`\n❌ Error processing ${doc.enTitle}:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 TRANSLATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total documents: ${documents.length}`);
  console.log(`✅ Successfully translated: ${successCount}`);
  console.log(`⚠️  Skipped: ${skippedCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(70));

  console.log('\n✨ Translation complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
