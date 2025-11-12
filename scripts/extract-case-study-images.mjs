import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Upload image to Sanity
async function uploadImageToSanity(imageUrl, alt = '') {
  try {
    console.log(`    Downloading: ${imageUrl}`);
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error(`    ❌ Failed to download: ${response.status}`);
      return null;
    }

    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Generate filename
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex').slice(0, 8);
    const ext = contentType.split('/')[1] || 'jpg';
    const filename = `case-study-${hash}.${ext}`;

    console.log(`    Uploading to Sanity as: ${filename}`);

    // Upload to Sanity
    const asset = await client.assets.upload('image', buffer, {
      filename,
      contentType
    });

    console.log(`    ✅ Uploaded: ${asset._id}`);

    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id
      },
      alt: alt || 'Case study image'
    };
  } catch (error) {
    console.error(`    ❌ Error uploading image:`, error.message);
    return null;
  }
}

// Process HTML content block to extract and replace images
async function processContentBlock(block) {
  if (!block || block._type !== 'block') return block;

  // Check if block contains HTML with images
  const textContent = block.children?.map(c => c.text).join('') || '';

  if (!textContent.includes('<img')) return block;

  // Parse HTML
  const $ = cheerio.load(textContent);
  const images = [];

  $('img').each((i, elem) => {
    const src = $(elem).attr('src');
    const alt = $(elem).attr('alt') || '';

    if (src && (src.startsWith('http') || src.startsWith('//'))) {
      const fullUrl = src.startsWith('//') ? `https:${src}` : src;
      images.push({ url: fullUrl, alt });
    }
  });

  return { block, images };
}

async function extractAndUploadImages() {
  console.log('🖼️  Starting Case Study Image Extraction\n');

  // Fetch all case studies with content
  const caseStudies = await client.fetch(`
    *[_type == "caseStudy" && status == "approved"] {
      _id,
      "slug": slug.current,
      content
    }
  `);

  console.log(`Found ${caseStudies.length} approved case studies\n`);

  let processedCount = 0;
  let imagesUploaded = 0;

  for (const cs of caseStudies) {
    console.log(`\n📄 Processing: ${cs.slug || cs._id}`);

    if (!cs.content || !Array.isArray(cs.content)) {
      console.log('  ⏭️  No content blocks, skipping...');
      continue;
    }

    const newContent = [];
    let hasChanges = false;

    for (const block of cs.content) {
      // Check if it's an image block
      if (block._type === 'image') {
        newContent.push(block);
        continue;
      }

      // Check if it's a block with HTML containing images
      if (block._type === 'block') {
        const result = await processContentBlock(block);

        if (result.images && result.images.length > 0) {
          console.log(`  Found ${result.images.length} inline images`);

          // Add the text block (with HTML stripped)
          const $ = cheerio.load(result.block.children?.map(c => c.text).join('') || '');
          $('img').remove();
          const cleanText = $.text().trim();

          if (cleanText) {
            newContent.push({
              ...result.block,
              children: [{
                _type: 'span',
                text: cleanText,
                marks: []
              }]
            });
          }

          // Upload and add each image as a separate block
          for (const img of result.images) {
            const imageBlock = await uploadImageToSanity(img.url, img.alt);

            if (imageBlock) {
              newContent.push({
                _type: 'image',
                _key: crypto.randomBytes(12).toString('hex'),
                ...imageBlock
              });
              imagesUploaded++;
              hasChanges = true;
            }

            await delay(1000); // Rate limit
          }
        } else {
          newContent.push(block);
        }
      } else {
        newContent.push(block);
      }
    }

    // Update if changes were made
    if (hasChanges) {
      try {
        await client.patch(cs._id).set({ content: newContent }).commit();
        console.log(`  ✅ Updated with ${imagesUploaded} images`);
        processedCount++;
        await delay(500);
      } catch (error) {
        console.error(`  ❌ Error updating:`, error.message);
      }
    } else {
      console.log('  No inline images found');
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Image Extraction Summary:');
  console.log('='.repeat(50));
  console.log(`📄 Case studies processed: ${processedCount}`);
  console.log(`🖼️  Images uploaded: ${imagesUploaded}`);
  console.log('='.repeat(50) + '\n');

  console.log('✅ Image extraction complete!');
}

extractAndUploadImages().catch(console.error);
