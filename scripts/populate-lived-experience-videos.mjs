import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Map countries to regions
const countryToRegion = {
  'Kenya': 'sub-saharan-africa',
  'Nigeria': 'sub-saharan-africa',
  'South Africa': 'sub-saharan-africa',
  'Ethiopia': 'sub-saharan-africa',
  'Ghana': 'sub-saharan-africa',
  'India': 'central-and-southern-asia',
  'Pakistan': 'central-and-southern-asia',
  'Bangladesh': 'central-and-southern-asia',
  'Nepal': 'central-and-southern-asia',
  'Afghanistan': 'central-and-southern-asia',
  'Philippines': 'eastern-and-south-eastern-asia',
  'Indonesia': 'eastern-and-south-eastern-asia',
  'Vietnam': 'eastern-and-south-eastern-asia',
  'Thailand': 'eastern-and-south-eastern-asia',
  'Japan': 'eastern-and-south-eastern-asia',
  'Brazil': 'latin-america-and-the-caribbean',
  'Mexico': 'latin-america-and-the-caribbean',
  'Colombia': 'latin-america-and-the-caribbean',
  'Peru': 'latin-america-and-the-caribbean',
  'Argentina': 'latin-america-and-the-caribbean',
  'Australia': 'oceania',
  'New Zealand': 'oceania',
  'Solomon Islands': 'oceania',
  'Fiji': 'oceania',
  'Papua New Guinea': 'oceania',
  'UK': 'europe-and-northern-america',
  'USA': 'europe-and-northern-america',
  'Canada': 'europe-and-northern-america',
  'Germany': 'europe-and-northern-america',
  'France': 'europe-and-northern-america',
};

// Common tags for climate/mental health videos
const defaultTags = [
  'climate-change',
  'mental-health',
  'lived-experience',
  'community-stories',
  'climate-action'
];

async function populateVideos() {
  console.log('🎬 Populating Lived Experience Videos\n');

  const videos = await client.fetch(`*[_type == "livedExperience"] {
    _id,
    title,
    videoUrl,
    region,
    tags
  }`);

  console.log(`Found ${videos.length} videos\n`);

  let updated = 0;

  for (const video of videos) {
    const updates = {};
    let needsUpdate = false;

    // Extract YouTube ID from document ID
    const youtubeIdMatch = video._id.match(/lived-experience-(.+)/);
    if (youtubeIdMatch && !video.videoUrl) {
      const youtubeId = youtubeIdMatch[1];
      updates.videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
      needsUpdate = true;
    }

    // Extract country from title and map to region
    if (video.title?.en && !video.region) {
      for (const [country, region] of Object.entries(countryToRegion)) {
        if (video.title.en.includes(country)) {
          // Find the regional community reference
          const regionalCommunity = await client.fetch(
            `*[_type == "regionalCommunity" && slug.current == $slug][0]._id`,
            { slug: region }
          );

          if (regionalCommunity) {
            updates.region = {
              _type: 'reference',
              _ref: regionalCommunity
            };
            needsUpdate = true;
          }
          break;
        }
      }
    }

    // Add default tags if missing
    if (!video.tags || video.tags.length === 0) {
      updates.tags = defaultTags;
      needsUpdate = true;
    }

    // Update if needed
    if (needsUpdate) {
      try {
        await client.patch(video._id).set(updates).commit();
        console.log(`✅ Updated: ${video.title?.en || video._id}`);
        updated++;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Error updating ${video._id}:`, error.message);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Updated ${updated} videos`);
  console.log('='.repeat(50));
}

populateVideos().catch(console.error);
