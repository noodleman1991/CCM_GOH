/**
 * Moves every regular page from its old per-language lists onto one shared
 * Sections list (CMS project 4, docs/superpowers/specs/2026-09-29-pages-on-sections-design.md §3.2).
 *
 *   pnpm exec tsx scripts/pages/move-to-sections.ts [--only=<slug>]          # dev dry run
 *   pnpm exec tsx scripts/pages/move-to-sections.ts --execute                # dev write
 *   pnpm exec tsx scripts/pages/move-to-sections.ts --revert [--only=<slug>] # empty the lists → old per-language lists
 *   … --production [--execute]                                              # PRODUCTION (user only)
 *
 * Dry run by default. A page that already has sections is skipped unless
 * `--replace`. The old per-language lists are never touched; nothing is deleted.
 */
import { planPageSections } from "./plan";
import { guardExisting, toLocaleData, withIdsFrom } from "../homepage/write";

type Row = Record<string, unknown>;
const LOCALES = ["en", "es", "fr", "ar"] as const;

const cell = (v: unknown, width: number) => String(v ?? "—").replace(/\s+/g, " ").slice(0, width).padEnd(width);
const headingOf = (s: Row) => {
  const direct = (s.title ?? s.heading) as Row | undefined;
  if (direct) return direct;
  const first = Array.isArray(s.splitColumns) ? (s.splitColumns as Row[])[0] : Array.isArray(s.columns) ? (s.columns as Row[])[0] : undefined;
  return (first?.title ?? undefined) as Row | undefined;
};

async function main() {
  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");
  const replace = argv.includes("--replace");
  const revert = argv.includes("--revert");
  const production = argv.includes("--production") || argv.includes("--allow-production");
  const only = argv.find((a) => a.startsWith("--only="))?.slice("--only=".length) ?? null;

  const { assertPayloadDatabase, getPayloadInstance, IMPORT_WRITE_CONTEXT, loadEnv } = await import("../payload-import/lib/runtime");
  await loadEnv();
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, {
    action: revert ? "put pages back on their old per-language lists" : execute ? "move pages onto shared sections" : "read pages",
    ...(production ? { allowProduction: true } : {}),
  });
  const payload = await getPayloadInstance();
  const context = IMPORT_WRITE_CONTEXT;

  const pages = (await payload.find({ collection: "pages", pagination: false, depth: 0, locale: "all", draft: false, sort: "slug" }))
    .docs as unknown as Row[];
  const wanted = pages.filter((p) => !only || p.slug === only);
  if (only && wanted.length === 0) {
    console.error(`No page with the slug "${only}".`);
    process.exit(1);
  }

  if (revert) {
    for (const p of wanted) {
      await payload.update({ collection: "pages", id: String(p.id), locale: "en", draft: false, data: { sections: [], layoutPerLanguage: false, _status: "published" } as never, context });
      for (const locale of LOCALES) {
        await payload.update({ collection: "pages", id: String(p.id), locale, draft: false, data: { sectionsByLanguage: [], _status: "published" } as never, context });
      }
      console.log(`${p.slug}: back on its old per-language lists.`);
    }
    console.log("Clear the site cache so visitors see it.");
    process.exit(0);
  }

  let failures = 0;
  for (const page of wanted) {
    const plan = planPageSections(page);
    console.log(`\n=== ${page.slug} — ${plan.mode === "shared" ? "SHARED (same in every language)" : "ALIGNED TO ENGLISH"} ===`);
    const refusal = guardExisting(Array.isArray(page.sections) ? page.sections : [], { replace, subject: String(page.slug) });
    if (refusal) {
      console.log(`  ${refusal}`);
      continue;
    }

    console.log(`  ${cell("#", 3)} ${cell("section", 15)} ${LOCALES.map((l) => cell(l, 22)).join(" | ")}`);
    plan.sections.forEach((s, i) => {
      const heading = headingOf(s);
      console.log(`  ${cell(i + 1, 3)} ${cell(s.blockType, 15)} ${LOCALES.map((l) => cell(heading?.[l], 22)).join(" | ")}`);
    });
    for (const l of plan.leftOut) console.log(`  Left out (${l.lang} only, kept in the hidden backup): ${l.blockType} at position ${l.index + 1}`);
    for (const d of plan.differences) console.log(`  Differed between languages (English kept): ${d.section} · ${d.path} · ${JSON.stringify(d.values)}`);
    for (const note of plan.notes) console.log(`  Note: ${note}`);

    if (!execute) continue;

    try {
      const id = String(page.id);
      await payload.update({
        collection: "pages",
        id,
        locale: "en",
        draft: false,
        data: { layoutPerLanguage: false, sections: toLocaleData(plan.sections, "en"), _status: "published" } as never,
        context,
      });
      const saved = (await payload.findByID({ collection: "pages", id, locale: "en", depth: 0, draft: false })) as unknown as Row;
      for (const locale of ["es", "fr", "ar"] as const) {
        await payload.update({
          collection: "pages",
          id,
          locale,
          draft: false,
          data: { sections: withIdsFrom(saved.sections, toLocaleData(plan.sections, locale)), _status: "published" } as never,
          context,
        });
      }
      console.log(`  Done: ${plan.sections.length} sections written.`);
    } catch (error) {
      failures++;
      console.error(`  FAILED for ${page.slug}:`, error);
    }
  }

  if (!execute) console.log("\nDry run — nothing was written. Re-run with --execute to apply.");
  else console.log(`\nFinished${failures ? ` with ${failures} failure(s)` : ""}. Clear the site cache so visitors see it:\n  curl -X POST <site>/api/cache/revalidate -H "Authorization: Bearer $ADMIN_API_KEY" -H 'content-type: application/json' -d '{"all":true}'`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
