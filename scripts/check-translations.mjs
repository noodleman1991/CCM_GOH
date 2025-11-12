import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-10-31',
  useCdn: false
});

const result = await client.fetch(`*[_type == "caseStudy" && status == "approved"][0] {
  _id,
  "slug": slug.current,
  title,
  excerpt
}`);

console.log('Sample Case Study Translations:');
console.log('=====================================');
console.log('Slug:', result.slug);
console.log('\nTitle:');
console.log('  EN:', result.title?.en || 'MISSING');
console.log('  ES:', result.title?.es || 'MISSING');
console.log('  FR:', result.title?.fr || 'MISSING');
console.log('  AR:', result.title?.ar || 'MISSING');
console.log('\nExcerpt:');
console.log('  EN:', result.excerpt?.en?.substring(0, 50) + '...' || 'MISSING');
console.log('  ES:', result.excerpt?.es?.substring(0, 50) + '...' || 'MISSING');
console.log('  FR:', result.excerpt?.fr?.substring(0, 50) + '...' || 'MISSING');
console.log('  AR:', result.excerpt?.ar?.substring(0, 50) + '...' || 'MISSING');
