import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_READ_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

const LANGUAGES = ['en', 'es', 'fr', 'ar'];

async function main() {
  console.log('🔍 Regional Community Pages Audit\n');
  console.log('='.repeat(70));

  // 1. Fetch all regionalCommunity base documents
  const communities = await sanityClient.fetch(`
    *[_type == "regionalCommunity"] | order(name.en asc) {
      _id,
      name,
      "slug": slug.current,
      active,
      featured
    }
  `);

  console.log(`\nFound ${communities.length} regional communities\n`);

  // 2. Fetch all regionalCommunityPage documents
  const pages = await sanityClient.fetch(`
    *[_type == "regionalCommunityPage"] {
      _id,
      title,
      language,
      useTemplate,
      "slug": slug.current,
      "communityRef": regionalCommunity._ref,
      "communityName": regionalCommunity->name.en,
      welcomeHero,
      whyJoinCTA,
      agendasGrid,
      caseStudiesGrid,
      newsGrid,
      livedExperiencesCarousel,
      teamGrid,
      logoCloud
    }
  `);

  console.log(`Found ${pages.length} regional community pages\n`);
  console.log('='.repeat(70));

  // 3. Audit each community
  const issues = [];

  for (const community of communities) {
    console.log(`\n📍 ${community.name?.en || community._id}`);
    console.log(`   ID: ${community._id}`);
    console.log(`   Slug: ${community.slug || 'MISSING'}`);
    console.log(`   Active: ${community.active ?? 'not set'}`);

    // Check name translations
    const missingNames = [];
    for (const lang of LANGUAGES) {
      if (!community.name?.[lang]) {
        missingNames.push(lang);
      }
    }
    if (missingNames.length > 0) {
      console.log(`   ⚠️  Missing name translations: ${missingNames.join(', ')}`);
      issues.push({
        type: 'missing_name_translation',
        community: community.name?.en || community._id,
        communityId: community._id,
        languages: missingNames,
      });
    } else {
      console.log(`   ✅ All name translations present`);
    }

    // Check page language versions
    const communityPages = pages.filter(p => p.communityRef === community._id);
    const existingLangs = communityPages.map(p => p.language).filter(Boolean);
    const missingLangs = LANGUAGES.filter(l => !existingLangs.includes(l));

    if (missingLangs.length > 0) {
      console.log(`   ⚠️  Missing page versions: ${missingLangs.join(', ')}`);
      issues.push({
        type: 'missing_page_version',
        community: community.name?.en || community._id,
        communityId: community._id,
        languages: missingLangs,
        existingLanguages: existingLangs,
      });
    } else {
      console.log(`   ✅ All 4 language pages exist (${existingLangs.join(', ')})`);
    }

    // Check each page for backgrounds and content
    for (const page of communityPages) {
      console.log(`\n   📄 Page [${page.language || 'unknown'}]: ${page.title}`);
      console.log(`      Template: ${page.useTemplate ? 'Yes' : 'No'}`);

      // Check background values on hero sections
      const sectionsWithBg = [];
      const bgFields = [
        { name: 'welcomeHero', label: 'Welcome Hero' },
        { name: 'whyJoinCTA', label: 'Why Join CTA' },
      ];

      for (const field of bgFields) {
        const section = page[field.name];
        if (section?.background?.type && section.background.type !== 'none') {
          sectionsWithBg.push({
            section: field.label,
            bgType: section.background.type,
            bgValue: section.background.ccmColor || section.background.color || section.background.gradient?.startColor || 'custom',
          });
        }
      }

      if (sectionsWithBg.length > 0) {
        for (const bg of sectionsWithBg) {
          console.log(`      ⚠️  Background on ${bg.section}: ${bg.bgType} (${bg.bgValue})`);
          issues.push({
            type: 'non_none_background',
            community: community.name?.en || community._id,
            pageId: page._id,
            language: page.language,
            section: bg.section,
            backgroundType: bg.bgType,
          });
        }
      }

      // Check template section content
      if (page.useTemplate) {
        const templateSections = [
          { name: 'welcomeHero', label: 'Welcome Hero', checkField: 'title' },
          { name: 'whyJoinCTA', label: 'Why Join CTA', checkField: 'title' },
          { name: 'agendasGrid', label: 'Agendas Grid', checkField: 'mode' },
          { name: 'caseStudiesGrid', label: 'Case Studies Grid', checkField: 'mode' },
          { name: 'newsGrid', label: 'News Grid', checkField: 'mode' },
          { name: 'livedExperiencesCarousel', label: 'Lived Experiences', checkField: 'mode' },
          { name: 'teamGrid', label: 'Team Grid', checkField: 'mode' },
        ];

        const emptySections = [];
        const populatedSections = [];

        for (const section of templateSections) {
          const data = page[section.name];
          if (!data || !data[section.checkField]) {
            emptySections.push(section.label);
          } else {
            populatedSections.push(section.label);
          }
        }

        if (emptySections.length > 0) {
          console.log(`      ℹ️  Empty sections: ${emptySections.join(', ')}`);
        }
        if (populatedSections.length > 0) {
          console.log(`      ✅ Populated: ${populatedSections.join(', ')}`);
        }
      }
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total communities: ${communities.length}`);
  console.log(`Total pages: ${pages.length}`);
  console.log(`Total issues: ${issues.length}`);

  const missingNameIssues = issues.filter(i => i.type === 'missing_name_translation');
  const missingPageIssues = issues.filter(i => i.type === 'missing_page_version');
  const bgIssues = issues.filter(i => i.type === 'non_none_background');

  if (missingNameIssues.length > 0) {
    console.log(`\n⚠️  Missing name translations: ${missingNameIssues.length}`);
    for (const issue of missingNameIssues) {
      console.log(`   - ${issue.community}: missing ${issue.languages.join(', ')}`);
    }
  }

  if (missingPageIssues.length > 0) {
    console.log(`\n⚠️  Missing page versions: ${missingPageIssues.length}`);
    for (const issue of missingPageIssues) {
      console.log(`   - ${issue.community}: missing ${issue.languages.join(', ')} (has: ${issue.existingLanguages.join(', ')})`);
    }
  }

  if (bgIssues.length > 0) {
    console.log(`\n⚠️  Non-none backgrounds: ${bgIssues.length}`);
    for (const issue of bgIssues) {
      console.log(`   - ${issue.community} [${issue.language}] ${issue.section}: ${issue.backgroundType}`);
    }
  }

  if (issues.length === 0) {
    console.log('\n✅ No issues found! All communities look good.');
  }

  console.log('\n' + '='.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
