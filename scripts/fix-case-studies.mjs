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
    console.log('⚠️  No DeepL API key found, skipping translation');
    return text; // Return original if no API key
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
        source_lang: 'EN'
      })
    });

    if (!response.ok) {
      console.error(`DeepL API error: ${response.status}`);
      return text;
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error.message);
    return text;
  }
}

async function step1_RemoveDuplicates() {
  console.log('\n=== STEP 1: Remove Duplicate Case Studies ===\n');

  const caseStudies = await client.fetch(`
    *[_type == "caseStudy"] | order(_createdAt desc) {
      _id,
      _createdAt,
      "slug": slug.current,
      status
    }
  `);

  const slugGroups = {};
  caseStudies.forEach(cs => {
    if (cs.slug) {
      if (!slugGroups[cs.slug]) slugGroups[cs.slug] = [];
      slugGroups[cs.slug].push(cs);
    }
  });

  const duplicates = Object.entries(slugGroups).filter(([slug, items]) => items.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found\n');
    return;
  }

  console.log(`Found ${duplicates.length} sets of duplicates\n`);

  for (const [slug, items] of duplicates) {
    console.log(`\nProcessing: ${slug}`);
    console.log(`  Found ${items.length} copies`);

    // Keep approved version, delete pending versions
    const approved = items.filter(i => i.status === 'approved');
    const pending = items.filter(i => i.status === 'pending');

    if (approved.length > 0 && pending.length > 0) {
      console.log(`  Keeping: ${approved[0]._id} (approved)`);
      console.log(`  Deleting ${pending.length} pending copies...`);

      for (const p of pending) {
        await client.delete(p._id);
        console.log(`    ✓ Deleted ${p._id}`);
        await delay(100);
      }
    } else if (items.length > 1) {
      // Keep newest, delete older ones
      const toKeep = items[0];
      const toDelete = items.slice(1);

      console.log(`  Keeping: ${toKeep._id} (newest)`);
      console.log(`  Deleting ${toDelete.length} older copies...`);

      for (const d of toDelete) {
        await client.delete(d._id);
        console.log(`    ✓ Deleted ${d._id}`);
        await delay(100);
      }
    }
  }

  console.log('\n✅ Duplicate removal complete\n');
}

async function step2_TranslateMissing() {
  console.log('\n=== STEP 2: Translate Missing Titles and Excerpts ===\n');

  const caseStudies = await client.fetch(`
    *[_type == "caseStudy" && status == "approved"] {
      _id,
      "slug": slug.current,
      title,
      excerpt
    }
  `);

  console.log(`Processing ${caseStudies.length} approved case studies\n`);

  let translatedCount = 0;

  for (const cs of caseStudies) {
    const updates = {};
    let needsUpdate = false;

    // Check title translations
    if (cs.title?.en && cs.title.en.trim() !== '') {
      const newTitle = { ...cs.title };

      if (!newTitle.es || newTitle.es.trim() === '') {
        console.log(`Translating title to ES: ${cs.slug}`);
        newTitle.es = await translateText(cs.title.en, 'es');
        await delay(1000); // Rate limit
        needsUpdate = true;
      }

      if (!newTitle.fr || newTitle.fr.trim() === '') {
        console.log(`Translating title to FR: ${cs.slug}`);
        newTitle.fr = await translateText(cs.title.en, 'fr');
        await delay(1000);
        needsUpdate = true;
      }

      if (!newTitle.ar || newTitle.ar.trim() === '') {
        console.log(`Translating title to AR: ${cs.slug}`);
        newTitle.ar = await translateText(cs.title.en, 'ar');
        await delay(1000);
        needsUpdate = true;
      }

      if (needsUpdate) {
        updates.title = newTitle;
      }
    }

    // Check excerpt translations
    if (cs.excerpt?.en && cs.excerpt.en.trim() !== '') {
      const newExcerpt = { ...cs.excerpt };

      if (!newExcerpt.es || newExcerpt.es.trim() === '') {
        console.log(`Translating excerpt to ES: ${cs.slug}`);
        newExcerpt.es = await translateText(cs.excerpt.en, 'es');
        await delay(1000);
        needsUpdate = true;
      }

      if (!newExcerpt.fr || newExcerpt.fr.trim() === '') {
        console.log(`Translating excerpt to FR: ${cs.slug}`);
        newExcerpt.fr = await translateText(cs.excerpt.en, 'fr');
        await delay(1000);
        needsUpdate = true;
      }

      if (!newExcerpt.ar || newExcerpt.ar.trim() === '') {
        console.log(`Translating excerpt to AR: ${cs.slug}`);
        newExcerpt.ar = await translateText(cs.excerpt.en, 'ar');
        await delay(1000);
        needsUpdate = true;
      }

      if (needsUpdate && newExcerpt !== cs.excerpt) {
        updates.excerpt = newExcerpt;
      }
    }

    // Update Sanity if needed
    if (Object.keys(updates).length > 0) {
      try {
        await client.patch(cs._id).set(updates).commit();
        console.log(`✓ Updated ${cs.slug}\n`);
        translatedCount++;
        await delay(500);
      } catch (error) {
        console.error(`Error updating ${cs.slug}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Translation complete. Updated ${translatedCount} case studies\n`);
}

async function step3_FixRelatedCommunities() {
  console.log('\n=== STEP 3: Fix Related Communities ===\n');

  const caseStudies = await client.fetch(`
    *[_type == "caseStudy"] {
      _id,
      "slug": slug.current,
      "relatedCommunity": relatedCommunity->_id,
      "relatedCommunityName": relatedCommunity->name
    }
  `);

  const broken = caseStudies.filter(cs => !cs.relatedCommunity && cs.relatedCommunityName);

  console.log(`Found ${broken.length} case studies with broken community references\n`);

  if (broken.length > 0) {
    console.log('These need manual fixing in Sanity Studio\n');
  } else {
    console.log('✅ All community references are valid\n');
  }
}

async function main() {
  console.log('🚀 Starting Case Studies Fix Script\n');

  try {
    await step1_RemoveDuplicates();
    await step2_TranslateMissing();
    await step3_FixRelatedCommunities();

    console.log('\n✅ All fixes complete!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
