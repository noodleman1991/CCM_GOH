/**
 * Turns the atlas embed back on for every regional community page whose
 * `atlasEmbed.enabled` is explicitly `false`.
 *
 * The 2026-09-27 import regression (scripts/payload-import/lib/transform.ts's
 * `buildRegionalCommunityPage`) wrote that explicit `false` for every one of
 * the seven regional pages on dev, even though no Sanity source document ever
 * set the field — the schema's own comment
 * (payload/collections/regional-community-pages.ts) says "unset" is what
 * means shown. The renderer
 * (components/templates/regional-community-template.tsx) hides the embed
 * whenever `enabled === false`, so this is what makes those pages lose their
 * atlas. `lib/content/internal/payload/regional-community.ts` already maps a
 * stored `false` back to `null` on the way out (masking the symptom at read
 * time), but the stored value stays wrong and the admin checkbox stays
 * visibly unticked — this script corrects the data itself. Dry run by
 * default; `--execute` writes.
 *
 *   pnpm exec tsx scripts/regional-pages/show-atlas.ts                          # dev dry run
 *   pnpm exec tsx scripts/regional-pages/show-atlas.ts --execute                # dev write
 *   pnpm exec tsx scripts/regional-pages/show-atlas.ts --production [--execute] # PRODUCTION (user only)
 *
 * `atlasEmbed` is not localized (one shared value per page, not per-language
 * arm — confirmed against the dev database), so this reads/writes it once per
 * page rather than once per locale.
 */

export interface RegionalPageAtlasRow {
  id: string;
  slug: string;
  enabled: boolean | null | undefined;
}

/** Pages whose atlas embed is explicitly turned off and should be turned back on. */
export function planShowAtlas(rows: RegionalPageAtlasRow[]): RegionalPageAtlasRow[] {
  return rows.filter((row) => row.enabled === false);
}

type Id = string | number;

async function main() {
  const { assertPayloadDatabase, getPayloadInstance, IMPORT_WRITE_CONTEXT, loadEnv } = await import(
    "../payload-import/lib/runtime"
  );
  await loadEnv();
  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");
  const production = argv.includes("--production") || argv.includes("--allow-production");
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, {
    action: execute ? "show the atlas embed on regional community pages" : "read regional community pages",
    ...(production ? { allowProduction: true } : {}),
  });
  const payload = await getPayloadInstance();

  const docs = (
    await payload.find({
      collection: "regionalCommunityPages",
      pagination: false,
      depth: 0,
      locale: "en",
      overrideAccess: true,
    })
  ).docs as Array<{ id: Id; slug?: string; atlasEmbed?: { enabled?: boolean | null } | null }>;

  const originalId = new Map<string, Id>(docs.map((d) => [String(d.id), d.id]));
  const rows: RegionalPageAtlasRow[] = docs.map((d) => ({
    id: String(d.id),
    slug: d.slug ?? "",
    enabled: d.atlasEmbed?.enabled,
  }));

  const plan = planShowAtlas(rows);
  console.log(`\n${rows.length} regional community pages found; ${plan.length} have the atlas explicitly hidden:`);
  console.table(plan.map((p) => ({ id: p.id, slug: p.slug })));

  if (!execute) {
    console.log("\nDry run only — nothing was written. Re-run with --execute to write.");
    process.exit(0);
  }

  for (const p of plan) {
    await payload.update({
      collection: "regionalCommunityPages",
      id: originalId.get(p.id)!,
      data: { atlasEmbed: { enabled: true } } as never,
      depth: 0,
      overrideAccess: true,
      context: IMPORT_WRITE_CONTEXT,
    });
  }
  console.log(`Updated ${plan.length} regional community pages.`);
  console.log("Done.");
  process.exit(0);
}

if (process.argv[1]?.endsWith("show-atlas.ts")) void main();
