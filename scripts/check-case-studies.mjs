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
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

async function checkCaseStudies() {
  console.log('Fetching all case studies from Sanity...\n');

  const caseStudies = await client.fetch(`
    *[_type == "caseStudy"] | order(_createdAt desc) {
      _id,
      _createdAt,
      "slug": slug.current,
      title,
      excerpt,
      status,
      "relatedCommunity": relatedCommunity->name,
      featured
    }
  `);

  console.log(`Total case studies: ${caseStudies.length}\n`);

  // Check for duplicates by slug
  const slugCounts = {};
  caseStudies.forEach(cs => {
    if (cs.slug) {
      slugCounts[cs.slug] = (slugCounts[cs.slug] || 0) + 1;
    }
  });

  const duplicates = Object.entries(slugCounts).filter(([slug, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log('🚨 DUPLICATES FOUND:');
    duplicates.forEach(([slug, count]) => {
      console.log(`  - ${slug}: ${count} copies`);
      const dupes = caseStudies.filter(cs => cs.slug === slug);
      dupes.forEach((d, i) => {
        console.log(`    ${i + 1}. ID: ${d._id}, Created: ${d._createdAt}, Status: ${d.status}`);
      });
    });
    console.log('');
  } else {
    console.log('✅ No duplicates found\n');
  }

  // Check translation status
  let missingTranslations = [];
  let partialTranslations = [];

  caseStudies.forEach(cs => {
    const hasEnTitle = cs.title?.en && cs.title.en.trim() !== '';
    const hasEsTitle = cs.title?.es && cs.title.es.trim() !== '';
    const hasFrTitle = cs.title?.fr && cs.title.fr.trim() !== '';
    const hasArTitle = cs.title?.ar && cs.title.ar.trim() !== '';

    const hasEnExcerpt = cs.excerpt?.en && cs.excerpt.en.trim() !== '';
    const hasEsExcerpt = cs.excerpt?.es && cs.excerpt.es.trim() !== '';
    const hasFrExcerpt = cs.excerpt?.fr && cs.excerpt.fr.trim() !== '';
    const hasArExcerpt = cs.excerpt?.ar && cs.excerpt.ar.trim() !== '';

    const titleLangs = [];
    if (hasEnTitle) titleLangs.push('en');
    if (hasEsTitle) titleLangs.push('es');
    if (hasFrTitle) titleLangs.push('fr');
    if (hasArTitle) titleLangs.push('ar');

    const excerptLangs = [];
    if (hasEnExcerpt) excerptLangs.push('en');
    if (hasEsExcerpt) excerptLangs.push('es');
    if (hasFrExcerpt) excerptLangs.push('fr');
    if (hasArExcerpt) excerptLangs.push('ar');

    if (titleLangs.length === 0 || excerptLangs.length === 0) {
      missingTranslations.push({
        slug: cs.slug || 'NO-SLUG',
        _id: cs._id,
        titleLangs,
        excerptLangs,
        status: cs.status
      });
    } else if (titleLangs.length < 4 || excerptLangs.length < 4) {
      partialTranslations.push({
        slug: cs.slug || 'NO-SLUG',
        _id: cs._id,
        titleLangs,
        excerptLangs,
        status: cs.status
      });
    }
  });

  if (missingTranslations.length > 0) {
    console.log('❌ MISSING TRANSLATIONS (no title or excerpt):');
    missingTranslations.forEach(cs => {
      console.log(`  - ${cs.slug} (${cs.status})`);
      console.log(`    Title langs: [${cs.titleLangs.join(', ')}]`);
      console.log(`    Excerpt langs: [${cs.excerptLangs.join(', ')}]`);
    });
    console.log('');
  }

  if (partialTranslations.length > 0) {
    console.log('⚠️  PARTIAL TRANSLATIONS (missing some languages):');
    partialTranslations.forEach(cs => {
      console.log(`  - ${cs.slug} (${cs.status})`);
      console.log(`    Title langs: [${cs.titleLangs.join(', ')}]`);
      console.log(`    Excerpt langs: [${cs.excerptLangs.join(', ')}]`);
    });
    console.log('');
  }

  const fullTranslations = caseStudies.length - missingTranslations.length - partialTranslations.length;
  console.log(`✅ Fully translated (all 4 languages): ${fullTranslations}`);
  console.log(`⚠️  Partially translated: ${partialTranslations.length}`);
  console.log(`❌ Missing translations: ${missingTranslations.length}`);

  // Status breakdown
  console.log('\n📊 Status breakdown:');
  const statusCounts = caseStudies.reduce((acc, cs) => {
    acc[cs.status || 'unknown'] = (acc[cs.status || 'unknown'] || 0) + 1;
    return acc;
  }, {});
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });

  // Regional community breakdown
  console.log('\n🌍 Regional community breakdown:');
  const communityCounts = caseStudies.reduce((acc, cs) => {
    const community = cs.relatedCommunity || 'None';
    acc[community] = (acc[community] || 0) + 1;
    return acc;
  }, {});
  Object.entries(communityCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([community, count]) => {
      console.log(`  - ${community}: ${count}`);
    });
}

checkCaseStudies().catch(console.error);
