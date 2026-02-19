import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

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

// Read translations from file
const translationsFile = join(__dirname, 'case-study-translations.json');
const translations = JSON.parse(await fs.readFile(translationsFile, 'utf-8'));

console.log(`🚀 Uploading ${translations.length} translated case studies to Sanity\n`);

let updated = 0;
let errors = 0;

for (const caseStudy of translations) {
  try {
    console.log(`Updating: ${caseStudy.slug}`);

    await client.patch(caseStudy._id)
      .set({
        title: {
          en: caseStudy.title.en,
          es: caseStudy.title.es,
          fr: caseStudy.title.fr,
          ar: caseStudy.title.ar
        },
        excerpt: {
          en: caseStudy.excerpt.en,
          es: caseStudy.excerpt.es,
          fr: caseStudy.excerpt.fr,
          ar: caseStudy.excerpt.ar
        }
      })
      .commit();

    console.log(`  ✅ Updated successfully`);
    updated++;

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error(`  ❌ Error updating ${caseStudy._id}:`, error.message);
    errors++;
  }
}

console.log('\n' + '='.repeat(50));
console.log('📊 Upload Summary:');
console.log('='.repeat(50));
console.log(`✅ Successfully updated: ${updated}`);
console.log(`❌ Errors: ${errors}`);
console.log('='.repeat(50));
