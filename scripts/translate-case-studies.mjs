import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

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

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Translate text using DeepL
async function translateText(text, targetLang) {
  if (!text || text.trim() === '') return '';

  if (!DEEPL_API_KEY) {
    console.log(`⚠️  No DeepL API key - using English for ${targetLang}`);
    return text;
  }

  try {
    const url = 'https://api-free.deepl.com/v2/translate';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        target_lang: targetLang.toUpperCase(),
        source_lang: 'EN',
        preserve_formatting: '1'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepL API error (${response.status}):`, errorText);
      return text;
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error.message);
    return text;
  }
}

async function translateCaseStudies() {
  console.log('🚀 Starting Case Study Translation\n');

  if (!DEEPL_API_KEY) {
    console.log('❌ ERROR: DEEPL_API_KEY not found in .env.local');
    console.log('Please add your DeepL API key to continue.\n');
    console.log('Get a free API key at: https://www.deepl.com/pro-api\n');
    process.exit(1);
  }

  // Fetch all approved case studies
  const caseStudies = await client.fetch(`
    *[_type == "caseStudy" && status == "approved"] | order(publishedAt desc) {
      _id,
      "slug": slug.current,
      title,
      excerpt
    }
  `);

  console.log(`Found ${caseStudies.length} approved case studies\n`);

  let translatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const cs of caseStudies) {
    console.log(`\n📄 Processing: ${cs.slug || cs._id}`);

    // Check if already translated
    const hasAllTranslations =
      cs.title?.en && cs.title?.es && cs.title?.fr && cs.title?.ar &&
      cs.excerpt?.en && cs.excerpt?.es && cs.excerpt?.fr && cs.excerpt?.ar;

    if (hasAllTranslations) {
      console.log('  ✓ Already fully translated, skipping...');
      skippedCount++;
      continue;
    }

    const updates = {};
    let needsUpdate = false;

    // Translate title
    if (cs.title?.en) {
      const newTitle = { en: cs.title.en };

      if (!cs.title.es || cs.title.es.trim() === '') {
        console.log('  Translating title to Spanish...');
        newTitle.es = await translateText(cs.title.en, 'es');
        await delay(1000);
        needsUpdate = true;
      } else {
        newTitle.es = cs.title.es;
      }

      if (!cs.title.fr || cs.title.fr.trim() === '') {
        console.log('  Translating title to French...');
        newTitle.fr = await translateText(cs.title.en, 'fr');
        await delay(1000);
        needsUpdate = true;
      } else {
        newTitle.fr = cs.title.fr;
      }

      if (!cs.title.ar || cs.title.ar.trim() === '') {
        console.log('  Translating title to Arabic...');
        newTitle.ar = await translateText(cs.title.en, 'ar');
        await delay(1000);
        needsUpdate = true;
      } else {
        newTitle.ar = cs.title.ar;
      }

      if (needsUpdate) {
        updates.title = newTitle;
      }
    }

    // Translate excerpt
    if (cs.excerpt?.en) {
      const newExcerpt = { en: cs.excerpt.en };

      if (!cs.excerpt.es || cs.excerpt.es.trim() === '') {
        console.log('  Translating excerpt to Spanish...');
        newExcerpt.es = await translateText(cs.excerpt.en, 'es');
        await delay(1000);
        needsUpdate = true;
      } else {
        newExcerpt.es = cs.excerpt.es;
      }

      if (!cs.excerpt.fr || cs.excerpt.fr.trim() === '') {
        console.log('  Translating excerpt to French...');
        newExcerpt.fr = await translateText(cs.excerpt.en, 'fr');
        await delay(1000);
        needsUpdate = true;
      } else {
        newExcerpt.fr = cs.excerpt.fr;
      }

      if (!cs.excerpt.ar || cs.excerpt.ar.trim() === '') {
        console.log('  Translating excerpt to Arabic...');
        newExcerpt.ar = await translateText(cs.excerpt.en, 'ar');
        await delay(1000);
        needsUpdate = true;
      } else {
        newExcerpt.ar = cs.excerpt.ar;
      }

      if (needsUpdate && newExcerpt !== cs.excerpt) {
        updates.excerpt = newExcerpt;
      }
    }

    // Update Sanity
    if (Object.keys(updates).length > 0) {
      try {
        await client.patch(cs._id).set(updates).commit();
        console.log('  ✅ Updated successfully');
        translatedCount++;
        await delay(500);
      } catch (error) {
        console.error(`  ❌ Error updating:`, error.message);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Translation Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Translated: ${translatedCount}`);
  console.log(`⏭️  Skipped (already translated): ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total processed: ${caseStudies.length}`);
  console.log('='.repeat(50) + '\n');

  console.log('✅ Translation complete!');
}

translateCaseStudies().catch(console.error);
