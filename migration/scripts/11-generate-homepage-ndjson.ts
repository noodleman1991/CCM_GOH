#!/usr/bin/env tsx
/**
 * Script 11: Generate Homepage NDJSON
 *
 * Creates homepage document from parsed content
 * - Uses successfully extracted sections (heroWelcome, collaboration, howToUse)
 * - Includes placeholder sections for manual entry
 * - English version only (translations to be added in Sanity Studio)
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const PARSED_CONTENT = path.join(OUTPUT_DIR, 'advanced-parsed-content.json');

interface Homepage {
  _type: 'homepage';
  _id: string;
  language: string;
  title: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  heroWelcome?: any;
  globalAgenda?: any;
  howToUse?: any;
  agendasModule?: any;
  livedExperiences?: any;
  regionalCommunities?: any;
  collaboration?: any;
  news?: any;
  projectInfo?: any;
  mentalHealthDefinition?: any;
  partnerLogos?: any;
}

function cleanSection(section: any) {
  // Remove confidence metadata
  const { _confidence, ...cleanedSection } = section;

  // Convert nested multilingual fields to simple values
  if (cleanedSection.title?.en) {
    cleanedSection.title = cleanedSection.title.en;
  }
  if (cleanedSection.subtitle?.en) {
    cleanedSection.tagLine = cleanedSection.subtitle.en;
    delete cleanedSection.subtitle;
  }

  // Convert description array to body (block-content)
  if (cleanedSection.description && Array.isArray(cleanedSection.description)) {
    cleanedSection.body = cleanedSection.description.length > 0 ? cleanedSection.description : undefined;
    delete cleanedSection.description;
  }

  // Convert buttons array to links
  if (cleanedSection.buttons && Array.isArray(cleanedSection.buttons)) {
    cleanedSection.links = cleanedSection.buttons.map((btn: any, index: number) => ({
      _type: 'link',
      _key: `link-${index}`,
      text: btn.text,
      href: btn.url,
      variant: index === 0 ? 'primary' : 'secondary',
    }));
    delete cleanedSection.buttons;
  }

  // Remove SVG placeholder images
  if (cleanedSection.image && cleanedSection.image.startsWith('data:image/svg+xml')) {
    delete cleanedSection.image;
  }

  return cleanedSection;
}

async function generateHomepageNDJSON() {
  console.log('🏠 Generating Homepage NDJSON\n');
  console.log('='.repeat(70) + '\n');

  // Read parsed content
  const parsedData = await fs.readJson(PARSED_CONTENT);
  const homepageData = parsedData.homepage;
  const sections = homepageData.sections;

  console.log(`Processing ${Object.keys(sections).length} homepage sections\n`);

  // Build homepage document
  const homepage: Homepage = {
    _type: 'homepage',
    _id: 'homepage-en',
    language: 'en',
    title: 'Home',
    slug: {
      _type: 'slug',
      current: 'home',
    },
  };

  // Process each section
  const sectionNames = [
    'heroWelcome',
    'globalAgenda',
    'howToUse',
    'agendasModule',
    'livedExperiences',
    'regionalCommunities',
    'collaboration',
    'news',
    'projectInfo',
    'mentalHealthDefinition',
    'partnerLogos',
  ];

  const extractedSections: string[] = [];
  const placeholderSections: string[] = [];

  for (const sectionName of sectionNames) {
    const section = sections[sectionName];
    if (!section) continue;

    const confidence = section._confidence?.dataQuality;

    if (confidence === 'high' || confidence === 'medium') {
      // Successfully extracted section
      homepage[sectionName as keyof Homepage] = cleanSection(section);
      extractedSections.push(sectionName);
    } else {
      // Placeholder section - include minimal structure
      const cleanedSection = cleanSection(section);

      // Add placeholder note in title for sections that need manual entry
      if (cleanedSection.title) {
        cleanedSection.title = `[PLACEHOLDER] ${cleanedSection.title}`;
      }

      homepage[sectionName as keyof Homepage] = cleanedSection;
      placeholderSections.push(sectionName);
    }
  }

  console.log('✅ Extracted Sections:\n');
  extractedSections.forEach(name => {
    console.log(`   ✓ ${name}`);
  });

  console.log('\n⚠️  Placeholder Sections (need manual entry):\n');
  placeholderSections.forEach(name => {
    console.log(`   ○ ${name}`);
  });

  // Convert to NDJSON format (single line)
  const ndjson = JSON.stringify(homepage);

  // Save to file
  const outputPath = path.join(OUTPUT_DIR, 'homepage.ndjson');
  await fs.writeFile(outputPath, ndjson);

  // Also save as JSON for easier review
  const jsonPath = path.join(OUTPUT_DIR, 'homepage.json');
  await fs.writeJson(jsonPath, homepage, { spaces: 2 });

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Homepage NDJSON Generated!');
  console.log(`\n📄 Outputs:`);
  console.log(`   - ${outputPath} (for import)`);
  console.log(`   - ${jsonPath} (for review)`);
  console.log(`\n📊 Summary:`);
  console.log(`   Extracted: ${extractedSections.length}/11 sections`);
  console.log(`   Placeholders: ${placeholderSections.length}/11 sections`);
  console.log('\n💡 Next Steps:');
  console.log('   1. Review homepage.json and verify extracted sections');
  console.log('   2. After import, manually complete placeholder sections in Sanity Studio');
  console.log('   3. Add translations for ES, FR, AR languages\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateHomepageNDJSON().catch(console.error);
}

export { generateHomepageNDJSON };
