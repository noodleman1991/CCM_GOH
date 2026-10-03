/**
 * Puts the events sections on the pages (events spec 2026-09-30 §3.6): an
 * Events chapter on every community page, and "Coming up" second on the
 * homepage. Both show upcoming events only, soonest first, and say nothing
 * when there are none.
 *
 *   pnpm exec tsx scripts/events/add-sections.ts                 # dev dry run
 *   pnpm exec tsx scripts/events/add-sections.ts --execute       # dev write
 *   … --homepage | --communities                                 # just one (default both)
 *   … --only=<community-slug>                                    # one community
 *   … --replace                                                  # swap an existing events feed for the standard one
 *   … --revert [--execute]                                       # take the added sections away again
 *   … --production [--execute | --revert]                        # PRODUCTION (user only)
 *
 * A page that already shows events anywhere is left alone (unless --replace).
 * --revert removes only the events feeds this script adds (events-only, with
 * its heading). Community pages with their own layout per language are left
 * alone. Dry run by default.
 */
import { EVENTS_HEADING, planEventSections, withoutEventSections, type Locale, type Target } from "./plan";
import { withIdsFrom } from "../homepage/write";

type Row = Record<string, unknown>;
type ByLanguage = Record<Locale, Row[]>;
const LOCALES: readonly Locale[] = ["en", "es", "fr", "ar"];
const OTHER_LOCALES: readonly Locale[] = ["es", "fr", "ar"];

async function main() {
  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");
  const revert = argv.includes("--revert");
  const replace = argv.includes("--replace");
  const production = argv.includes("--production") || argv.includes("--allow-production");
  const only = argv.find((a) => a.startsWith("--only="))?.slice("--only=".length) ?? null;
  const justHome = argv.includes("--homepage");
  const justCommunities = argv.includes("--communities") || only !== null;
  const doHome = justHome || !justCommunities;
  const doCommunities = justCommunities || !justHome;

  const { assertPayloadDatabase, getPayloadInstance, IMPORT_WRITE_CONTEXT, loadEnv } = await import("../payload-import/lib/runtime");
  await loadEnv();
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, {
    action: revert ? "take the events sections off the pages" : execute ? "add the events sections to the pages" : "read the homepage and community sections",
    ...(production ? { allowProduction: true } : {}),
  });
  const payload = await getPayloadInstance();
  const context = IMPORT_WRITE_CONTEXT;

  // One language at a time and no fallback: a mixed-language read turns an
  // empty text into `{}`, which would be written back as the text "{}".
  const readHomepage = async (): Promise<ByLanguage> => {
    const out = {} as ByLanguage;
    for (const locale of LOCALES) {
      const g = (await payload.findGlobal({ slug: "homepage", locale, fallbackLocale: false as never, depth: 0, draft: false })) as unknown as Row;
      out[locale] = Array.isArray(g.sections) ? (g.sections as Row[]) : [];
    }
    return out;
  };
  const readCommunities = async () => {
    const byLocale = {} as Record<Locale, Row[]>;
    for (const locale of LOCALES) {
      byLocale[locale] = (
        await payload.find({ collection: "regionalCommunities", pagination: false, depth: 0, locale, fallbackLocale: false as never, draft: false, sort: "id" })
      ).docs as unknown as Row[];
    }
    return byLocale.en
      .filter((c) => !only || c.slug === only)
      .map((c) => {
        const id = String(c.id);
        const sections = {} as ByLanguage;
        for (const locale of LOCALES) {
          const row = byLocale[locale].find((r) => String(r.id) === id);
          sections[locale] = Array.isArray(row?.sections) ? (row!.sections as Row[]) : [];
        }
        return { id, slug: String(c.slug), perLanguage: c.layoutPerLanguage === true, sections };
      });
  };

  /** English first (it owns the rows), then each language onto the same rows. */
  const write = async (target: { global: true } | { id: string }, sections: ByLanguage) => {
    const save = (locale: string, list: unknown) =>
      "global" in target
        ? payload.updateGlobal({ slug: "homepage", locale: locale as never, draft: false, depth: 0, data: { sections: list, _status: "published" } as never, context })
        : payload.update({ collection: "regionalCommunities", id: target.id, locale: locale as never, draft: false, depth: 0, data: { sections: list, _status: "published" } as never, context });
    await save("en", sections.en);
    const saved = (
      "global" in target
        ? await payload.findGlobal({ slug: "homepage", locale: "en", depth: 0, draft: false })
        : await payload.findByID({ collection: "regionalCommunities", id: target.id, locale: "en", depth: 0, draft: false })
    ) as unknown as Row;
    for (const locale of OTHER_LOCALES) await save(locale, withIdsFrom(saved.sections, sections[locale]));
  };

  /** Every language's plan for one page, judged by English. */
  const planPage = (sections: ByLanguage, target: Target) => {
    const per = Object.fromEntries(
      LOCALES.map((l) => [l, revert ? withoutEventSections(sections[l], target, l) : planEventSections(sections[l], target, { locale: l, replace })]),
    ) as Record<Locale, { sections: Row[]; changed: boolean; reason?: string }>;
    return { changed: per.en.changed, reason: per.en.reason, after: Object.fromEntries(LOCALES.map((l) => [l, per[l].sections])) as ByLanguage };
  };
  const verb = revert ? "take away" : "add";

  const jobs: Array<{ name: string; target: { global: true } | { id: string }; after: ByLanguage }> = [];
  if (doHome) {
    const home = await readHomepage();
    const plan = planPage(home, "homepage");
    console.log("\n=== Homepage ===");
    if (home.en.length === 0) console.log("  The homepage has no Sections yet — run scripts/homepage/move-to-sections.ts first.");
    else if (plan.changed) {
      console.log(`  ${verb} "${EVENTS_HEADING.homepage.en}" (upcoming events, 3, soonest first)${revert ? "" : " — second, under the hero"}`);
      jobs.push({ name: "Homepage", target: { global: true }, after: plan.after });
    } else console.log(`  Nothing to change${plan.reason ? ` — ${plan.reason}` : ""}.`);
  }
  if (doCommunities) {
    const communities = await readCommunities();
    console.log("\n=== Community pages ===");
    if (only && communities.length === 0) console.log(`  No community with the address "${only}".`);
    for (const c of communities) {
      if (c.perLanguage) {
        console.log(`  ${c.slug}: has its own layout per language — left alone; add an Events feed in the admin.`);
        continue;
      }
      if (c.sections.en.length === 0) {
        console.log(`  ${c.slug}: no Sections yet — left alone.`);
        continue;
      }
      const plan = planPage(c.sections, "community");
      if (plan.changed) {
        console.log(`  ${c.slug}: ${verb} the "${EVENTS_HEADING.community.en}" chapter (upcoming events, 6)`);
        jobs.push({ name: c.slug, target: { id: c.id }, after: plan.after });
      } else console.log(`  ${c.slug}: nothing to change${plan.reason ? ` — ${plan.reason}` : ""}`);
    }
  }

  if (!execute) {
    console.log(`\nDry run — nothing was written. Re-run with --execute to ${verb} ${jobs.length} section(s).`);
    process.exit(0);
  }
  let failures = 0;
  for (const job of jobs) {
    try {
      await write(job.target, job.after);
      console.log(`${job.name}: done.`);
    } catch (error) {
      failures++;
      console.error(`${job.name}: FAILED`, error);
    }
  }
  console.log(
    `\nFinished${failures ? ` with ${failures} failure(s)` : ""}. Clear the site cache so visitors see it:\n  curl -X POST <site>/api/cache/revalidate -H "Authorization: Bearer $ADMIN_API_KEY" -H 'content-type: application/json' -d '{"all":true}'`,
  );
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
