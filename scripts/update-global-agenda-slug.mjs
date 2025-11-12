import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN
});

async function main() {
  console.log('🔄 Updating global-agenda page slugs...\n');

  // Find all pages with the old slug
  const pages = await client.fetch(
    '*[_type == "page" && slug.current == "research-and-action/global-agenda"]{_id, slug, language}'
  );

  console.log(`Found ${pages.length} pages to update:\n`);

  for (const page of pages) {
    console.log(`📝 Updating ${page._id} (${page.language})...`);
    console.log(`   Old slug: ${page.slug.current}`);
    console.log(`   New slug: global-agenda`);

    try {
      await client
        .patch(page._id)
        .set({
          slug: {
            _type: 'slug',
            current: 'global-agenda'
          }
        })
        .commit();

      console.log(`   ✅ Updated successfully\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n✨ Done! All pages updated.');
  console.log('\nPages should now be accessible at:');
  console.log('  /en/global-agenda');
  console.log('  /es/global-agenda');
  console.log('  /fr/global-agenda');
  console.log('  /ar/global-agenda');
}

main().catch(console.error);
