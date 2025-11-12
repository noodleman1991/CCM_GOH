import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

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

// Case study IDs from the old site
const CASE_STUDY_IDS = [2, 11, 12, 13, 14, 15, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37];

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Clean text helper - removes HTML entities and excessive whitespace
function cleanText(text) {
  if (!text) return '';

  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\\u0026/g, '&')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u003d/g, '=')
    .replace(/\s+/g, ' ')
    .trim();
}

// Convert HTML string to clean text and create Sanity block content
function htmlToSanityBlocks(html) {
  if (!html || html.trim() === '') {
    return [];
  }

  try {
    const $ = cheerio.load(html);

    // Remove script and style tags
    $('script, style').remove();

    const blocks = [];

    // Process different types of elements
    $('body').children().each((i, elem) => {
      const $elem = $(elem);
      const tagName = elem.name;
      const text = cleanText($elem.text());

      if (!text || text.length < 3) return;

      let style = 'normal';
      if (tagName === 'h1') style = 'h1';
      else if (tagName === 'h2') style = 'h2';
      else if (tagName === 'h3') style = 'h3';
      else if (tagName === 'h4') style = 'h4';
      else if (tagName === 'h5') style = 'h5';
      else if (tagName === 'h6') style = 'h6';
      else if (tagName === 'blockquote') style = 'blockquote';

      // Handle lists
      if (tagName === 'ul' || tagName === 'ol') {
        const listItems = [];
        $elem.find('li').each((j, li) => {
          const liText = cleanText($(li).text());
          if (liText && liText.length > 2) {
            listItems.push(liText);
          }
        });

        if (listItems.length > 0) {
          blocks.push({
            _type: 'block',
            _key: `block-${Math.random().toString(36).substr(2, 9)}`,
            style: 'normal',
            listItem: tagName === 'ul' ? 'bullet' : 'number',
            children: listItems.map(item => ({
              _type: 'span',
              _key: `span-${Math.random().toString(36).substr(2, 9)}`,
              text: item,
              marks: []
            })),
            markDefs: []
          });
        }
        return;
      }

      // Check for strong/bold text
      const marks = [];
      if ($elem.find('strong, b').length > 0) {
        marks.push('strong');
      }
      if ($elem.find('em, i').length > 0) {
        marks.push('em');
      }

      blocks.push({
        _type: 'block',
        _key: `block-${Math.random().toString(36).substr(2, 9)}`,
        style,
        children: [{
          _type: 'span',
          _key: `span-${Math.random().toString(36).substr(2, 9)}`,
          text,
          marks
        }],
        markDefs: []
      });
    });

    return blocks.length > 0 ? blocks : createSimpleBlock('Content not available');
  } catch (error) {
    console.log(`    ⚠️  HTML conversion error: ${error.message}`);
    return createSimpleBlock('Content conversion error');
  }
}

// Create a simple text block
function createSimpleBlock(text) {
  return [{
    _type: 'block',
    _key: `block-${Math.random().toString(36).substr(2, 9)}`,
    style: 'normal',
    children: [{
      _type: 'span',
      _key: `span-${Math.random().toString(36).substr(2, 9)}`,
      text: cleanText(text),
      marks: []
    }],
    markDefs: []
  }];
}

// Fetch and parse case study from old site's Apollo SSR data
async function fetchCaseStudy(id) {
  console.log(`\n🔍 Fetching case study ${id}...`);
  const url = `https://hub.connectingclimateminds.org/research-and-action/case-studies/${id}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();

    // Extract Apollo SSR data from window[Symbol.for("ApolloSSRDataTransport")]
    const apolloMatch = html.match(/window\[Symbol\.for\("ApolloSSRDataTransport"\)\].*?\.push\(({.*?})\)/s);

    if (!apolloMatch) {
      console.log('  ⚠️  Could not find Apollo SSR data');
      return null;
    }

    const apolloData = JSON.parse(apolloMatch[1]);
    const rehydrateData = apolloData.json?.rehydrate;

    // Find the case study data in the rehydrate object
    let caseStudyData = null;
    for (const key in rehydrateData) {
      if (rehydrateData[key].data?.caseStudy) {
        caseStudyData = rehydrateData[key].data.caseStudy.data;
        break;
      }
    }

    if (!caseStudyData) {
      console.log('  ⚠️  Case study data not found in Apollo state');
      return null;
    }

    const attrs = caseStudyData.attributes;

    // Extract first significant image
    let imageUrl = null;
    if (attrs.map_illustration?.data?.[0]?.attributes?.url) {
      imageUrl = attrs.map_illustration.data[0].attributes.url;
    }

    // Combine all section content
    let fullContent = '';
    if (attrs.section && Array.isArray(attrs.section)) {
      for (const section of attrs.section) {
        if (section.title) {
          fullContent += `<h2>${section.title}</h2>\n`;
        }
        if (section.content) {
          fullContent += section.content + '\n\n';
        }
      }
    }

    // Extract excerpt from first section or first paragraph
    let excerpt = '';
    if (attrs.section && attrs.section[0]?.content) {
      const $ = cheerio.load(attrs.section[0].content);
      $('script, style, figure').remove();
      const firstPara = $('p').first().text();
      excerpt = cleanText(firstPara).substring(0, 300);
    }

    const data = {
      id,
      url,
      title: cleanText(attrs.title || 'Untitled Case Study'),
      excerpt: excerpt || cleanText(attrs.title),
      content: fullContent,
      location: cleanText(attrs.location_display_name || ''),
      tags: attrs.tags?.map(t => t.name) || [],
      imageUrl: imageUrl,
    };

    console.log(`  ✅ Title: ${data.title.substring(0, 60)}...`);
    console.log(`  📝 Excerpt: ${data.excerpt.substring(0, 60)}...`);
    console.log(`  📄 Content: ${data.content.length} chars, ${attrs.section?.length || 0} sections`);
    console.log(`  📍 Location: ${data.location || 'Not found'}`);
    console.log(`  🏷️  Tags: ${data.tags.length}`);
    console.log(`  🖼️  Image: ${data.imageUrl ? 'Found' : 'Not found'}`);

    return data;
  } catch (error) {
    console.error(`  ❌ Error fetching case study ${id}:`, error.message);
    return null;
  }
}

// Download and upload image to Sanity
async function uploadImage(imageUrl, caseStudyId) {
  if (!imageUrl) return null;

  try {
    console.log(`    📥 Downloading image...`);
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log(`    📤 Uploading to Sanity...`);
    const asset = await client.assets.upload('image', buffer, {
      filename: `case-study-${caseStudyId}-${Date.now()}.jpg`,
      contentType,
    });

    console.log(`    ✅ Uploaded image: ${asset._id}`);
    return asset._id;
  } catch (error) {
    console.log(`    ⚠️  Failed to upload image: ${error.message}`);
    return null;
  }
}

// Get or create default author
async function getOrCreateDefaultAuthor() {
  const authorId = 'author-ccm-case-studies';

  try {
    const existing = await client.getDocument(authorId);
    if (existing) {
      console.log('✅ Using existing default author');
      return authorId;
    }
  } catch (error) {
    // Doesn't exist, create it
  }

  console.log('📝 Creating default author...');
  const author = {
    _type: 'author',
    _id: authorId,
    name: 'CCM Community',
    slug: { _type: 'slug', current: 'ccm-case-studies' },
    bio: [{
      _type: 'block',
      _key: 'bio-1',
      style: 'normal',
      children: [{
        _type: 'span',
        _key: 'span-1',
        text: 'Case studies submitted to the Connecting Climate Minds community.',
        marks: []
      }],
      markDefs: []
    }]
  };

  await client.createOrReplace(author);
  console.log('✅ Created default author');
  return authorId;
}

// Map location to regional community
async function findRegionalCommunity(location) {
  if (!location) return null;

  const locationLower = location.toLowerCase();

  const communityMapping = {
    'indonesia': 'eastern-and-south-eastern-asia',
    'vietnam': 'eastern-and-south-eastern-asia',
    'thailand': 'eastern-and-south-eastern-asia',
    'philippines': 'eastern-and-south-eastern-asia',
    'malaysia': 'eastern-and-south-eastern-asia',
    'singapore': 'eastern-and-south-eastern-asia',
    'japan': 'eastern-and-south-eastern-asia',
    'china': 'eastern-and-south-eastern-asia',
    'korea': 'eastern-and-south-eastern-asia',
    'india': 'central-and-southern-asia',
    'pakistan': 'central-and-southern-asia',
    'bangladesh': 'central-and-southern-asia',
    'sri lanka': 'central-and-southern-asia',
    'nepal': 'central-and-southern-asia',
    'kenya': 'sub-saharan-africa',
    'nigeria': 'sub-saharan-africa',
    'south africa': 'sub-saharan-africa',
    'ethiopia': 'sub-saharan-africa',
    'ghana': 'sub-saharan-africa',
    'tanzania': 'sub-saharan-africa',
    'uganda': 'sub-saharan-africa',
    'egypt': 'northern-africa-and-western-asia',
    'morocco': 'northern-africa-and-western-asia',
    'tunisia': 'northern-africa-and-western-asia',
    'saudi arabia': 'northern-africa-and-western-asia',
    'uae': 'northern-africa-and-western-asia',
    'turkey': 'northern-africa-and-western-asia',
    'iran': 'northern-africa-and-western-asia',
    'australia': 'oceania',
    'new zealand': 'oceania',
    'fiji': 'oceania',
    'papua new guinea': 'oceania',
    'brazil': 'latin-america-and-the-caribbean',
    'mexico': 'latin-america-and-the-caribbean',
    'argentina': 'latin-america-and-the-caribbean',
    'colombia': 'latin-america-and-the-caribbean',
    'peru': 'latin-america-and-the-caribbean',
    'chile': 'latin-america-and-the-caribbean',
    'caribbean': 'latin-america-and-the-caribbean',
    'united states': 'europe-and-northern-america',
    'canada': 'europe-and-northern-america',
    'usa': 'europe-and-northern-america',
    'uk': 'europe-and-northern-america',
    'united kingdom': 'europe-and-northern-america',
    'france': 'europe-and-northern-america',
    'germany': 'europe-and-northern-america',
    'italy': 'europe-and-northern-america',
    'spain': 'europe-and-northern-america',
    'netherlands': 'europe-and-northern-america',
    'sweden': 'europe-and-northern-america',
    'norway': 'europe-and-northern-america',
    'denmark': 'europe-and-northern-america',
  };

  for (const [country, slug] of Object.entries(communityMapping)) {
    if (locationLower.includes(country)) {
      try {
        const community = await client.fetch(
          `*[_type == "regionalCommunity" && slug.current == $slug][0]{ _id }`,
          { slug }
        );
        if (community) {
          console.log(`    🌏 Linked to community: ${slug}`);
          return community._id;
        }
      } catch (error) {
        console.log(`    ⚠️  Could not find community: ${slug}`);
      }
    }
  }

  return null;
}

// Create case study document
async function createCaseStudyDocument(data, authorId) {
  console.log(`\n📝 Creating case study document...`);

  // Convert HTML content to Sanity blocks
  const contentBlocks = htmlToSanityBlocks(data.content);

  // Upload featured image
  let featuredImage = null;
  if (data.imageUrl) {
    const imageAssetId = await uploadImage(data.imageUrl, data.id);
    if (imageAssetId) {
      featuredImage = {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssetId },
        alt: data.title,
      };
    }
  }

  // Find related community
  const communityId = await findRegionalCommunity(data.location);

  // Create slug from title
  const slugText = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 96);

  // Create document
  const doc = {
    _type: 'caseStudy',
    _id: `case-study-${data.id}`,
    title: {
      en: data.title,
      es: data.title, // Will be translated manually later
      fr: data.title,
      ar: data.title
    },
    slug: { _type: 'slug', current: slugText || `case-study-${data.id}` },
    excerpt: {
      en: data.excerpt || data.title,
      es: data.excerpt || data.title, // Will be translated manually later
      fr: data.excerpt || data.title,
      ar: data.excerpt || data.title
    },
    content: contentBlocks,
    ...(featuredImage && { image: featuredImage }),
    authors: [{
      _key: 'author-1',
      _type: 'reference',
      _ref: authorId
    }],
    status: 'approved',
    featured: false,
    publishedAt: '2024-01-01T00:00:00Z',
    ...(data.location && {
      locationText: {
        country: data.location.split(',')[0].trim(),
        city: data.location.includes(',') ? data.location.split(',').slice(1).join(',').trim() : ''
      }
    }),
    ...(communityId && {
      relatedCommunity: { _type: 'reference', _ref: communityId }
    }),
  };

  try {
    await client.createOrReplace(doc);
    console.log(`✅ Created: ${data.title.substring(0, 60)}...`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating document:`, error.message);
    if (error.response) {
      console.error(`   Response:`, JSON.stringify(error.response).substring(0, 500));
    }
    return false;
  }
}

// Main migration function
async function main() {
  console.log('🚀 Migrating Case Studies (Final Version)\n');
  console.log('='.repeat(60));
  console.log(`Total case studies to migrate: ${CASE_STUDY_IDS.length}`);
  console.log('='.repeat(60));

  // Step 1: Create default author
  const authorId = await getOrCreateDefaultAuthor();
  console.log('');

  // Step 2: Migrate each case study
  let successCount = 0;
  let failCount = 0;

  for (const id of CASE_STUDY_IDS) {
    try {
      const data = await fetchCaseStudy(id);

      if (!data) {
        console.log(`⏭️  Skipping case study ${id}`);
        failCount++;
        continue;
      }

      await delay(500); // Rate limiting

      const success = await createCaseStudyDocument(data, authorId);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      await delay(1000); // Rate limiting between case studies
    } catch (error) {
      console.error(`❌ Error processing case study ${id}:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${CASE_STUDY_IDS.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('='.repeat(60));
  console.log('\n✨ Migration completed!');
  console.log('\n🌐 Test URLs:');
  console.log('  /en/case-studies');
  console.log('  /en/case-studies/[slug]');
  console.log('\n📝 Next steps:');
  console.log('  1. Review case studies in Sanity Studio');
  console.log('  2. Add translations for titles and excerpts (manually or via translation service)');
  console.log('  3. Verify content formatting and images');
  console.log('  4. Test case study pages on the site');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
