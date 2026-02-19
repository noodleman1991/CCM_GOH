import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
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

// Complete tag system
const TAGS = [
  // Location tags (Teal - #14b8a6)
  { label: { en: 'Vulnerable Populations', es: 'Poblaciones Vulnerables', fr: 'Populations Vulnérables', ar: 'السكان المعرضون للخطر' }, category: 'location', color: '#14b8a6' },
  { label: { en: 'Central & Southern Asia', es: 'Asia Central y del Sur', fr: 'Asie Centrale et du Sud', ar: 'آسيا الوسطى والجنوبية' }, category: 'location', color: '#14b8a6' },
  { label: { en: 'Eastern & South-Eastern Asia', es: 'Asia Oriental y Sudoriental', fr: 'Asie de l\'Est et du Sud-Est', ar: 'آسيا الشرقية والجنوبية الشرقية' }, category: 'location', color: '#14b8a6' },
  { label: { en: 'Europe & North America', es: 'Europa y América del Norte', fr: 'Europe et Amérique du Nord', ar: 'أوروبا وأمريكا الشمالية' }, category: 'location', color: '#14b8a6' },
  { label: { en: 'Latin America & Caribbean', es: 'América Latina y el Caribe', fr: 'Amérique Latine et Caraïbes', ar: 'أمريكا اللاتينية والكاريبي' }, category: 'location', color: '#14b8a6' },
  { label: { en: 'Northern Africa & Western Asia', es: 'África del Norte y Asia Occidental', fr: 'Afrique du Nord et Asie Occidentale', ar: 'شمال أفريقيا وغرب آسيا' }, category: 'location', color: '#14b8a6' },
  { label: { en: 'Oceania', es: 'Oceanía', fr: 'Océanie', ar: 'أوقيانوسيا' }, category: 'location', color: '#14b8a6' },
  { label: { en: 'Sub-Saharan Africa', es: 'África Subsahariana', fr: 'Afrique Subsaharienne', ar: 'أفريقيا جنوب الصحراء' }, category: 'location', color: '#14b8a6' },

  // Mental Health Impact tags (Green - #10b981)
  { label: { en: 'Eco-Anxiety', es: 'Eco-Ansiedad', fr: 'Éco-Anxiété', ar: 'القلق البيئي' }, category: 'impact', color: '#10b981' },
  { label: { en: 'Climate Grief', es: 'Duelo Climático', fr: 'Deuil Climatique', ar: 'الحزن المناخي' }, category: 'impact', color: '#10b981' },
  { label: { en: 'Trauma', es: 'Trauma', fr: 'Traumatisme', ar: 'الصدمة' }, category: 'impact', color: '#10b981' },
  { label: { en: 'Resilience', es: 'Resiliencia', fr: 'Résilience', ar: 'المرونة' }, category: 'impact', color: '#10b981' },
  { label: { en: 'Hope', es: 'Esperanza', fr: 'Espoir', ar: 'الأمل' }, category: 'impact', color: '#10b981' },
  { label: { en: 'Stress & Overwhelm', es: 'Estrés y Abrumamiento', fr: 'Stress et Surcharge', ar: 'التوتر والإرهاق' }, category: 'impact', color: '#10b981' },
  { label: { en: 'Coping Strategies', es: 'Estrategias de Afrontamiento', fr: 'Stratégies d\'Adaptation', ar: 'استراتيجيات التكيف' }, category: 'impact', color: '#10b981' },

  // Climate Impact tags (Orange - #f97316)
  { label: { en: 'Extreme Weather', es: 'Clima Extremo', fr: 'Conditions Météorologiques Extrêmes', ar: 'الطقس المتطرف' }, category: 'topic', color: '#f97316' },
  { label: { en: 'Flooding', es: 'Inundaciones', fr: 'Inondations', ar: 'الفيضانات' }, category: 'topic', color: '#f97316' },
  { label: { en: 'Drought', es: 'Sequía', fr: 'Sécheresse', ar: 'الجفاف' }, category: 'topic', color: '#f97316' },
  { label: { en: 'Sea Level Rise', es: 'Aumento del Nivel del Mar', fr: 'Élévation du Niveau de la Mer', ar: 'ارتفاع مستوى سطح البحر' }, category: 'topic', color: '#f97316' },
  { label: { en: 'Displacement', es: 'Desplazamiento', fr: 'Déplacement', ar: 'النزوح' }, category: 'topic', color: '#f97316' },
  { label: { en: 'Food Insecurity', es: 'Inseguridad Alimentaria', fr: 'Insécurité Alimentaire', ar: 'انعدام الأمن الغذائي' }, category: 'topic', color: '#f97316' },
  { label: { en: 'Wildfires', es: 'Incendios Forestales', fr: 'Feux de Forêt', ar: 'حرائق الغابات' }, category: 'topic', color: '#f97316' },

  // Population Group tags (Blue - #3b82f6)
  { label: { en: 'Youth', es: 'Juventud', fr: 'Jeunesse', ar: 'الشباب' }, category: 'audience', color: '#3b82f6' },
  { label: { en: 'Indigenous Communities', es: 'Comunidades Indígenas', fr: 'Communautés Autochtones', ar: 'المجتمعات الأصلية' }, category: 'audience', color: '#3b82f6' },
  { label: { en: 'Farmers', es: 'Agricultores', fr: 'Agriculteurs', ar: 'المزارعون' }, category: 'audience', color: '#3b82f6' },
  { label: { en: 'Fisher People', es: 'Pescadores', fr: 'Pêcheurs', ar: 'الصيادون' }, category: 'audience', color: '#3b82f6' },
  { label: { en: 'Urban Communities', es: 'Comunidades Urbanas', fr: 'Communautés Urbaines', ar: 'المجتمعات الحضرية' }, category: 'audience', color: '#3b82f6' },
  { label: { en: 'Rural Communities', es: 'Comunidades Rurales', fr: 'Communautés Rurales', ar: 'المجتمعات الريفية' }, category: 'audience', color: '#3b82f6' },
  { label: { en: 'Women', es: 'Mujeres', fr: 'Femmes', ar: 'النساء' }, category: 'audience', color: '#3b82f6' },
  { label: { en: 'Elders', es: 'Ancianos', fr: 'Anciens', ar: 'كبار السن' }, category: 'audience', color: '#3b82f6' },

  // Themes & Solutions tags (Purple - #8b5cf6)
  { label: { en: 'Community Action', es: 'Acción Comunitaria', fr: 'Action Communautaire', ar: 'العمل المجتمعي' }, category: 'topic', color: '#8b5cf6' },
  { label: { en: 'Traditional Knowledge', es: 'Conocimiento Tradicional', fr: 'Savoirs Traditionnels', ar: 'المعرفة التقليدية' }, category: 'topic', color: '#8b5cf6' },
  { label: { en: 'Adaptation', es: 'Adaptación', fr: 'Adaptation', ar: 'التكيف' }, category: 'topic', color: '#8b5cf6' },
  { label: { en: 'Mental Health Support', es: 'Apoyo de Salud Mental', fr: 'Soutien en Santé Mentale', ar: 'دعم الصحة النفسية' }, category: 'topic', color: '#8b5cf6' },
  { label: { en: 'Climate Justice', es: 'Justicia Climática', fr: 'Justice Climatique', ar: 'العدالة المناخية' }, category: 'topic', color: '#8b5cf6' },
  { label: { en: 'Storytelling', es: 'Narrativa', fr: 'Récits', ar: 'رواية القصص' }, category: 'topic', color: '#8b5cf6' },
  { label: { en: 'Connection to Nature', es: 'Conexión con la Naturaleza', fr: 'Connexion à la Nature', ar: 'الارتباط بالطبيعة' }, category: 'topic', color: '#8b5cf6' },
  { label: { en: 'Intergenerational Impact', es: 'Impacto Intergeneracional', fr: 'Impact Intergénérationnel', ar: 'التأثير بين الأجيال' }, category: 'topic', color: '#8b5cf6' },
];

async function createTags() {
  console.log('\n🏷️  Creating Tags in Sanity...\n');

  const createdTags = [];

  for (const tag of TAGS) {
    const slug = tag.label.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const docId = `tag-${slug}`;

    const tagDoc = {
      _type: 'tag',
      _id: docId,
      label: tag.label,
      value: {
        _type: 'slug',
        current: slug,
      },
      description: {
        en: `Tag for ${tag.label.en}`,
      },
      category: tag.category,
      color: tag.color,
    };

    try {
      await client.createOrReplace(tagDoc);
      console.log(`  ✅ ${tag.label.en} (${tag.category})`);
      createdTags.push({ id: docId, slug, ...tag });
    } catch (error) {
      console.error(`  ❌ Error creating ${tag.label.en}:`, error.message);
    }
  }

  console.log(`\n✅ Created ${createdTags.length} tags\n`);
  return createdTags;
}

async function fetchYouTubeMetadata(videoId) {
  // Try to fetch from YouTube oEmbed API (no API key needed)
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || null,
        author: data.author_name || null,
        thumbnail: data.thumbnail_url || null,
      };
    }
  } catch (error) {
    console.error(`  ⚠️  Could not fetch metadata for ${videoId}`);
  }
  return null;
}

async function enhanceLivedExperienceDocuments() {
  console.log('\n📹 Enhancing Lived Experience Documents with YouTube Metadata...\n');

  // Fetch all lived experience documents
  const docs = await client.fetch('*[_type == "livedExperience"]{_id, videoLink, title}');
  console.log(`Found ${docs.length} documents to enhance\n`);

  let enhanced = 0;
  let failed = 0;

  for (const doc of docs) {
    // Extract video ID from URL
    const videoId = doc.videoLink.split('v=')[1]?.split('&')[0];

    if (!videoId) {
      console.log(`  ⚠️  Could not extract video ID from ${doc._id}`);
      failed++;
      continue;
    }

    console.log(`  🔍 Fetching metadata for ${videoId}...`);
    const metadata = await fetchYouTubeMetadata(videoId);

    if (metadata && metadata.title) {
      try {
        await client
          .patch(doc._id)
          .set({
            'title.en': metadata.title,
            'description.en': `A lived experience video: ${metadata.title}`,
          })
          .commit();

        console.log(`    ✅ Updated: ${metadata.title}`);
        enhanced++;
      } catch (error) {
        console.error(`    ❌ Error updating ${doc._id}:`, error.message);
        failed++;
      }
    } else {
      console.log(`    ⚠️  No metadata found for ${videoId}`);
      failed++;
    }

    // Rate limiting - wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Enhanced ${enhanced} documents`);
  if (failed > 0) {
    console.log(`⚠️  ${failed} documents could not be enhanced`);
  }
  console.log();
}

async function createDefaultAuthor() {
  console.log('\n👤 Creating default author profile...\n');

  const authorDoc = {
    _type: 'author',
    _id: 'author-ccm-community',
    name: 'CCM Community',
    slug: {
      _type: 'slug',
      current: 'ccm-community',
    },
    bio: [{
      _type: 'block',
      _key: 'bio',
      style: 'normal',
      children: [{
        _type: 'span',
        _key: 'span',
        text: 'Members of the Connecting Climate Minds community sharing their lived experiences.',
        marks: []
      }],
      markDefs: []
    }],
  };

  try {
    await client.createOrReplace(authorDoc);
    console.log('  ✅ Created default author: CCM Community\n');
    return authorDoc._id;
  } catch (error) {
    console.error('  ❌ Error creating author:', error.message);
    return null;
  }
}

async function linkVideosToCommunitiesAndAuthor(authorId) {
  console.log('\n🔗 Linking videos to regional communities and author...\n');

  // Regional community mapping
  const communityMapping = {
    'Central and Southern Asia': 'central-and-southern-asia',
    'Eastern and South Eastern Asia': 'eastern-and-south-eastern-asia',
    'Europe and North America': 'europe-and-northern-america',
    'Latin America and the Caribbean': 'latin-america-and-the-caribbean',
    'Northern Africa and Western Asia': 'northern-africa-and-western-asia',
    'Oceania': 'oceania',
    'Sub-Saharan Africa': 'sub-saharan-africa',
  };

  // Fetch all regional communities
  const communities = await client.fetch('*[_type == "regionalCommunity"]{_id, slug}');
  const communityMap = {};
  communities.forEach(c => {
    communityMap[c.slug.current] = c._id;
  });

  console.log(`Found ${communities.length} regional communities\n`);

  // Fetch all lived experience documents
  const docs = await client.fetch('*[_type == "livedExperience"]{_id, slug, description}');

  let linked = 0;

  for (const doc of docs) {
    // Determine which community based on description
    let communityRef = null;
    for (const [category, slug] of Object.entries(communityMapping)) {
      if (doc.description?.en?.includes(category)) {
        communityRef = communityMap[slug];
        break;
      }
    }

    try {
      const updates = {
        author: {
          _type: 'reference',
          _ref: authorId,
        },
      };

      if (communityRef) {
        updates.relatedCommunity = {
          _type: 'reference',
          _ref: communityRef,
        };
      }

      await client
        .patch(doc._id)
        .set(updates)
        .commit();

      console.log(`  ✅ Linked ${doc._id.split('-').pop()} to ${communityRef ? 'community + ' : ''}author`);
      linked++;
    } catch (error) {
      console.error(`  ❌ Error linking ${doc._id}:`, error.message);
    }
  }

  console.log(`\n✅ Linked ${linked} videos\n`);
}

async function assignTagsToVideos(tags) {
  console.log('\n🏷️  Assigning tags to videos based on categories...\n');

  // Create tag reference map
  const tagMap = {};
  tags.forEach(tag => {
    tagMap[tag.label.en] = { _ref: tag.id, _type: 'reference', _key: tag.id };
  });

  // Category-based tag assignments
  const categoryTags = {
    'Vulnerable Populations': ['Vulnerable Populations', 'Resilience', 'Storytelling'],
    'Central and Southern Asia': ['Central & Southern Asia', 'Resilience', 'Community Action'],
    'Eastern and South Eastern Asia': ['Eastern & South-Eastern Asia', 'Adaptation', 'Hope'],
    'Europe and North America': ['Europe & North America', 'Eco-Anxiety', 'Climate Grief'],
    'Latin America and the Caribbean': ['Latin America & Caribbean', 'Traditional Knowledge', 'Indigenous Communities'],
    'Northern Africa and Western Asia': ['Northern Africa & Western Asia', 'Displacement', 'Climate Justice'],
    'Oceania': ['Oceania', 'Sea Level Rise', 'Displacement'],
    'Sub-Saharan Africa': ['Sub-Saharan Africa', 'Extreme Weather', 'Rural Communities'],
  };

  const docs = await client.fetch('*[_type == "livedExperience"]{_id, description}');

  let tagged = 0;

  for (const doc of docs) {
    // Determine category from description
    let assignedTags = [];
    for (const [category, tags] of Object.entries(categoryTags)) {
      if (doc.description?.en?.includes(category)) {
        assignedTags = tags.map(tagLabel => tagMap[tagLabel]).filter(Boolean);
        break;
      }
    }

    if (assignedTags.length > 0) {
      try {
        await client
          .patch(doc._id)
          .set({ tags: assignedTags })
          .commit();

        console.log(`  ✅ Tagged ${doc._id.split('-').pop()} with ${assignedTags.length} tags`);
        tagged++;
      } catch (error) {
        console.error(`  ❌ Error tagging ${doc._id}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Tagged ${tagged} videos\n`);
}

async function main() {
  console.log('🚀 Enhancing Lived Experiences\n');
  console.log('='.repeat(60));

  // Step 1: Create all tags
  const tags = await createTags();

  // Step 2: Create default author
  const authorId = await createDefaultAuthor();

  // Step 3: Fetch YouTube metadata and update titles
  await enhanceLivedExperienceDocuments();

  // Step 4: Link videos to communities and author
  if (authorId) {
    await linkVideosToCommunitiesAndAuthor(authorId);
  }

  // Step 5: Assign tags to videos
  await assignTagsToVideos(tags);

  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Created ${tags.length} tags`);
  console.log('✅ Created default author profile');
  console.log('✅ Enhanced videos with YouTube metadata');
  console.log('✅ Linked videos to communities and author');
  console.log('✅ Assigned tags to videos');
  console.log('='.repeat(60));
  console.log('\n✨ Enhancement completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
