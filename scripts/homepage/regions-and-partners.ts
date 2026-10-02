/**
 * Puts the regions-and-partners sections on the pages
 * (docs/superpowers/specs/2026-09-30-regions-and-partners-design.md §3.6).
 *
 *   pnpm exec tsx scripts/homepage/regions-and-partners.ts                 # dev dry run
 *   pnpm exec tsx scripts/homepage/regions-and-partners.ts --execute       # dev write
 *   pnpm exec tsx scripts/homepage/regions-and-partners.ts --revert        # put back the newest backup
 *   … --production [--execute | --revert]                                  # PRODUCTION (user only)
 *
 * Homepage: the seven-card regions grid → a Community carousel; the region
 * map's "latest from each region" off; the logo strip → a grouped wall with
 * Wellcome (Funded by) and Climate Cares Centre (Hosted by).
 * Community pages: logo strips → one line.
 *
 * Before writing, the current homepage and community Sections are saved to
 * backups/regions-and-partners-<time>.json (git-ignored); --revert writes the
 * newest one back. Dry run by default. Nothing is deleted.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { planCommunityLogos, planRegionsAndPartners, toPutBack, type ByLanguage, type RegionsBackup } from "./regions-and-partners-plan";
import { withIdsFrom } from "./write";

type Row = Record<string, unknown>;
const OTHER_LOCALES = ["es", "fr", "ar"] as const;
const BACKUP_DIR = path.resolve(process.cwd(), "backups");
const BACKUP_PREFIX = "regions-and-partners-";

async function main() {
  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");
  const revert = argv.includes("--revert");
  const production = argv.includes("--production") || argv.includes("--allow-production");

  const { assertPayloadDatabase, getPayloadInstance, IMPORT_WRITE_CONTEXT, loadEnv } = await import("../payload-import/lib/runtime");
  await loadEnv();
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, {
    action: revert ? "put the homepage and community sections back" : execute ? "change the homepage and community sections" : "read the homepage and community sections",
    ...(production ? { allowProduction: true } : {}),
  });
  const payload = await getPayloadInstance();
  const context = IMPORT_WRITE_CONTEXT;

  const LOCALES = ["en", ...OTHER_LOCALES] as const;
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
  const readCommunities = async (): Promise<Array<{ id: string; slug: string; perLanguage: boolean; sections: ByLanguage }>> => {
    const byLocale = {} as Record<(typeof LOCALES)[number], Row[]>;
    for (const locale of LOCALES) {
      byLocale[locale] = (await payload.find({ collection: "regionalCommunities", pagination: false, depth: 0, locale, fallbackLocale: false as never, draft: false, sort: "id" })).docs as unknown as Row[];
    }
    return byLocale.en.map((c) => {
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

  if (revert) {
    const newest = readdirSync(BACKUP_DIR).filter((f) => f.startsWith(BACKUP_PREFIX)).sort().at(-1);
    if (!newest) {
      console.log("No backup found in backups/ — nothing to put back.");
      process.exit(1);
    }
    const backup = JSON.parse(readFileSync(path.join(BACKUP_DIR, newest), "utf8")) as RegionsBackup;
    if (backup.version !== 2) {
      console.log(`${newest} is an older backup that mixed the languages together and can't be put back safely. Nothing was changed.`);
      process.exit(1);
    }
    const back = toPutBack(backup);
    console.log(`Putting back ${newest}: ${back.homepage ? "the homepage, " : ""}${back.communities.length} community page(s).`);
    if (!execute) {
      console.log("Dry run — add --execute to put it back.");
      process.exit(0);
    }
    if (back.homepage) {
      await write({ global: true }, back.homepage);
      console.log("Homepage: put back.");
    }
    for (const c of back.communities) {
      await write({ id: c.id }, c.sections);
      console.log(`${c.slug}: put back.`);
    }
    console.log("Done. Clear the site cache so visitors see it.");
    process.exit(0);
  }

  const home = await readHomepage();
  const communities = await readCommunities();

  const orgs = (await payload.find({ collection: "organizations", pagination: false, depth: 0, locale: "en", select: { name: true } as never })).docs as unknown as Array<{ id: string; name?: string }>;
  const orgId = (re: RegExp) => orgs.find((o) => re.test(o.name ?? ""))?.id ?? null;
  const ids = { fundedBy: orgId(/^wellcome\b/i), hostedBy: orgId(/climate cares/i) };
  const homePlan = Object.fromEntries(LOCALES.map((l) => [l, planRegionsAndPartners(home[l], ids)])) as Record<(typeof LOCALES)[number], ReturnType<typeof planRegionsAndPartners>>;
  const plan = homePlan.en;

  console.log("\n=== Homepage ===");
  if (home.en.length === 0) console.log("  The homepage has no Sections yet — run scripts/homepage/move-to-sections.ts first.");
  for (const c of plan.changes) console.log(`  ${c}`);
  for (const m of plan.missing) console.log(`  Couldn't find the organisation for ${m} — that spot stays empty; pick it in the admin.`);
  if (plan.changes.length === 0) console.log("  Nothing to change.");

  const communityPlans = communities.map((c) => {
    const per = Object.fromEntries(LOCALES.map((l) => [l, planCommunityLogos(c.sections[l])])) as Record<(typeof LOCALES)[number], ReturnType<typeof planCommunityLogos>>;
    const after = Object.fromEntries(LOCALES.map((l) => [l, per[l].sections])) as ByLanguage;
    return { ...c, before: c.sections, after, changes: per.en.changes };
  });
  console.log("\n=== Community pages ===");
  for (const c of communityPlans) {
    if (c.perLanguage) console.log(`  ${c.slug}: has its own layout per language — left alone; switch its logo strips to One line in the admin.`);
    else console.log(`  ${c.slug}: ${c.changes.length ? c.changes.join(" · ") : "nothing to change"}`);
  }

  if (!execute) {
    console.log("\nDry run — nothing was written. Re-run with --execute to apply.");
    process.exit(0);
  }

  // Nothing to change → no backup, so --revert still finds the run that did change things.
  if (!(plan.changes.length > 0 && home.en.length > 0) && communityPlans.every((c) => c.perLanguage || c.changes.length === 0)) {
    console.log("\nNothing to change — nothing written, no backup saved.");
    process.exit(0);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });
  const file = path.join(BACKUP_DIR, `${BACKUP_PREFIX}${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  const backup: RegionsBackup = {
    version: 2,
    homepageChanged: plan.changes.length > 0 && home.en.length > 0,
    homepage: home,
    communities: communityPlans.map(({ id, slug, before, changes, perLanguage }) => ({ id, slug, changed: !perLanguage && changes.length > 0, sections: before })),
  };
  writeFileSync(file, JSON.stringify(backup, null, 2));
  console.log(`\nSaved the current sections to ${path.relative(process.cwd(), file)} (for --revert).`);

  let failures = 0;
  if (backup.homepageChanged) {
    try {
      await write({ global: true }, Object.fromEntries(LOCALES.map((l) => [l, homePlan[l].sections])) as ByLanguage);
      console.log("Homepage: done.");
    } catch (error) {
      failures++;
      console.error("Homepage: FAILED", error);
    }
  }
  for (const c of communityPlans) {
    if (c.perLanguage || c.changes.length === 0) continue;
    try {
      await write({ id: c.id }, c.after);
      console.log(`${c.slug}: done.`);
    } catch (error) {
      failures++;
      console.error(`${c.slug}: FAILED`, error);
    }
  }
  console.log(`\nFinished${failures ? ` with ${failures} failure(s)` : ""}. Clear the site cache so visitors see it:\n  curl -X POST <site>/api/cache/revalidate -H "Authorization: Bearer $ADMIN_API_KEY" -H 'content-type: application/json' -d '{"all":true}'`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
