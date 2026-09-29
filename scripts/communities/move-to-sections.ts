/**
 * Moves each regional community's page from its old Community page onto its
 * Regional community record, as Sections (CMS project 3,
 * docs/superpowers/specs/2026-09-28-communities-on-sections-design.md §3.5).
 *
 *   pnpm exec tsx scripts/communities/move-to-sections.ts [--only=<slug>]         # dev dry run
 *   pnpm exec tsx scripts/communities/move-to-sections.ts --execute               # dev write
 *   pnpm exec tsx scripts/communities/move-to-sections.ts --revert                # empty the lists → old pages
 *   … --production [--execute]                                                    # PRODUCTION (user only)
 *
 * Dry run by default. A community that already has sections is skipped unless
 * `--replace`. The old Community pages are never touched; nothing is deleted.
 */
import { planCommunitySections } from "./plan";
import { guardExisting, toLocaleData, withIdsFrom } from "../homepage/write";

type Row = Record<string, unknown>;
const LOCALES = ["en", "es", "fr", "ar"] as const;
const KIND_COLLECTION: Record<string, string> = {
  agendas: "agendas",
  caseStudies: "caseStudies",
  newsPosts: "newsPosts",
  livedExperiences: "livedExperiences",
};

const cell = (v: unknown, width: number) => String(v ?? "—").replace(/\s+/g, " ").slice(0, width).padEnd(width);
const idOf = (v: unknown): string | null =>
  v && typeof v === "object" ? idOf((v as Row).id) : typeof v === "number" ? String(v) : typeof v === "string" && v ? v : null;

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
    action: revert ? "put community pages back on their old layout" : execute ? "move community pages onto their records" : "read community pages",
    ...(production ? { allowProduction: true } : {}),
  });
  const payload = await getPayloadInstance();
  const context = IMPORT_WRITE_CONTEXT;

  const communities = (await payload.find({ collection: "regionalCommunities", pagination: false, depth: 0, locale: "all", draft: false }))
    .docs as unknown as Row[];
  const bySlugOrId = (id: string) => communities.find((c) => String(c.id) === id);

  if (revert) {
    for (const c of communities) {
      if (only && c.slug !== only) continue;
      await payload.update({ collection: "regionalCommunities", id: String(c.id), locale: "en", draft: false, data: { sections: [], layoutPerLanguage: false, _status: "published" } as never, context });
      for (const locale of LOCALES) {
        await payload.update({ collection: "regionalCommunities", id: String(c.id), locale, draft: false, data: { sectionsByLanguage: [], _status: "published" } as never, context });
      }
      console.log(`${c.slug}: back on its old page.`);
    }
    console.log("Clear the site cache so visitors see it.");
    process.exit(0);
  }

  const pages = (await payload.find({ collection: "regionalCommunityPages", pagination: false, depth: 0, locale: "all", draft: false }))
    .docs as unknown as Row[];

  // Which logo pictures still exist (the old page hid logos whose media is gone).
  const logoIds = new Set<string>();
  for (const page of pages) {
    const slot = page.logoCloud as Row | undefined;
    for (const arm of slot ? Object.values(slot) : []) {
      const images = arm && typeof arm === "object" ? (arm as Row).images : null;
      for (const image of Array.isArray(images) ? (images as Row[]) : []) {
        const id = idOf(image.asset);
        if (id) logoIds.add(id);
      }
    }
  }
  const media = logoIds.size
    ? await payload.find({ collection: "media", where: { id: { in: [...logoIds] } }, depth: 0, limit: logoIds.size, select: { id: true } as never })
    : { docs: [] };
  const existingMedia = new Set((media.docs as Row[]).map((d) => String(d.id)));

  let failures = 0;
  for (const page of pages) {
    const communityId = idOf(page.regionalCommunity);
    const community = communityId ? bySlugOrId(communityId) : undefined;
    if (!community) {
      console.log(`\n${page.slug}: no linked Regional community — skipped.`);
      continue;
    }
    if (only && community.slug !== only) continue;

    console.log(`\n=== ${community.slug} ===`);
    const refusal = guardExisting(Array.isArray(community.sections) ? community.sections : [], { replace });
    if (refusal) {
      console.log(`  ${refusal}`);
      continue;
    }

    const plan = planCommunitySections(page, typeof community.region === "string" ? community.region : null, {
      mediaExists: (id) => existingMedia.has(id),
    });

    // Which picks still exist and are published.
    // One query per kind, not per pick.
    const missing: string[] = [];
    const byKind = new Map<string, string[]>();
    for (const pick of plan.picks) byKind.set(pick.kind, [...(byKind.get(pick.kind) ?? []), pick.id]);
    for (const [kind, ids] of byKind) {
      const collection = KIND_COLLECTION[kind];
      const found = collection
        ? await payload.find({ collection: collection as never, where: { id: { in: ids } }, depth: 0, limit: ids.length, draft: false, select: { id: true } as never })
        : { docs: [] };
      const present = new Set((found.docs as Row[]).map((d) => String(d.id)));
      for (const id of ids) if (!present.has(id)) missing.push(`${kind}:${id}`);
    }

    plan.sections.forEach((s, i) => {
      const heading = (s.heading ?? s.title) as Record<string, unknown> | undefined;
      const chapter = (s.chapter as { kind?: string } | undefined)?.kind;
      const langs = LOCALES.map((l) => cell(heading?.[l], 18)).join(" | ");
      console.log(`  ${cell(i + 1, 3)} ${cell(s.blockType, 17)} ${cell(chapter, 12)} ${langs}`);
    });
    if (missing.length) console.log(`  Picks that no longer exist or aren't published (the feed will skip them): ${missing.join(", ")}`);
    for (const d of plan.differences) console.log(`  Differed between languages (English kept): ${d.section} · ${d.path} · ${JSON.stringify(d.values)}`);
    for (const note of plan.notes) console.log(`  Note: ${note}`);

    if (!execute) continue;

    try {
      const meta = {
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        noindex: page.noindex === true,
      };
      const id = String(community.id);
      await payload.update({
        collection: "regionalCommunities",
        id,
        locale: "en",
        draft: false,
        data: {
          layoutPerLanguage: false,
          sections: toLocaleData(plan.sections, "en"),
          ...(toLocaleData([meta], "en")[0] as Row),
          _status: "published",
        } as never,
        context,
      });
      const saved = (await payload.findByID({ collection: "regionalCommunities", id, locale: "en", depth: 0, draft: false })) as unknown as Row;
      for (const locale of ["es", "fr", "ar"] as const) {
        await payload.update({
          collection: "regionalCommunities",
          id,
          locale,
          draft: false,
          data: {
            sections: withIdsFrom(saved.sections, toLocaleData(plan.sections, locale)),
            ...(toLocaleData([meta], locale)[0] as Row),
            _status: "published",
          } as never,
          context,
        });
      }
      console.log(`  Done: ${plan.sections.length} sections written.`);
    } catch (error) {
      failures++;
      console.error(`  FAILED for ${community.slug}:`, error);
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
