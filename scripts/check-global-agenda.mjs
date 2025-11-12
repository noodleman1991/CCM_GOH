import { client } from '../sanity/lib/client.ts';

async function main() {
  console.log('🔍 Checking for global-agenda pages...\n');

  const pages = await client.fetch('*[_type == "page" && slug.current match "*global-agenda*"]{_id, slug, language, meta_title}');

  console.log(`Found ${pages.length} pages with "global-agenda" in slug:\n`);
  pages.forEach(page => {
    console.log(`- ${page.slug.current} (${page.language})`);
    console.log(`  ID: ${page._id}`);
    console.log(`  Title: ${page.meta_title || 'N/A'}\n`);
  });

  console.log('\n🔍 Checking for pages with slug exactly "global-agenda"...\n');
  const exactPages = await client.fetch('*[_type == "page" && slug.current == "global-agenda"]{_id, slug, language, meta_title}');

  console.log(`Found ${exactPages.length} pages:\n`);
  exactPages.forEach(page => {
    console.log(`- ${page.slug.current} (${page.language})`);
    console.log(`  ID: ${page._id}`);
    console.log(`  Title: ${page.meta_title || 'N/A'}\n`);
  });
}

main().catch(console.error);
