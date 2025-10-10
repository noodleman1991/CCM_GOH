#!/usr/bin/env tsx
/**
 * Script 8: Generate Organizations NDJSON
 *
 * Converts extracted organization names to Sanity documents
 * - Minimal data (name, slug, type only)
 * - Type classified based on name keywords
 * - Ready for manual enrichment in Sanity Studio
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const PARSED_CONTENT = path.join(OUTPUT_DIR, 'complete-parsed-content.json');

interface Organization {
  _type: 'organization';
  _id: string;
  name: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  type: 'university' | 'research' | 'international' | 'ngo' | 'government' | 'company' | 'community' | 'foundation' | 'other';
  verified: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/-+/g, '-')       // Replace multiple - with single -
    .trim();
}

function classifyOrganizationType(name: string): Organization['type'] {
  const lower = name.toLowerCase();

  // University/Academic
  if (/university|college|institute|school/i.test(name)) {
    return 'university';
  }

  // International organizations
  if (/world health organization|who|un|international/i.test(name)) {
    return 'international';
  }

  // Research institutions
  if (/research|institute|centre|center/i.test(name)) {
    return 'research';
  }

  // NGOs
  if (/foundation|trust|society/i.test(name)) {
    return 'ngo';
  }

  return 'other';
}

async function generateOrganizationsNDJSON() {
  console.log('📦 Generating Organizations NDJSON\n');
  console.log('='.repeat(70) + '\n');

  // Read parsed content
  const parsedData = await fs.readJson(PARSED_CONTENT);
  const organizationNames: string[] = parsedData.organizations || [];

  console.log(`Found ${organizationNames.length} organizations\n`);

  // Generate organization documents
  const organizations: Organization[] = organizationNames.map((name, index) => {
    const slug = slugify(name);
    const type = classifyOrganizationType(name);

    return {
      _type: 'organization',
      _id: `org-${slug}`,
      name,
      slug: {
        _type: 'slug',
        current: slug,
      },
      type,
      verified: false, // Auto-extracted, needs manual verification
    };
  });

  // Log classification breakdown
  const byType: Record<string, number> = {};
  organizations.forEach(org => {
    byType[org.type] = (byType[org.type] || 0) + 1;
  });

  console.log('📊 Classification Breakdown:\n');
  Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(15)}: ${count} organizations`);
    });

  console.log('\n📋 Organizations:\n');
  organizations.forEach(org => {
    console.log(`  [${org.type.toUpperCase().padEnd(13)}] ${org.name}`);
  });

  // Convert to NDJSON format
  const ndjson = organizations
    .map(org => JSON.stringify(org))
    .join('\n');

  // Save to file
  const outputPath = path.join(OUTPUT_DIR, 'organizations.ndjson');
  await fs.writeFile(outputPath, ndjson);

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Organizations NDJSON Generated!');
  console.log(`\n📄 Output: ${outputPath}`);
  console.log(`📊 Total: ${organizations.length} organizations`);
  console.log('\n💡 Next Steps:');
  console.log('   1. Review classifications in Sanity Studio');
  console.log('   2. Add descriptions, logos, contact info');
  console.log('   3. Link to regional communities\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateOrganizationsNDJSON().catch(console.error);
}

export { generateOrganizationsNDJSON };
