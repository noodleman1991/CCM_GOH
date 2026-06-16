/**
 * Create the missing translated regionalCommunityPage docs (es/fr/ar) for every
 * region, cloned from the EN doc with only the translatable prose replaced:
 *   welcomeHero.title / welcomeHero.body
 *   whyJoinCTA.title  / whyJoinCTA.body
 * Everything else (images, links, regionalCommunity ref, all dynamic grids,
 * useTemplate, slug, orderRank) is copied verbatim — it is locale-agnostic and
 * renders in the request locale at fetch time.
 *
 * Also links every region's {en,es,fr,ar} docs into a translation.metadata group
 * (document-internationalization) so Studio surfaces them as translations.
 *
 * Idempotent. SAFE BY DEFAULT: dry-run unless you pass --apply.
 *   node scripts/migrate-rc-translated-pages.mjs            # dry run
 *   node scripts/migrate-rc-translated-pages.mjs --apply    # writes
 *
 * NOTE: the EN whyJoinCTA bodies have a copy-paste bug (most say "Central and
 * Southern Asia" regardless of region). The translated bodies below use the
 * CORRECT region name. The EN docs are left untouched (out of scope).
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "crypto";

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
const LOCALES = ["es", "fr", "ar"]; // en already exists for every region

// --- Region display names per locale (with the correct grammatical article). ---
const REGION_NAME = {
  "sub-saharan-africa": { en: "Sub-Saharan Africa", es: "África subsahariana", fr: "Afrique subsaharienne", ar: "أفريقيا جنوب الصحراء" },
  "northern-africa-and-western-asia": { en: "Northern Africa and Western Asia", es: "África del Norte y Asia Occidental", fr: "Afrique du Nord et Asie de l'Ouest", ar: "شمال أفريقيا وغرب آسيا" },
  "central-and-southern-asia": { en: "Central and Southern Asia", es: "Asia Central y Meridional", fr: "Asie centrale et méridionale", ar: "آسيا الوسطى والجنوبية" },
  "eastern-and-south-eastern-asia": { en: "Eastern and South-Eastern Asia", es: "Asia Oriental y Sudoriental", fr: "Asie de l'Est et del Sud-Est", ar: "شرق وجنوب شرق آسيا" },
  "latin-america-and-the-caribbean": { en: "Latin America and the Caribbean", es: "América Latina y el Caribe", fr: "Amérique latine et Caraïbes", ar: "أمريكا اللاتينية والبحر الكاريبي" },
  oceania: { en: "Oceania", es: "Oceanía", fr: "Océanie", ar: "أوقيانوسيا" },
  "europe-and-northern-america": { en: "Europe and Northern America", es: "Europa y América del Norte", fr: "Europe et Amérique du Nord", ar: "أوروبا وأمريكا الشمالية" },
};
// fix the typo above defensively
REGION_NAME["eastern-and-south-eastern-asia"].fr = "Asie de l'Est et du Sud-Est";

// --- Welcome hero title: "<region> regional community of practice" per locale. ---
const WELCOME_TITLE = {
  es: (r) => `Bienvenido a la comunidad de práctica regional de ${r}`,
  fr: (r) => `Bienvenue dans la communauté de pratique régionale : ${r}`,
  ar: (r) => `مرحبًا بكم في مجتمع الممارسة الإقليمي لـ${r}`,
};

// --- Welcome hero body (region-agnostic single paragraph). ---
const WELCOME_BODY = {
  es: "Este es un espacio conectado, apoyado y participativo que reúne los últimos resultados, eventos, noticias, recursos y personas del proyecto Connecting Climate Minds que trabajan en cambio climático y salud mental en la región.",
  fr: "Il s'agit d'un espace connecté, soutenu et engagé qui rassemble les derniers résultats, événements, actualités, ressources et personnes du projet Connecting Climate Minds travaillant sur le changement climatique et la santé mentale dans la région.",
  ar: "هذه مساحة مترابطة وداعمة وتفاعلية تجمع أحدث مخرجات مشروع Connecting Climate Minds وفعالياته وأخباره وموارده والأشخاص العاملين في مجال تغير المناخ والصحة النفسية في المنطقة.",
};

// --- Why-join CTA title per locale. ---
const WHY_TITLE = {
  es: "¿Por qué unirse a nuestra comunidad regional?",
  fr: "Pourquoi rejoindre notre communauté régionale ?",
  ar: "لماذا تنضم إلى مجتمعنا الإقليمي؟",
};

// --- Why-join CTA bullets per locale (3 bullets; {r} = localized region name). ---
const WHY_BULLETS = {
  es: (r) => [
    `Mantente al día con los recursos más recientes sobre cambio climático y salud mental en ${r}.`,
    "Conéctate con otras personas de distintas disciplinas, sectores y países interesadas en transformar el panorama de la investigación y las políticas sobre cambio climático y salud mental.",
    "Encuentra oportunidades para participar: ya seas investigador, responsable de políticas, profesional de la salud, docente u organizador comunitario, tus habilidades y experiencia son necesarias.",
  ],
  fr: (r) => [
    `Restez informé des dernières ressources sur le changement climatique et la santé mentale en ${r}.`,
    "Connectez-vous avec d'autres personnes de différentes disciplines, secteurs et pays désireuses de transformer le paysage de la recherche et des politiques sur le changement climatique et la santé mentale.",
    "Trouvez des occasions de vous impliquer : que vous soyez chercheur, décideur politique, professionnel de santé, enseignant ou organisateur communautaire, vos compétences et votre expertise sont précieuses.",
  ],
  ar: (r) => [
    `ابقَ على اطلاع بأحدث الموارد المتعلقة بتغير المناخ والصحة النفسية في ${r}.`,
    "تواصل مع أشخاص آخرين من مختلف التخصصات والقطاعات والبلدان المهتمين بتغيير مشهد البحث والسياسات في مجال تغير المناخ والصحة النفسية.",
    "اعثر على فرص للمشاركة: سواء كنت باحثًا أو صانع سياسات أو مختصًا في الرعاية الصحية أو معلمًا أو منظِّمًا مجتمعيًا، فإن مهاراتك وخبرتك مطلوبة.",
  ],
};

// --- Dynamic-grid SECTION titles per locale (region-agnostic). These are stored
//     as plain strings on the doc, so a clone keeps English unless translated.
//     Mirrors scripts/migrate-rc-titles.mjs SECTIONS. ---
const SECTION_TITLE = {
  agendasGrid: { es: "Agenda regional de investigación y acción", fr: "Programme régional de recherche et d'action", ar: "أجندة البحث والعمل الإقليمية" },
  caseStudiesGrid: { es: "Estudios de caso de toda la región", fr: "Études de cas de toute la région", ar: "دراسات حالة من جميع أنحاء المنطقة" },
  newsGrid: { es: "Noticias y novedades regionales", fr: "Actualités et nouveautés régionales", ar: "أخبار وتحديثات إقليمية" },
  livedExperiencesCarousel: { es: "Perspectivas de la experiencia vivida", fr: "Regards sur l'expérience vécue", ar: "رؤى من التجارب المعاشة" },
  teamGrid: { es: "El equipo regional", fr: "L'équipe régionale", ar: "الفريق الإقليمي" },
};

// portable-text helpers (fresh keys each call) ---------------------------------
const span = (text) => ({ _key: randomUUID().replace(/-/g, "").slice(0, 12), _type: "span", marks: [], text });
const para = (text) => ({ _key: `block-${randomUUID().replace(/-/g, "").slice(0, 9)}`, _type: "block", children: [span(text)], markDefs: [], style: "normal" });
const bullet = (text) => ({ ...para(text), level: 1, listItem: "bullet" });

const run = async () => {
  console.log(`\n=== RC translated-page generation — ${APPLY ? "APPLY (writing)" : "DRY RUN"} ===\n`);

  // Pull every published EN RC doc as the clone source.
  const enDocs = await client.fetch(
    `*[_type == "regionalCommunityPage" && language == "en" && !(_id in path("drafts.**"))]{...} | order(slug asc)`
  );
  // Existing non-en docs, so we don't recreate them (idempotent).
  const existing = await client.fetch(
    `*[_type == "regionalCommunityPage" && language != "en" && !(_id in path("drafts.**"))]{ _id, language, "slug": slug.current }`
  );
  const existingKey = new Set(existing.map((d) => `${d.slug}::${d.language}`));

  const tx = client.transaction();
  let toCreate = 0;
  const metaGroups = []; // { slug, members: [{_id, language}] }

  for (const en of enDocs) {
    const slug = en.slug.current;
    const names = REGION_NAME[slug];
    if (!names) {
      console.log(`  ⚠ no region-name map for ${slug} — skipping`);
      continue;
    }
    const members = [{ _id: en._id, language: "en" }];

    for (const loc of LOCALES) {
      const exists = existingKey.has(`${slug}::${loc}`);
      const r = names[loc];

      if (exists) {
        const ex = existing.find((d) => d.slug === slug && d.language === loc);
        members.push({ _id: ex._id, language: loc });
        console.log(`  • ${slug} [${loc}]  already exists (${ex._id}) — will link only`);
        continue;
      }

      // Clone the EN doc, swap language + prose, drop system/rev fields.
      const clone = structuredClone(en);
      const newId = `regional-community-page-${slug}-${loc}`;
      delete clone._rev;
      delete clone._createdAt;
      delete clone._updatedAt;
      delete clone._system;
      clone._id = newId;
      clone.language = loc;

      if (clone.welcomeHero) {
        clone.welcomeHero.title = WELCOME_TITLE[loc](r);
        clone.welcomeHero.body = [para(WELCOME_BODY[loc])];
      }
      if (clone.whyJoinCTA) {
        clone.whyJoinCTA.title = WHY_TITLE[loc];
        clone.whyJoinCTA.body = WHY_BULLETS[loc](r).map(bullet);
      }
      // Translate the dynamic-grid section headings (plain strings on the doc).
      for (const [field, byLoc] of Object.entries(SECTION_TITLE)) {
        if (clone[field] && byLoc[loc]) clone[field].title = byLoc[loc];
      }

      members.push({ _id: newId, language: loc });
      toCreate++;
      console.log(`  + CREATE ${newId}`);
      console.log(`      welcomeHero.title: ${clone.welcomeHero?.title}`);
      console.log(`      agendasGrid.title: ${clone.agendasGrid?.title}`);
      console.log(`      whyJoinCTA.title:  ${clone.whyJoinCTA?.title}`);
      if (APPLY) tx.createIfNotExists(clone);
    }

    metaGroups.push({ slug, members });
  }

  // Build/replace the translation.metadata group per region.
  let metaCount = 0;
  for (const g of metaGroups) {
    if (g.members.length < 2) continue;
    const metaId = `rc-i18n-${g.slug}`;
    // Shape mirrors @sanity/document-internationalization v4 exactly
    // (createReference): weak refs + _strengthenOnPublish, since the plugin is
    // configured with weakReferences: true.
    const metaDoc = {
      _id: metaId,
      _type: "translation.metadata",
      schemaTypes: ["regionalCommunityPage"],
      translations: g.members.map((m) => ({
        _key: m.language,
        _type: "internationalizedArrayReferenceValue",
        value: {
          _type: "reference",
          _ref: m._id,
          _weak: true,
          _strengthenOnPublish: { type: "regionalCommunityPage" },
        },
      })),
    };
    metaCount++;
    console.log(`  ⇄ META ${metaId}: [${g.members.map((m) => m.language).join(", ")}]`);
    if (APPLY) tx.createOrReplace(metaDoc);
  }

  console.log(`\n  ${toCreate} new locale docs · ${metaCount} translation groups`);
  if (APPLY) {
    await tx.commit();
    console.log("  ✓ committed.\n");
  } else {
    console.log("  (dry run — re-run with --apply to write)\n");
  }
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
