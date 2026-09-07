/**
 * Task 9's checkpoint: what `compareRoute` can say about `lived-experiences.ts`,
 * and what it cannot.
 *
 * Nine exports, and only three of them have a route the harness can render:
 *
 *   getLivedExperienceIndex     /[locale]/lived-experiences
 *   getLivedExperienceBySlug    /[locale]/lived-experiences/[slug]
 *   getLivedExperienceSlugs     the same page's generateStaticParams
 *
 * All eight of those routes are in `PARITY_ROUTES` and are compared by
 * `render-diff.ts --domain lived-experiences`. This script covers the rest,
 * and says plainly which are covered by nothing rendered:
 *
 *   getLivedExperienceOgData        /[locale]/lived-experiences/[slug]/og.png —
 *     a PNG, not HTML. `compareRoute` parses a DOM, so it is fetched here and
 *     compared as status + bytes instead.
 *   getAvailableLivedExperienceTags  /[locale]/lived-experiences/submit —
 *   getActiveRegionalCommunities     Clerk-gated: `page.tsx` calls `auth()` and
 *   loadEditableLivedExperience      redirects before any read is issued, so
 *                                    signed out (which the harness is) all
 *                                    three are unreachable. Fetched anyway, to
 *                                    prove both backends return the identical
 *                                    redirect rather than assuming it.
 *   submitLivedExperience            a POST behind `auth()` + a rate limiter.
 *                                    NOT exercised: proving it end to end means
 *                                    creating a real document in the live
 *                                    development database, and this task writes
 *                                    nothing. Covered by unit tests that assert
 *                                    the primitive and the exact patch.
 *   getLivedExperiencesCarousel      a page-builder block. Measured against
 *                                    `production_2` (control agenda = 29): the
 *                                    `lived-experiences-carousel` block appears
 *                                    on ZERO documents, so it renders nowhere.
 *   getLivedExperiencesByRegion      no caller anywhere in the repository.
 *
 * ---------------------------------------------------------------------------
 * Read the diff, not the exit code
 * ---------------------------------------------------------------------------
 *
 * As of Task 9 this script exits 1 on every run, and the reason is not a
 * parity failure. Every rendered route's flight payload carries three React
 * dev-only `D` (debug-info) rows and one Clerk `authPromise` whose value is a
 * promise *index* (`$@12d` against `$@12a`) — an allocation counter that
 * differs between two processes by construction. `render-diff.ts`'s normaliser
 * 5 erases `$<hex>` row references but not `$@<hex>` promise references, and
 * Task 7 recorded that deliberately rather than widening it in passing.
 *
 * So the honest reading of a run is: **the rendered DOM must produce no diff
 * section at all, and the flight diff must contain nothing but those rows.**
 * Measured on 2026-09-07 across all twelve surfaces: zero `rendered DOM`
 * sections, and zero flight lines other than `D"$#"` and `authPromise`.
 * Extending normaliser 5 to `$@` would make the exit code meaningful again and
 * is a one-line change someone should own on purpose.
 *
 * Run (after `render-diff.ts` has been run, or on its own — it starts the same
 * two servers):
 *   `pnpm exec tsx scripts/parity/lived-experiences-check.ts`
 */
import { createHash } from "node:crypto";
import { compareRoute, shutdown } from "./render-diff";
import { routesForDomain } from "./routes";

const SANITY = `http://127.0.0.1:${process.env.PARITY_PORT_SANITY ?? 3991}`;
const PAYLOAD = `http://127.0.0.1:${process.env.PARITY_PORT_PAYLOAD ?? 3992}`;

const LOCALES = ["en", "es", "fr", "ar"] as const;
const SLUG = "lived-experience-3VTei68Svww";

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
      (sanity.location || payload.location ? `   -> ${sanity.location} / ${payload.location}` : "") +
      `   ${sanity.bytes}b ${sanity.hash} / ${payload.bytes}b ${payload.hash}   (${label})\n`,
  );
}

async function main(): Promise<void> {
  try {
    const routes = routesForDomain("lived-experiences");
    process.stdout.write(
      `booting both dev servers, then comparing ${routes.length} rendered route(s) ` +
        `plus ${LOCALES.length * 2} non-HTML surfaces\n\n`,
    );

    for (const route of routes) {
      const started = Date.now();
      const result = await compareRoute(route.path);
      const seconds = ((Date.now() - started) / 1000).toFixed(0);
      if (!result.equal || result.imageSizeMisses.length > 0) failures += 1;
      process.stdout.write(`${result.equal ? "SAME" : "DIFF"} ${seconds}s ${route.path}\n`);
      if (result.diff) process.stdout.write(`${result.diff}\n`);
      for (const miss of result.imageSizeMisses) process.stdout.write(`  image-size miss: ${miss}\n`);
    }

    process.stdout.write("\nthe OG card — a PNG, so compared as bytes rather than as a DOM\n");
    for (const locale of LOCALES) {
      await compareBytes(`/${locale}/lived-experiences/${SLUG}/og.png`, "getLivedExperienceOgData");
    }

    // The submit page goes through `compareRoute`, not `compareBytes`: it is
    // HTML, and a Next dev redirect body carries a stack frame naming the dist
    // directory each server was started with. A byte comparison reports that
    // as a difference; `canonicalise` normalises it (normaliser 6) and still
    // compares the status, the Location header and the DOM.
    process.stdout.write("\nthe submit page — Clerk-gated, so both should be the same redirect\n");
    for (const locale of LOCALES) {
      const path = `/${locale}/lived-experiences/submit`;
      const [result, headers] = await Promise.all([
        compareRoute(path),
        Promise.all([fetchBytes(SANITY, path), fetchBytes(PAYLOAD, path)]),
      ]);
      const sameLocation = headers[0].location === headers[1].location;
      if (!result.equal || !sameLocation) failures += 1;
      process.stdout.write(
        `${result.equal && sameLocation ? "SAME" : "DIFF"} ${path}   ` +
          `HTTP ${headers[0].status}/${headers[1].status}   -> ${headers[0].location} / ${headers[1].location}   ` +
          `(getAvailableLivedExperienceTags + getActiveRegionalCommunities + loadEditableLivedExperience)\n`,
      );
      if (result.diff) process.stdout.write(`${result.diff}\n`);
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
