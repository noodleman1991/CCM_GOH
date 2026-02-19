import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

async function main() {
  console.log('🔍 Querying existing Sanity documents...\n');

  // Query existing agendas
  const agendas = await client.fetch(`*[_type == "agenda"] | order(_createdAt desc) {
    _id,
    "title": title.en,
    agendaType,
    year,
    slug
  }`);

  console.log(`📚 Found ${agendas.length} agendas:`);
  agendas.slice(0, 10).forEach(a => {
    console.log(`  - ${a.title} (${a.year}) [${a.agendaType}]`);
  });

  // Query existing regional communities
  const communities = await client.fetch(`*[_type == "regionalCommunity"] | order(orderRank) {
    _id,
    "name": name.en,
    slug,
    active
  }`);

  console.log(`\n🌍 Found ${communities.length} regional communities:`);
  communities.forEach(c => {
    console.log(`  - ${c.name} ${c.active ? '✓' : '✗'}`);
  });

  // Query existing news posts
  const newsPosts = await client.fetch(`*[_type == "newsPost"] | order(publishedAt desc) [0...5] {
    _id,
    "title": title.en,
    publishedAt
  }`);

  console.log(`\n📰 Found ${newsPosts.length} recent news posts:`);
  newsPosts.forEach(n => {
    console.log(`  - ${n.title}`);
  });

  // Query existing testimonials
  const testimonials = await client.fetch(`*[_type == "testimonial"] {
    _id,
    name,
    title
  }`);

  console.log(`\n💬 Found ${testimonials.length} testimonials:`);
  testimonials.slice(0, 5).forEach(t => {
    console.log(`  - ${t.name} ${t.title ? `(${t.title})` : ''}`);
  });

  // Check if homepage already exists
  const existingHomepage = await client.fetch(`*[_type == "homepage" && language == "en"][0] {
    _id,
    title,
    language
  }`);

  if (existingHomepage) {
    console.log(`\n⚠️  Homepage already exists: ${existingHomepage._id}`);
    console.log('   To update, we will patch the existing document.');
  } else {
    console.log('\n✨ No existing homepage found. Will create a new one.');
  }

  return {
    agendas,
    communities,
    newsPosts,
    testimonials,
    existingHomepage
  };
}

main()
  .then((data) => {
    console.log('\n✅ Query complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
