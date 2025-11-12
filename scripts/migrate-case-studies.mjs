import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import translate from '@vitalets/google-translate-api';

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

// Translation function with retry and caching
const translationCache = {};

async function translateText(text, targetLang, retries = 3) {
  if (!text || text.trim() === '') return '';

  const cacheKey = `${text}_${targetLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  for (let i = 0; i < retries; i++) {
    try {
      await delay(200); // Rate limiting
      const result = await translate(text, { to: targetLang });
      translationCache[cacheKey] = result.text;
      return result.text;
    } catch (error) {
      console.log(`  ⚠️  Translation attempt ${i + 1}/${retries} failed for ${targetLang}: ${error.message}`);
      if (i === retries - 1) {
        console.log(`  ❌ Translation failed for ${targetLang}, using English`);
        return text; // Fallback to English
      }
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
  return text;
}

// Fetch case study from old site
async function fetchCaseStudy(id) {
  console.log(`\n🔍 Fetching case study ${id}...`);
  const url = `https://hub.connectingclimateminds.org/research-and-action/case-studies/${id}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();

    // Extract data using regex patterns (since HTML is complex)
    const data = {
      id,
      url,
      title: extractTitle(html),
      excerpt: extractExcerpt(html),
      content: extractContent(html),
      location: extractLocation(html),
      authors: extractAuthors(html),
      tags: extractTags(html),
      imageUrls: extractImages(html),
    };

    console.log(`  ✅ Title: ${data.title?.substring(0, 60)}...`);
    console.log(`  📍 Location: ${data.location || 'Not found'}`);
    console.log(`  👤 Authors: ${data.authors?.length || 0}`);
    console.log(`  🏷️  Tags: ${data.tags?.length || 0}`);
    console.log(`  🖼️  Images: ${data.imageUrls?.length || 0}`);

    return data;
  } catch (error) {
    console.error(`  ❌ Error fetching case study ${id}:`, error.message);
    return null;
  }
}

// Extraction functions
function extractTitle(html) {
  // Try multiple patterns
  const patterns = [
    /<h1[^>]*>(.*?)<\/h1>/is,
    /<title>(.*?)<\/title>/is,
    /"og:title"\s+content="([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }
  return 'Untitled Case Study';
}

function extractExcerpt(html) {
  const patterns = [
    /<meta\s+name="description"\s+content="([^"]+)"/i,
    /<p\s+class="[^"]*excerpt[^"]*"[^>]*>(.*?)<\/p>/is,
    /<div\s+class="[^"]*summary[^"]*"[^>]*>(.*?)<\/div>/is,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const text = cleanText(match[1]);
      if (text.length > 50) {
        return text.substring(0, 300);
      }
    }
  }

  // Fallback: first paragraph
  const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/is);
  if (pMatch) {
    const text = cleanText(pMatch[1]);
    return text.substring(0, 300);
  }

  return '';
}

function extractContent(html) {
  // Remove script and style tags
  let content = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
  content = content.replace(/<style[^>]*>.*?<\/style>/gis, '');

  // Try to find main content area
  const contentPatterns = [
    /<main[^>]*>(.*?)<\/main>/is,
    /<article[^>]*>(.*?)<\/article>/is,
    /<div\s+class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/is,
  ];

  for (const pattern of contentPatterns) {
    const match = content.match(pattern);
    if (match) {
      content = match[1];
      break;
    }
  }

  // Extract paragraphs and headings
  const sections = [];
  const htmlBlocks = content.match(/<(?:h[1-6]|p|ul|ol|blockquote)[^>]*>.*?<\/(?:h[1-6]|p|ul|ol|blockquote)>/gis) || [];

  for (const block of htmlBlocks) {
    const text = cleanText(block);
    if (text.length > 20) {
      sections.push(text);
    }
  }

  return sections.join('\n\n').substring(0, 5000); // Limit content length
}

function extractLocation(html) {
  const patterns = [
    /Location[:\s]+([^<\n]+)/i,
    /Country[:\s]+([^<\n]+)/i,
    /Region[:\s]+([^<\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }
  return null;
}

function extractAuthors(html) {
  const authorPatterns = [
    /Author[s]?[:\s]+([^<\n]+)/i,
    /By[:\s]+([^<\n]+)/i,
  ];

  for (const pattern of authorPatterns) {
    const match = html.match(pattern);
    if (match) {
      const authorText = cleanText(match[1]);
      return authorText.split(/,|\sand\s/).map(a => a.trim()).filter(a => a.length > 2);
    }
  }
  return [];
}

function extractTags(html) {
  const tagPatterns = [
    /<meta\s+name="keywords"\s+content="([^"]+)"/i,
    /Tags?[:\s]+([^<\n]+)/i,
  ];

  for (const pattern of tagPatterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1].split(',').map(t => cleanText(t)).filter(t => t.length > 2);
    }
  }
  return [];
}

function extractImages(html) {
  const imageUrls = [];
  const imgPattern = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  let match;

  while ((match = imgPattern.exec(html)) !== null) {
    const url = match[1];
    if (url && !url.startsWith('data:') && !url.includes('logo') && !url.includes('icon')) {
      // Make absolute URL
      if (url.startsWith('//')) {
        imageUrls.push('https:' + url);
      } else if (url.startsWith('/')) {
        imageUrls.push('https://hub.connectingclimateminds.org' + url);
      } else if (url.startsWith('http')) {
        imageUrls.push(url);
      }
    }
  }

  return [...new Set(imageUrls)]; // Remove duplicates
}

function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Create block content from text
function createBlockContent(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());

  return paragraphs.map(para => ({
    _type: 'block',
    _key: `block-${Math.random().toString(36).substr(2, 9)}`,
    style: 'normal',
    children: [{
      _type: 'span',
      _key: `span-${Math.random().toString(36).substr(2, 9)}`,
      text: para.trim(),
      marks: []
    }],
    markDefs: []
  }));
}

// Download and upload image to Sanity
async function uploadImage(imageUrl, caseStudyId) {
  try {
    console.log(`    📥 Downloading image...`);
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

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

// Create or get default author
async function getOrCreateDefaultAuthor() {
  const authorId = 'author-ccm-case-studies';

  try {
    const existing = await client.getDocument(authorId);
    if (existing) {
      return authorId;
    }
  } catch (error) {
    // Doesn't exist, create it
  }

  const author = {
    _type: 'author',
    _id: authorId,
    name: 'CCM Community',
    slug: { _type: 'slug', current: 'ccm-case-studies' },
    bio: [{
      _type: 'block',
      children: [{
        _type: 'span',
        text: 'Case studies submitted to the Connecting Climate Minds community.',
        marks: []
      }],
      markDefs: []
    }]
  };

  await client.createOrReplace(author);
  console.log('\n✅ Created default author for case studies');
  return authorId;
}

// Map location to regional community
async function findRegionalCommunity(location) {
  if (!location) return null;

  const locationLower = location.toLowerCase();
  const communityMapping = {
    'indonesia': 'eastern-and-south-eastern-asia',
    'japan': 'eastern-and-south-eastern-asia',
    'china': 'eastern-and-south-eastern-asia',
    'philippines': 'eastern-and-south-eastern-asia',
    'india': 'central-and-southern-asia',
    'bangladesh': 'central-and-southern-asia',
    'pakistan': 'central-and-southern-asia',
    'nepal': 'central-and-southern-asia',
    'kenya': 'sub-saharan-africa',
    'nigeria': 'sub-saharan-africa',
    'uganda': 'sub-saharan-africa',
    'south africa': 'sub-saharan-africa',
    'egypt': 'northern-africa-and-western-asia',
    'morocco': 'northern-africa-and-western-asia',
    'jordan': 'northern-africa-and-western-asia',
    'iraq': 'northern-africa-and-western-asia',
    'brazil': 'latin-america-and-the-caribbean',
    'mexico': 'latin-america-and-the-caribbean',
    'argentina': 'latin-america-and-the-caribbean',
    'peru': 'latin-america-and-the-caribbean',
    'australia': 'oceania',
    'new zealand': 'oceania',
    'fiji': 'oceania',
    'usa': 'europe-and-northern-america',
    'united states': 'europe-and-northern-america',
    'canada': 'europe-and-northern-america',
    'uk': 'europe-and-northern-america',
    'united kingdom': 'europe-and-northern-america',
    'germany': 'europe-and-northern-america',
    'france': 'europe-and-northern-america',
  };

  for (const [country, slug] of Object.entries(communityMapping)) {
    if (locationLower.includes(country)) {
      try {
        const community = await client.fetch(
          `*[_type == "regionalCommunity" && slug.current == $slug][0]{ _id }`,
          { slug }
        );
        if (community) {
          return community._id;
        }
      } catch (error) {
        console.log(`  ⚠️  Could not find community for ${slug}`);
      }
    }
  }

  return null;
}

// Create case study document
async function createCaseStudyDocument(data, authorId) {
  console.log(`\n📝 Creating document for case study ${data.id}...`);

  // Translate title and excerpt
  console.log('  🌐 Translating title and excerpt...');
  const titleEs = await translateText(data.title, 'es');
  const titleFr = await translateText(data.title, 'fr');
  const titleAr = await translateText(data.title, 'ar');

  const excerptEs = data.excerpt ? await translateText(data.excerpt, 'es') : '';
  const excerptFr = data.excerpt ? await translateText(data.excerpt, 'fr') : '';
  const excerptAr = data.excerpt ? await translateText(data.excerpt, 'ar') : '';

  // Upload featured image
  let featuredImage = null;
  if (data.imageUrls && data.imageUrls.length > 0) {
    const imageAssetId = await uploadImage(data.imageUrls[0], data.id);
    if (imageAssetId) {
      featuredImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAssetId
        },
        alt: data.title,
        caption: data.location || ''
      };
    }
  }

  // Find related community
  const communityId = await findRegionalCommunity(data.location);

  // Create document
  const doc = {
    _type: 'caseStudy',
    _id: `case-study-${data.id}`,
    title: {
      en: data.title,
      es: titleEs,
      fr: titleFr,
      ar: titleAr
    },
    slug: {
      _type: 'slug',
      current: `case-study-${data.id}`
    },
    excerpt: {
      en: data.excerpt || '',
      es: excerptEs,
      fr: excerptFr,
      ar: excerptAr
    },
    content: createBlockContent(data.content),
    ...(featuredImage && { image: featuredImage }),
    authors: [{
      _key: 'author-1',
      name: data.authors && data.authors.length > 0 ? data.authors[0] : 'CCM Community',
      role: 'lead'
    }],
    status: 'approved',
    featured: false,
    publishedAt: '2024-01-01T00:00:00Z',
    ...(data.location && {
      locationText: {
        country: data.location,
        city: ''
      }
    }),
    ...(communityId && {
      relatedCommunity: {
        _type: 'reference',
        _ref: communityId
      }
    }),
  };

  try {
    await client.createOrReplace(doc);
    console.log(`  ✅ Created case study document: ${data.title}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error creating document:`, error.message);
    return false;
  }
}

// Main migration function
async function main() {
  console.log('🚀 Migrating Case Studies\n');
  console.log('='.repeat(60));
  console.log(`Total case studies to migrate: ${CASE_STUDY_IDS.length}`);
  console.log('='.repeat(60));

  // Create default author
  const authorId = await getOrCreateDefaultAuthor();

  let successCount = 0;
  let failCount = 0;

  for (const id of CASE_STUDY_IDS) {
    try {
      // Fetch case study
      const data = await fetchCaseStudy(id);
      if (!data || !data.title) {
        console.log(`  ⚠️  Skipping case study ${id} - insufficient data`);
        failCount++;
        continue;
      }

      // Create document
      const success = await createCaseStudyDocument(data, authorId);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Rate limiting
      await delay(2000);

    } catch (error) {
      console.error(`\n❌ Fatal error with case study ${id}:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📋 Total: ${CASE_STUDY_IDS.length}`);
  console.log('='.repeat(60));
  console.log('\n✨ Case study migration completed!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
