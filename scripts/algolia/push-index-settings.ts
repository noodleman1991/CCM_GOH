/**
 * Push `INDEX_SETTINGS` (lib/algolia.ts) to Algolia.
 *
 * Nothing in the app applies index settings — they were set by hand in the
 * Algolia dashboard — so a settings change in code (the tag audit of
 * 2026-09-17 added `tagLabels` as a searchable attribute and `tagSlugs` as a
 * filterOnly facet) has to be pushed explicitly. Same guard as every other
 * index write: outside Vercel production it targets the prefixed scratch
 * indices unless `--allow-production` is passed.
 *
 *   pnpm tsx scripts/algolia/push-index-settings.ts            # prefixed indices
 *   pnpm tsx scripts/algolia/push-index-settings.ts --allow-production
 */
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local" });

async function main() {
  const allowProduction = process.argv.includes("--allow-production");
  const { ALGOLIA_INDICES, liveIndexWritesAllowed, writeIndexName } = await import("@/lib/algolia-indices");
  if (!allowProduction && !liveIndexWritesAllowed()) {
    console.error(
      "Refusing to write live index settings: not Vercel production and ALGOLIA_INDEX_PREFIX is unset. " +
        "Set a prefix, or pass --allow-production deliberately.",
    );
    process.exit(2);
  }
  const { algoliaClient, INDEX_SETTINGS } = await import("@/lib/algolia");
  if (!algoliaClient) {
    console.error("Algolia is not configured (ALGOLIA_APP_ID / ALGOLIA_API_KEY).");
    process.exit(2);
  }
  const targets: Array<[keyof typeof INDEX_SETTINGS, string]> = [
    ["case_studies", ALGOLIA_INDICES.CASE_STUDIES],
    ["agendas", ALGOLIA_INDICES.AGENDAS],
    ["news", ALGOLIA_INDICES.NEWS],
    ["users", ALGOLIA_INDICES.USERS],
  ];
  for (const [key, baseName] of targets) {
    const indexName = allowProduction ? baseName : writeIndexName(baseName);
    const indexSettings = INDEX_SETTINGS[key] as Record<string, unknown>;
    await algoliaClient.setSettings({ indexName, indexSettings });
    console.log(`✓ ${indexName}: ${Object.keys(indexSettings).length} settings keys pushed`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
