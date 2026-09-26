/**
 * Task 10's checkpoint: what `compareRoute` can say about `news.ts`, and what
 * it cannot.
 *
 * Seventeen exports, and only six of them have a route the harness renders:
 *
 *   getFeaturedNews             /[locale]/news
 *   getRegularNews              /[locale]/news
 *   getApprovedExternalSources  /[locale]/news
 *   getNewsTags                 /[locale]/news  (the only CLIENT-component prop)
 *   getRegionalCommunities      /[locale]/news
 *   getNewsPostBySlug           /[locale]/news/[slug]
 *
 * plus `getNewsSlugs` through that page's `generateStaticParams`. All eight
 * routes are in `PARITY_ROUTES` and are compared by
 * `render-diff.ts --domain news`. This script covers the rest and says plainly
 * which are covered by nothing rendered:
 *
 *   getNewsOgData          /[locale]/news/[slug]/og.png — a PNG, not HTML.
 *     `compareRoute` parses a DOM, so it is fetched here and compared as
 *     status + bytes instead.
 *   getRelatedNews         rendered on the detail page ONLY when the post
 *     carries a tag. The pinned detail route (`cop28-centring-mental-health`)
 *     carries none, and the ONE post that does carry tags
 *     (`climate-change-is-becoming-…`) is the only post with tags at all — so
 *     `count((tags[]->_id)[@ in $tags]) > 0` matches nothing but itself, which
 *     the query excludes. Measured: the related-news section renders on zero
 *     news posts in this dataset. It is fetched here anyway, so the two
 *     backends are at least proved to render the same nothing.
 *   getAllNews             the filtered branch of `/[locale]/news`, reached only
 *     with a query string. Fetched here with `?tags=climate-change`, which is
 *     the one filter value the data can satisfy.
 *   getPublishedNewsIndexDocs   Algolia sync routes. NOT exercised: they are
 *   getNewsIndexDocsByIds       POST handlers that push to a LIVE index, and
 *   getNewsIndexDocById         this task writes nothing. Covered by unit tests
 *   getPublishedNewsCount       that assert the descriptor and the projection.
 *   getNewsSearchRecords        consumed by `system.ts`'s dispatcher; no route.
 *   getNewsPosts           ZERO call sites — `news.ts` documents it as dead.
 *   getDynamicNews         ZERO call sites — the live dynamic-insert path is
 *     `lib/dynamic-queries.ts`, an unrelated generic system.
 *
 * ---------------------------------------------------------------------------
 * Read the diff, not the exit code
 * ---------------------------------------------------------------------------
 *
 * Task 9 recorded the reason and Task 7 owns the fix: every rendered route's
 * flight payload carries React dev-only `D` (debug-info) rows and one Clerk
 * `authPromise` whose value is a promise *index* (`$@15e` against `$@15b`) — an
 * allocation counter that differs between two processes by construction.
 * `render-diff.ts`'s normaliser 5 erases `$<hex>` row references but not
 * `$@<hex>` promise references.
 *
 * Task 10 adds one more of the same kind, and it is NOT normalised either:
 * **Portable Text block keys.** Sanity stores a random `_key` per block
 * (`1bae7`); the Lexical converter mints its own (`pts7y3w4`). That is
 * Phase-2 obligation 7, already accepted for heading anchors. React uses the
 * key as its `key` prop, so it appears in the flight payload — and nowhere in
 * the DOM, which is why the rendered output is identical.
 *
 * So the honest reading of a run is: **the rendered DOM must produce no diff
 * section at all, and the flight diff must contain nothing but those rows.**
 *
 * Run:
 *   `pnpm exec tsx scripts/parity/news-check.ts`
 */
import { createHash } from "node:crypto";
import { compareRoute, shutdown } from "./render-diff";
import { routesForDomain } from "./routes";

const SANITY = `http://127.0.0.1:${process.env.PARITY_PORT_SANITY ?? 3991}`;
const PAYLOAD = `http://127.0.0.1:${process.env.PARITY_PORT_PAYLOAD ?? 3992}`;

const LOCALES = ["en", "es", "fr", "ar"] as const;
const SLUG = "cop28-centring-mental-health";
/** The only news post carrying tags, and the only one carrying an image. */
const TAGGED_SLUG = "climate-change-is-becoming-a-mental-health-crisis-and-communities-are-already-living-it";

let failures = 0;

async function fetchBytes(base: string, path: string) {
  const response = await fetch(base + path, { redirect: "manual" });
  const body = Buffer.from(await response.arrayBuffer());
  return {
    status: response.status,
    location: response.headers.get("location"),
    bytes: body.length,
    hash: createHash("sha256").update(body).digest("hex").slice(0, 12),
  };
}

/** Compare a non-HTML response byte for byte. */
async function compareBytes(path: string, label: string): Promise<void> {
  const [sanity, payload] = await Promise.all([fetchBytes(SANITY, path), fetchBytes(PAYLOAD, path)]);
  const same =
    sanity.status === payload.status && sanity.location === payload.location && sanity.hash === payload.hash;
  if (!same) failures += 1;
  process.stdout.write(
    `${same ? "SAME" : "DIFF"} ${path}   HTTP ${sanity.status}/${payload.status}` +
      `   ${sanity.bytes}b ${sanity.hash} / ${payload.bytes}b ${payload.hash}   (${label})\n`,
  );
}

async function compareHtml(path: string, label: string): Promise<void> {
  const started = Date.now();
  const result = await compareRoute(path);
  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  if (!result.equal || result.imageSizeMisses.length > 0) failures += 1;
  process.stdout.write(`${result.equal ? "SAME" : "DIFF"} ${seconds}s ${path}   (${label})\n`);
  if (result.diff) process.stdout.write(`${result.diff}\n`);
  for (const miss of result.imageSizeMisses) process.stdout.write(`  image-size miss: ${miss}\n`);
}

async function main(): Promise<void> {
  try {
    const routes = routesForDomain("news");
    process.stdout.write(
      `booting both dev servers, then comparing ${routes.length} registered route(s) ` +
        `plus ${LOCALES.length * 3} surfaces the route list does not reach\n\n`,
    );

    for (const route of routes) await compareHtml(route.path, route.domain);

    process.stdout.write("\nthe OG card — a PNG, so compared as bytes rather than as a DOM\n");
    for (const locale of LOCALES) await compareBytes(`/${locale}/news/${SLUG}/og.png`, "getNewsOgData");

    process.stdout.write("\nthe filtered index — getAllNews, reachable only with a query string\n");
    for (const locale of LOCALES) {
      await compareHtml(`/${locale}/news?tags=climate-change`, "getAllNews + getApprovedExternalSources");
    }

    process.stdout.write("\nthe one news post carrying tags — where getRelatedNews would render\n");
    for (const locale of LOCALES) {
      await compareHtml(`/${locale}/news/${TAGGED_SLUG}`, "getNewsPostBySlug + getRelatedNews + the only image");
    }

    process.stdout.write(`\n${failures === 0 ? "all surfaces identical" : `${failures} surface(s) differed`}\n`);
  } finally {
    await shutdown();
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown().then(() => process.exit(130));
  });
}
await main();
