/**
 * Regional Community page title cleanup + translation fill.
 *
 * - De-verbose the section titles (drop the repeated region name) — EXCEPT the
 *   Welcome hero, which keeps the region name.
 * - Fill/standardise the ar/fr translations of those titles.
 *
 * Idempotent. SAFE BY DEFAULT: dry-run unless you pass --apply.
 *   node scripts/migrate-rc-titles.mjs            # dry run
 *   node scripts/migrate-rc-titles.mjs --apply    # writes
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_EDITOR_TOKEN,
  apiVersion: "2024-10-31",
  useCdn: false,
});

const APPLY = process.argv.includes("--apply");

// Region display names per locale, for the Welcome title (which keeps the region).
const REGION_NAME = {
  "sub-saharan-africa": { en: "Sub-Saharan Africa", es: "África subsahariana", fr: "Afrique subsaharienne", ar: "أفريقيا جنوب الصحراء" },
  "northern-africa-and-western-asia": { en: "Northern Africa and Western Asia", es: "África del Norte y Asia Occidental", fr: "Afrique du Nord et Asie de l'Ouest", ar: "شمال أفريقيا وغرب آسيا" },
  "central-and-southern-asia": { en: "Central and Southern Asia", es: "Asia Central y Meridional", fr: "Asie centrale et méridionale", ar: "آسيا الوسطى والجنوبية" },
  "eastern-and-south-eastern-asia": { en: "Eastern and South-Eastern Asia", es: "Asia Oriental y Sudoriental", fr: "Asie de l'Est et du Sud-Est", ar: "شرق وجنوب شرق آسيا" },
  "latin-america-and-the-caribbean": { en: "Latin America and the Caribbean", es: "América Latina y el Caribe", fr: "Amérique latine et Caraïbes", ar: "أمريكا اللاتينية والبحر الكاريبي" },
  oceania: { en: "Oceania", es: "Oceanía", fr: "Océanie", ar: "أوقيانوسيا" },
  "europe-and-northern-america": { en: "Europe and Northern America", es: "Europa y América del Norte", fr: "Europe et Amérique du Nord", ar: "أوروبا وأمريكا الشمالية" },
};

// De-verbosed section titles per locale (region-agnostic — region is page context).
const WELCOME = {
  en: (r) => `Welcome to the ${r} regional community of practice`,
  es: (r) => `Bienvenido a la comunidad de práctica regional de ${r}`,
  fr: (r) => `Bienvenue dans la communauté de pratique régionale d'${r}`,
  ar: (r) => `مرحبًا بكم في مجتمع الممارسة الإقليمي لـ${r}`,
};
const SECTIONS = {
  whyJoinCTA: { en: "Why join our regional community?", es: "¿Por qué unirse a nuestra comunidad regional?", fr: "Pourquoi rejoindre notre communauté régionale ?", ar: "لماذا تنضم إلى مجتمعنا الإقليمي؟" },
  agendasGrid: { en: "Regional research & action agenda", es: "Agenda regional de investigación y acción", fr: "Programme régional de recherche et d'action", ar: "أجندة البحث والعمل الإقليمية" },
  caseStudiesGrid: { en: "Case studies from across the region", es: "Estudios de caso de toda la región", fr: "Études de cas de toute la région", ar: "دراسات حالة من جميع أنحاء المنطقة" },
  newsGrid: { en: "Regional news & updates", es: "Noticias y novedades regionales", fr: "Actualités et nouveautés régionales", ar: "أخبار وتحديثات إقليمية" },
  livedExperiencesCarousel: { en: "Lived experience insights", es: "Perspectivas de la experiencia vivida", fr: "Regards sur l'expérience vécue", ar: "رؤى من التجارب المعاشة" },
  teamGrid: { en: "The regional team", es: "El equipo regional", fr: "L'équipe régionale", ar: "الفريق الإقليمي" },
};

async function main() {
  if (!process.env.SANITY_API_EDITOR_TOKEN) {
    console.error("❌ SANITY_API_EDITOR_TOKEN missing.");
    process.exit(1);
  }

  const docs = await client.fetch(
    `*[_type=="regionalCommunityPage"]{ _id, language, "slug": slug.current,
      "agendasGrid": agendasGrid.title, "caseStudiesGrid": caseStudiesGrid.title,
      "newsGrid": newsGrid.title, "livedExperiencesCarousel": livedExperiencesCarousel.title,
      "teamGrid": teamGrid.title, "whyJoinCTA": whyJoinCTA.title, "welcomeHero": welcomeHero.title }`
  );

  let tx = client.transaction();
  let changes = 0;

  for (const d of docs) {
    const lang = d.language || "en";
    const region = REGION_NAME[d.slug]?.[lang] || REGION_NAME[d.slug]?.en || d.slug;
    const patch = {};

    // Welcome keeps the region name.
    const welcome = (WELCOME[lang] || WELCOME.en)(region);
    if (d.welcomeHero !== welcome) patch["welcomeHero.title"] = welcome;

    // Section titles drop the region.
    for (const [field, byLang] of Object.entries(SECTIONS)) {
      const next = byLang[lang] || byLang.en;
      if (d[field] !== undefined && d[field] !== next) patch[`${field}.title`] = next;
    }

    if (Object.keys(patch).length === 0) continue;
    changes++;
    console.log(`\n${lang}/${d.slug} ${d._id.includes("drafts") ? "(draft)" : ""}`);
    for (const [k, v] of Object.entries(patch)) {
      console.log(`  ${k}: ${JSON.stringify(d[k.split(".")[0]])} → ${JSON.stringify(v)}`);
    }
    tx = tx.patch(d._id, (p) => p.set(patch));
  }

  if (changes === 0) {
    console.log("\nNothing to change — already up to date.");
    return;
  }
  if (!APPLY) {
    console.log(`\n🟡 DRY RUN — ${changes} docs would change. Re-run with --apply.`);
    return;
  }
  await tx.commit();
  console.log(`\n✅ Updated ${changes} regional community pages.`);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
