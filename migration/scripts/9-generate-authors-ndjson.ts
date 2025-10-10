#!/usr/bin/env tsx
/**
 * Script 9: Generate Authors NDJSON
 *
 * Converts extracted team members to Sanity author documents
 * - Deduplicates members by name (e.g., Rouba Katrina appears in 2 regions)
 * - Creates community membership references
 * - Keeps names as-is per user instruction
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const PARSED_CONTENT = path.join(OUTPUT_DIR, 'complete-parsed-content.json');

interface TeamMember {
  name: string;
  title: string;
  region: string;
}

interface CommunityMembership {
  _key: string;
  community: {
    _type: 'reference';
    _ref: string;
  };
  role?: string;
}

interface Author {
  _type: 'author';
  _id: string;
  name: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  organizationalAffiliation?: string;
  communityMemberships: CommunityMembership[];
}

// Map region slugs to community IDs
const REGION_TO_COMMUNITY: Record<string, string> = {
  'central-and-southern-asia': 'regional-community-central-and-southern-asia',
  'eastern-and-south-eastern-asia': 'regional-community-eastern-and-south-eastern-asia',
  'europe-and-northern-america': 'regional-community-europe-and-northern-america',
  'latin-america-and-the-caribbean': 'regional-community-latin-america-and-the-caribbean',
  'northern-africa-and-western-asia': 'regional-community-northern-africa-and-western-asia',
  'oceania': 'regional-community-oceania',
  'sub-saharan-africa': 'regional-community-sub-saharan-africa',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/-+/g, '-')       // Replace multiple - with single -
    .trim();
}

function generateKey(): string {
  return Math.random().toString(36).substring(2, 11);
}

async function generateAuthorsNDJSON() {
  console.log('👥 Generating Authors NDJSON\n');
  console.log('='.repeat(70) + '\n');

  // Read parsed content
  const parsedData = await fs.readJson(PARSED_CONTENT);
  const teamMembers: TeamMember[] = parsedData.teamMembers || [];

  console.log(`Found ${teamMembers.length} team member entries\n`);

  // Deduplicate by name and merge community memberships
  const authorsMap = new Map<string, Author>();

  for (const member of teamMembers) {
    const fullName = member.title ? `${member.title} ${member.name}` : member.name;
    const slug = slugify(member.name);

    if (!authorsMap.has(member.name)) {
      // Create new author
      authorsMap.set(member.name, {
        _type: 'author',
        _id: `author-${slug}`,
        name: fullName,
        slug: {
          _type: 'slug',
          current: slug,
        },
        communityMemberships: [],
      });
    }

    const author = authorsMap.get(member.name)!;

    // Add community membership if not already present
    const communityId = REGION_TO_COMMUNITY[member.region];
    if (communityId) {
      const alreadyMember = author.communityMemberships.some(
        m => m.community._ref === communityId
      );

      if (!alreadyMember) {
        author.communityMemberships.push({
          _key: generateKey(),
          community: {
            _type: 'reference',
            _ref: communityId,
          },
          role: member.title === 'Professor' ? 'Professor' : 'Researcher',
        });
      }
    }
  }

  const authors = Array.from(authorsMap.values());

  // Sort by name
  authors.sort((a, b) => a.name.localeCompare(b.name));

  console.log('📊 Statistics:\n');
  console.log(`  Total unique authors: ${authors.length}`);
  console.log(`  Authors with multiple communities: ${authors.filter(a => a.communityMemberships.length > 1).length}\n`);

  console.log('📋 Authors:\n');
  authors.forEach(author => {
    const communities = author.communityMemberships.length;
    console.log(`  ${author.name.padEnd(35)} (${communities} ${communities === 1 ? 'community' : 'communities'})`);
  });

  // Convert to NDJSON format
  const ndjson = authors
    .map(author => JSON.stringify(author))
    .join('\n');

  // Save to file
  const outputPath = path.join(OUTPUT_DIR, 'authors.ndjson');
  await fs.writeFile(outputPath, ndjson);

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Authors NDJSON Generated!');
  console.log(`\n📄 Output: ${outputPath}`);
  console.log(`📊 Total: ${authors.length} authors`);
  console.log('\n💡 Next Steps:');
  console.log('   1. Add author images and bios in Sanity Studio');
  console.log('   2. Link to organization affiliations');
  console.log('   3. Verify community roles are accurate\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAuthorsNDJSON().catch(console.error);
}

export { generateAuthorsNDJSON };
