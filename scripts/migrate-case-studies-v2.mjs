import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { htmlToBlocks } from '@sanity/block-tools';
import { Schema } from '@sanity/schema';
import { JSDOM } from 'jsdom';

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

// Define a simple schema for block content conversion
const defaultSchema = Schema.compile({
  name: 'default',
  types: [
    {
      type: 'document',
      name: 'page',
      fields: [
        {
          type: 'array',
          name: 'content',
          of: [{ type: 'block' }]
        }
      ]
    }
  ]
});

const blockContentType = defaultSchema
  .get('page')
  .fields.find(field => field.name === 'content').type;

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

// Convert HTML string to Sanity block content
function htmlToSanityBlocks(html) {
  if (!html || html.trim() === '') {
    return [{
      _type: 'block',
      _key: `block-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        _key: `span-${Math.random().toString(36).substr(2, 9)}`,
        text: '',
        marks: []
      }],
      markDefs: []
    }];
  }

  try {
    // Clean the HTML first
    const $ = cheerio.load(html);

    // Remove script and style tags
    $('script, style').remove();

    // Get clean HTML
    const cleanHtml = $.html();

    // Use JSDOM for proper HTML parsing
    const dom = new JSDOM(cleanHtml);
    const blocks = htmlToBlocks(cleanHtml, blockContentType, {
      parseHtml: (html) => dom.window.document.querySelector('body')
    });

    return blocks && blocks.length > 0 ? blocks : createSimpleBlocks($($.root()).text());
  } catch (error) {
    console.log(`    ⚠️  HTML conversion failed, using simple text: ${error.message}`);
    // Fallback to simple text extraction
    const $ = cheerio.load(html);
    const text = cleanText($.text());
    return createSimpleBlocks(text);
  }
}

// Create simple block content from plain text
function createSimpleBlocks(text) {
  if (!text || text.trim() === '') {
    return [{
      _type: 'block',
      _key: `block-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [{
        _type: 'span',
        _key: `span-${Math.random().toString(36).substr(2, 9)}`,
        text: '',
        marks: []
      }],
      markDefs: []
    }];
  }

  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  return paragraphs.map(para => ({
    _type: 'block',
    _key: `block-${Math.random().toString(36).substr(2, 9)}`,
    style: 'normal',
    children: [{
      _type: 'span',
      _key: `span-${Math.random().toString(36).substr(2, 9)}`,
      text: cleanText(para),
      marks: []
    }],
    markDefs: []
  }));
}

// Fetch and parse case study from old site
async function fetchCaseStudy(id) {
  console.log(`\n🔍 Fetching case study ${id}...`);
  const url = `https://hub.connectingclimateminds.org/research-and-action/case-studies/${id}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Next.js page data from __NEXT_DATA__ script tag
    const nextDataScript = $('script#__NEXT_DATA__').html();
    let pageData = null;

    if (nextDataScript) {
      try {
        const nextData = JSON.parse(nextDataScript);
        pageData = nextData?.props?.pageProps?.page;
      } catch (e) {
        console.log('  ⚠️  Could not parse __NEXT_DATA__, using HTML fallback');
      }
    }

    // Extract data
    let title, excerpt, content, location, imageUrl;

    if (pageData) {
      // Use structured data from CMS
      title = pageData.title || $('h1').first().text();
      excerpt = pageData.description || pageData.excerpt || $('meta[name="description"]').attr('content');

      // Extract content from sections
      if (pageData.sections && Array.isArray(pageData.sections)) {
        const contentParts = pageData.sections
          .filter(s => s.content)
          .map(s => {
            const sectionTitle = s.title ? `<h2>${s.title}</h2>` : '';
            return sectionTitle + s.content;
          })
          .join('\n\n');
        content = contentParts;
      } else if (pageData.content) {
        content = pageData.content;
      }

      location = pageData.location || pageData.country;
      imageUrl = pageData.image?.url || pageData.headerImage?.url;
    }

    // Fallback to HTML scraping if structured data not available
    if (!title) {
      title = $('h1').first().text() || $('title').text().split('|')[0];
    }

    if (!excerpt) {
      excerpt = $('meta[name="description"]').attr('content') ||
                $('meta[property="og:description"]').attr('content') ||
                $('p').first().text().substring(0, 300);
    }

    if (!content) {
      // Try to find main content area
      const mainContent = $('main').html() || $('article').html() || $('.content').html();
      if (mainContent) {
        const $content = cheerio.load(mainContent);
        $content('script, style, nav, header, footer').remove();
        content = $content.html();
      } else {
        // Last resort: all paragraphs
        const paragraphs = [];
        $('p').each((i, elem) => {
          const text = $(elem).text().trim();
          if (text.length > 50) {
            paragraphs.push(text);
          }
        });
        content = paragraphs.join('\n\n');
      }
    }

    if (!imageUrl) {
      // Find first significant image
      const $imgs = $('img').filter((i, img) => {
        const src = $(img).attr('src');
        return src &&
               !src.includes('logo') &&
               !src.includes('icon') &&
               !src.startsWith('data:');
      });

      if ($imgs.length > 0) {
        imageUrl = $imgs.first().attr('src');
      }
    }

    // Normalize image URL
    if (imageUrl) {
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        imageUrl = 'https://hub.connectingclimateminds.org' + imageUrl;
      } else if (!imageUrl.startsWith('http')) {
        imageUrl = 'https://hub.connectingclimateminds.org/' + imageUrl;
      }
    }

    const data = {
      id,
      url,
      title: cleanText(title),
      excerpt: cleanText(excerpt),
      content: content || '',
      location: cleanText(location),
      imageUrl: imageUrl,
    };

    console.log(`  ✅ Title: ${data.title?.substring(0, 60)}...`);
    console.log(`  📝 Excerpt: ${data.excerpt?.substring(0, 60)}...`);
    console.log(`  📄 Content length: ${data.content?.length || 0} chars`);
    console.log(`  📍 Location: ${data.location || 'Not found'}`);
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
      es: data.title, // Will be translated later
      fr: data.title,
      ar: data.title
    },
    slug: { _type: 'slug', current: slugText || `case-study-${data.id}` },
    excerpt: {
      en: data.excerpt || data.title,
      es: data.excerpt || data.title, // Will be translated later
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
      locationText: { country: data.location, city: '' }
    }),
    ...(communityId && {
      relatedCommunity: { _type: 'reference', _ref: communityId }
    }),
  };

  try {
    await client.createOrReplace(doc);
    console.log(`✅ Created case study document: ${data.title.substring(0, 60)}...`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating document:`, error.message);
    if (error.response) {
      console.error(`   Response:`, error.response);
    }
    return false;
  }
}

// Main migration function
async function main() {
  console.log('🚀 Migrating Case Studies (Enhanced Version)\n');
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
  console.log('\n📝 Next steps:');
  console.log('  1. Review case studies in Sanity Studio');
  console.log('  2. Add translations for titles and excerpts');
  console.log('  3. Enrich author information');
  console.log('  4. Verify content formatting and images');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
