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
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: '2024-10-31',
  useCdn: false,
});

const LANGUAGES = ['en', 'es', 'fr', 'ar'];
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// -------------------------------------------------------------------
// Hardcoded translations for all 7 communities × 3 languages
// -------------------------------------------------------------------

const COMMUNITY_NAME_TRANSLATIONS = {
  'central-and-southern-asia': {
    es: 'Comunidad Regional de Asia Central y Meridional',
    fr: "Communauté régionale d'Asie centrale et méridionale",
    ar: 'المجتمع الإقليمي لآسيا الوسطى والجنوبية',
  },
  'eastern-and-south-eastern-asia': {
    es: 'Comunidad Regional de Asia Oriental y Sudoriental',
    fr: "Communauté régionale d'Asie orientale et du Sud-Est",
    ar: 'المجتمع الإقليمي لشرق وجنوب شرق آسيا',
  },
  'europe-and-northern-america': {
    es: 'Comunidad Regional de Europa y América del Norte',
    fr: "Communauté régionale d'Europe et d'Amérique du Nord",
    ar: 'المجتمع الإقليمي لأوروبا وأمريكا الشمالية',
  },
  'latin-america-and-the-caribbean': {
    es: 'Comunidad Regional de América Latina y el Caribe',
    fr: "Communauté régionale d'Amérique latine et des Caraïbes",
    ar: 'المجتمع الإقليمي لأمريكا اللاتينية والكاريبي',
  },
  'northern-africa-and-western-asia': {
    es: 'Comunidad Regional de África del Norte y Asia Occidental',
    fr: "Communauté régionale d'Afrique du Nord et d'Asie occidentale",
    ar: 'المجتمع الإقليمي لشمال أفريقيا وغرب آسيا',
  },
  'oceania': {
    es: 'Comunidad Regional de Oceanía',
    fr: "Communauté régionale d'Océanie",
    ar: 'المجتمع الإقليمي لأوقيانوسيا',
  },
  'sub-saharan-africa': {
    es: 'Comunidad Regional de África Subsahariana',
    fr: "Communauté régionale d'Afrique subsaharienne",
    ar: 'المجتمع الإقليمي لأفريقيا جنوب الصحراء',
  },
};

const HERO_TITLE_TRANSLATIONS = {
  'central-and-southern-asia': {
    es: 'Bienvenidos a la comunidad de práctica regional de Asia Central y Meridional',
    fr: "Bienvenue dans la communauté de pratique régionale d'Asie centrale et méridionale",
    ar: 'مرحباً بكم في مجتمع الممارسة الإقليمي لآسيا الوسطى والجنوبية',
  },
  'eastern-and-south-eastern-asia': {
    es: 'Bienvenidos a la comunidad de práctica regional de Asia Oriental y Sudoriental',
    fr: "Bienvenue dans la communauté de pratique régionale d'Asie orientale et du Sud-Est",
    ar: 'مرحباً بكم في مجتمع الممارسة الإقليمي لشرق وجنوب شرق آسيا',
  },
  'europe-and-northern-america': {
    es: 'Bienvenidos a la comunidad de práctica regional de Europa y América del Norte',
    fr: "Bienvenue dans la communauté de pratique régionale d'Europe et d'Amérique du Nord",
    ar: 'مرحباً بكم في مجتمع الممارسة الإقليمي لأوروبا وأمريكا الشمالية',
  },
  'latin-america-and-the-caribbean': {
    es: 'Bienvenidos a la comunidad de práctica regional de América Latina y el Caribe',
    fr: "Bienvenue dans la communauté de pratique régionale d'Amérique latine et des Caraïbes",
    ar: 'مرحباً بكم في مجتمع الممارسة الإقليمي لأمريكا اللاتينية والكاريبي',
  },
  'northern-africa-and-western-asia': {
    es: 'Bienvenidos a la comunidad de práctica regional de África del Norte y Asia Occidental',
    fr: "Bienvenue dans la communauté de pratique régionale d'Afrique du Nord et d'Asie occidentale",
    ar: 'مرحباً بكم في مجتمع الممارسة الإقليمي لشمال أفريقيا وغرب آسيا',
  },
  'oceania': {
    es: 'Bienvenidos a la comunidad de práctica regional de Oceanía',
    fr: "Bienvenue dans la communauté de pratique régionale d'Océanie",
    ar: 'مرحباً بكم في مجتمع الممارسة الإقليمي لأوقيانوسيا',
  },
  'sub-saharan-africa': {
    es: 'Bienvenidos a la comunidad de práctica regional de África Subsahariana',
    fr: "Bienvenue dans la communauté de pratique régionale d'Afrique subsaharienne",
    ar: 'مرحباً بكم في مجتمع الممارسة الإقليمي لأفريقيا جنوب الصحراء',
  },
};

const AGENDAS_TITLE_TRANSLATIONS = {
  'central-and-southern-asia': {
    es: 'Agenda de investigación y acción de Asia Central y Meridional',
    fr: "Programme de recherche et d'action pour l'Asie centrale et méridionale",
    ar: 'أجندة البحث والعمل لآسيا الوسطى والجنوبية',
  },
  'eastern-and-south-eastern-asia': {
    es: 'Agenda de investigación y acción de Asia Oriental y Sudoriental',
    fr: "Programme de recherche et d'action pour l'Asie orientale et du Sud-Est",
    ar: 'أجندة البحث والعمل لشرق وجنوب شرق آسيا',
  },
  'europe-and-northern-america': {
    es: 'Agendas',
    fr: 'Programmes',
    ar: 'جداول الأعمال',
  },
  'latin-america-and-the-caribbean': {
    es: 'Agenda de investigación y acción de América Latina y el Caribe',
    fr: "Programme de recherche et d'action pour l'Amérique latine et les Caraïbes",
    ar: 'أجندة البحث والعمل لأمريكا اللاتينية والكاريبي',
  },
  'northern-africa-and-western-asia': {
    es: 'Agenda de investigación y acción de África del Norte y Asia Occidental',
    fr: "Programme de recherche et d'action pour l'Afrique du Nord et l'Asie occidentale",
    ar: 'أجندة البحث والعمل لشمال أفريقيا وغرب آسيا',
  },
  'oceania': {
    es: 'Agenda de investigación y acción de Oceanía',
    fr: "Programme de recherche et d'action pour l'Océanie",
    ar: 'أجندة البحث والعمل لأوقيانوسيا',
  },
  'sub-saharan-africa': {
    es: 'Agenda de investigación y acción de África Subsahariana',
    fr: "Programme de recherche et d'action pour l'Afrique subsaharienne",
    ar: 'أجندة البحث والعمل لأفريقيا جنوب الصحراء',
  },
};

const TEAM_TITLE_TRANSLATIONS = {
  'central-and-southern-asia': {
    es: 'El equipo de Asia Central y Meridional',
    fr: "L'équipe d'Asie centrale et méridionale",
    ar: 'فريق آسيا الوسطى والجنوبية',
  },
  'eastern-and-south-eastern-asia': {
    es: 'El equipo de Asia Oriental y Sudoriental',
    fr: "L'équipe d'Asie orientale et du Sud-Est",
    ar: 'فريق شرق وجنوب شرق آسيا',
  },
  'europe-and-northern-america': {
    es: 'Nuestro Equipo',
    fr: 'Notre Équipe',
    ar: 'فريقنا',
  },
  'latin-america-and-the-caribbean': {
    es: 'El equipo de América Latina y el Caribe',
    fr: "L'équipe d'Amérique latine et des Caraïbes",
    ar: 'فريق أمريكا اللاتينية والكاريبي',
  },
  'northern-africa-and-western-asia': {
    es: 'El equipo de África del Norte y Asia Occidental',
    fr: "L'équipe d'Afrique du Nord et d'Asie occidentale",
    ar: 'فريق شمال أفريقيا وغرب آسيا',
  },
  'oceania': {
    es: 'Nuestro Equipo',
    fr: 'Notre Équipe',
    ar: 'فريقنا',
  },
  'sub-saharan-africa': {
    es: 'El equipo de África Subsahariana',
    fr: "L'équipe d'Afrique subsaharienne",
    ar: 'فريق أفريقيا جنوب الصحراء',
  },
};

// Common strings used across pages
const COMMON_TRANSLATIONS = {
  whyJoinTitle: {
    es: '¿Por qué unirse a nuestra comunidad regional?',
    fr: 'Pourquoi rejoindre notre communauté régionale ?',
    ar: 'لماذا الانضمام إلى مجتمعنا الإقليمي؟',
  },
  caseStudiesSubtitle: {
    es: 'Estudios de caso innovadores en toda la región',
    fr: 'Études de cas innovantes à travers la région',
    ar: 'دراسات حالة مبتكرة عبر المنطقة',
  },
  livedExperiencesSubtitle: {
    es: 'Perspectivas de experiencias vividas individuales y colectivas',
    fr: "Perspectives d'expériences vécues individuelles et collectives",
    ar: 'رؤى من التجارب الحياتية الفردية والجماعية',
  },
  newsTitle: {
    es: 'Noticias y Actualizaciones',
    fr: 'Actualités et Mises à jour',
    ar: 'أخبار ومستجدات',
  },
  newsGridTitle: {
    es: 'Noticias',
    fr: 'Actualités',
    ar: 'أخبار',
  },
  caseStudiesTitle: {
    es: 'Estudios de Caso',
    fr: 'Études de Cas',
    ar: 'دراسات الحالة',
  },
  communityVoicesTitle: {
    es: 'Voces de la Comunidad',
    fr: 'Voix de la Communauté',
    ar: 'أصوات المجتمع',
  },
  agendasFallback: {
    es: 'Agendas',
    fr: 'Programmes',
    ar: 'جداول الأعمال',
  },
  ourTeam: {
    es: 'Nuestro Equipo',
    fr: 'Notre Équipe',
    ar: 'فريقنا',
  },
};

// IDs of bad pages to delete (from failed previous run)
const BAD_PAGE_IDS = [
  'xTTxsDjEW3CD1lQanymLna',
  'xTTxsDjEW3CD1lQanyn93m',
  'xTTxsDjEW3CD1lQanynBX4',
];

// -------------------------------------------------------------------
// Step 1: Delete bad pages from failed run
// -------------------------------------------------------------------

async function deleteBadPages() {
  console.log('\n📝 Step 1: Deleting bad pages from failed run\n');

  let deleted = 0;
  for (const id of BAD_PAGE_IDS) {
    try {
      await sanityClient.delete(id);
      console.log(`   ✅ Deleted: ${id}`);
      deleted++;
    } catch (error) {
      if (error.statusCode === 404 || error.message?.includes('not found')) {
        console.log(`   ℹ️  Already gone: ${id}`);
      } else {
        console.error(`   ❌ Error deleting ${id}:`, error.message);
      }
    }
    await delay(500);
  }

  console.log(`\n   Deleted ${deleted} bad page(s)`);
  return deleted;
}

// -------------------------------------------------------------------
// Step 2: Fix community name translations
// -------------------------------------------------------------------

async function fixCommunityNames(communities) {
  console.log('\n📝 Step 2: Fixing community name translations\n');

  let fixed = 0;
  for (const community of communities) {
    const slug = community.slug;
    const translations = COMMUNITY_NAME_TRANSLATIONS[slug];

    if (!translations) {
      console.log(`   ⚠️  No translations for slug: ${slug}`);
      continue;
    }

    const currentName = community.name || {};
    const updates = { ...currentName };
    let needsUpdate = false;

    for (const lang of ['es', 'fr', 'ar']) {
      // Update if missing OR if it's still English text (not properly translated)
      if (!updates[lang] || updates[lang] === currentName.en) {
        updates[lang] = translations[lang];
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      try {
        await sanityClient.patch(community._id).set({ name: updates }).commit();
        console.log(`   ✅ Updated names for: ${currentName.en}`);
        fixed++;
      } catch (error) {
        console.error(`   ❌ Error updating ${currentName.en}:`, error.message);
      }
      await delay(500);
    } else {
      console.log(`   ✓ Already correct: ${currentName.en}`);
    }
  }

  console.log(`\n   Fixed ${fixed} community name(s)`);
  return fixed;
}

// -------------------------------------------------------------------
// Step 3: Create missing page language versions
// -------------------------------------------------------------------

function getTranslatedSections(slug, lang, sourcePage) {
  const sections = {};

  // Welcome hero
  if (sourcePage.welcomeHero) {
    sections.welcomeHero = {
      ...sourcePage.welcomeHero,
      background: { type: 'none' },
      title: HERO_TITLE_TRANSLATIONS[slug]?.[lang] || sourcePage.welcomeHero.title,
    };
    // Translate subtitle if present
    if (sourcePage.welcomeHero.subtitle) {
      // Use common translations for known subtitle patterns
      sections.welcomeHero.subtitle = sourcePage.welcomeHero.subtitle;
    }
  }

  // Why join CTA
  if (sourcePage.whyJoinCTA) {
    sections.whyJoinCTA = {
      ...sourcePage.whyJoinCTA,
      background: { type: 'none' },
      title: COMMON_TRANSLATIONS.whyJoinTitle[lang] || sourcePage.whyJoinCTA.title,
    };
  }

  // Agendas grid
  if (sourcePage.agendasGrid) {
    sections.agendasGrid = {
      ...sourcePage.agendasGrid,
      title: AGENDAS_TITLE_TRANSLATIONS[slug]?.[lang] || COMMON_TRANSLATIONS.agendasFallback[lang] || sourcePage.agendasGrid.title,
    };
  }

  // Case studies grid
  if (sourcePage.caseStudiesGrid) {
    sections.caseStudiesGrid = {
      ...sourcePage.caseStudiesGrid,
      title: COMMON_TRANSLATIONS.caseStudiesTitle[lang] || sourcePage.caseStudiesGrid.title,
    };
    if (sourcePage.caseStudiesGrid.subtitle) {
      sections.caseStudiesGrid.subtitle = COMMON_TRANSLATIONS.caseStudiesSubtitle[lang] || sourcePage.caseStudiesGrid.subtitle;
    }
  }

  // News grid
  if (sourcePage.newsGrid) {
    sections.newsGrid = {
      ...sourcePage.newsGrid,
      title: COMMON_TRANSLATIONS.newsGridTitle[lang] || sourcePage.newsGrid.title,
    };
  }

  // Lived experiences carousel
  if (sourcePage.livedExperiencesCarousel) {
    sections.livedExperiencesCarousel = {
      ...sourcePage.livedExperiencesCarousel,
      title: COMMON_TRANSLATIONS.communityVoicesTitle[lang] || sourcePage.livedExperiencesCarousel.title,
    };
    if (sourcePage.livedExperiencesCarousel.subtitle) {
      sections.livedExperiencesCarousel.subtitle = COMMON_TRANSLATIONS.livedExperiencesSubtitle[lang] || sourcePage.livedExperiencesCarousel.subtitle;
    }
  }

  // Team grid
  if (sourcePage.teamGrid) {
    sections.teamGrid = {
      ...sourcePage.teamGrid,
      title: TEAM_TITLE_TRANSLATIONS[slug]?.[lang] || COMMON_TRANSLATIONS.ourTeam[lang] || sourcePage.teamGrid.title,
    };
  }

  // Logo cloud (no translation needed, just copy)
  if (sourcePage.logoCloud) {
    sections.logoCloud = {
      ...sourcePage.logoCloud,
      background: { type: 'none' },
    };
  }

  return sections;
}

async function createMissingPages(communities, pages) {
  console.log('\n📝 Step 3: Creating missing page language versions\n');

  let created = 0;

  for (const community of communities) {
    const communityPages = pages.filter(p => p.communityRef === community._id);
    const existingLangs = communityPages.map(p => p.language).filter(Boolean);
    const missingLangs = LANGUAGES.filter(l => !existingLangs.includes(l));

    if (missingLangs.length === 0) {
      console.log(`   ✓ ${community.name?.en}: all languages exist`);
      continue;
    }

    const sourcePage = communityPages.find(p => p.language === 'en') || communityPages[0];
    if (!sourcePage) {
      console.log(`   ⚠️  No source page for ${community.name?.en} — skipping`);
      continue;
    }

    console.log(`\n   📍 ${community.name?.en}: creating ${missingLangs.join(', ')}`);

    for (const lang of missingLangs) {
      console.log(`   🌐 Creating [${lang}] version...`);

      try {
        const slug = community.slug;
        const communityName = COMMUNITY_NAME_TRANSLATIONS[slug]?.[lang] || community.name?.en || 'Regional Community';

        const newPage = {
          _type: 'regionalCommunityPage',
          title: communityName,
          slug: {
            _type: 'slug',
            current: sourcePage.slug || community.slug,
          },
          regionalCommunity: {
            _type: 'reference',
            _ref: community._id,
          },
          language: lang,
          useTemplate: sourcePage.useTemplate ?? true,
        };

        // Add translated sections if using template
        if (sourcePage.useTemplate) {
          const sections = getTranslatedSections(slug, lang, sourcePage);
          Object.assign(newPage, sections);
        }

        const result = await sanityClient.create(newPage);
        console.log(`   ✅ Created [${lang}] page: ${result._id}`);
        created++;

        await delay(1000);
      } catch (error) {
        console.error(`   ❌ Error creating [${lang}] for ${community.name?.en}:`, error.message);
      }
    }
  }

  console.log(`\n   Created ${created} new page(s)`);
  return created;
}

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------

async function main() {
  console.log('🔧 Regional Community Pages Fix Script (Hardcoded Translations)\n');
  console.log('='.repeat(70));

  // Fetch data
  console.log('Fetching data from Sanity...\n');

  const communities = await sanityClient.fetch(`
    *[_type == "regionalCommunity"] | order(name.en asc) {
      _id,
      name,
      "slug": slug.current,
      active,
      featured
    }
  `);

  const pages = await sanityClient.fetch(`
    *[_type == "regionalCommunityPage"] {
      _id,
      title,
      language,
      useTemplate,
      "slug": slug.current,
      "communityRef": regionalCommunity._ref,
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

  console.log(`Found ${communities.length} communities, ${pages.length} pages\n`);
  console.log('='.repeat(70));

  // Execute fixes
  const badDeleted = await deleteBadPages();
  const namesFixed = await fixCommunityNames(communities);
  const pagesCreated = await createMissingPages(communities, pages);

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 FIX SUMMARY');
  console.log('='.repeat(70));
  console.log(`Bad pages deleted: ${badDeleted}`);
  console.log(`Community names fixed: ${namesFixed}`);
  console.log(`New pages created: ${pagesCreated}`);
  console.log('='.repeat(70));

  console.log('\n📝 Next steps:');
  console.log('   1. Run audit script again: node scripts/audit-regional-pages.mjs');
  console.log('   2. Review new pages in Sanity Studio');
  console.log('   3. Browse community pages in all 4 languages on the site');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
