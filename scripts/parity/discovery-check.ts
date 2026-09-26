/**
 * Task 13's checkpoint: what `compareRoute` can say about `discovery.ts`, and
 * what it cannot.
 *
 * Nineteen exports, and **one** of them reaches a rendered HTML page a
 * signed-out visitor can load:
 *
 *   getEvents (list mode)   /[locale]/collaborate/events
 *
 * That route is in `PARITY_ROUTES` and is compared by
 * `render-diff.ts --domain discovery`. It is a thin checkpoint on purpose —
 * `events` is 0 documents in both stores, so what it proves is that both
 * backends answer the same empty list rather than one of them 500ing. This
 * script covers the rest, and says plainly which are covered by nothing
 * rendered.
 *
 * ---------------------------------------------------------------------------
 * Reached here, over HTTP, on both backends
 * ---------------------------------------------------------------------------
 *
 *   getDynamicContent   `/api/dynamic-content` — a JSON route, so it is
 *     compared as bytes rather than as a DOM. All six (kind, mode) pairs the
 *     dispatcher declares, against `oceania`, which is the one community with
 *     data on more than one of them (1 news post, 2 approved case studies, 0
 *     lived experiences — `relatedCommunity` is 0/35 on published lived
 *     experiences, so the two livedExperience queries return [] on both
 *     backends by construction).
 *
 *   getEvents (detail)  `/[locale]/collaborate/events/<slug>` — there are no
 *     events, so the page calls `notFound()` on both backends. Compared for
 *     status parity, which is what catches a reader that threw instead of
 *     returning []. (Measured: both answer HTTP 200 — the route is
 *     `force-dynamic` and streams, so the not-found UI arrives inside an
 *     already-committed 200 rather than as a 404 status. Identical on both,
 *     which is the property being checked.)
 *
 * ---------------------------------------------------------------------------
 * Reached by NO rendered route, on either backend
 * ---------------------------------------------------------------------------
 *
 * Eleven of the nineteen, and each for a reason worth writing down rather than
 * discovering later:
 *
 *   getDiscoveryOptions      its only consumer is `lib/discovery/options.ts`'s
 *     `resolveDiscoveryOptions`, which has **zero importers** repo-wide.
 *   getNewsPostsForBlock     the `all-posts` block. Measured: **no document in
 *     the dataset carries one** — `*[count(blocks[_type=="all-posts"])>0]` is
 *     empty, and so is the same query over `content`, `sections`, `body`,
 *     `pageBuilder` and `layout`. The block has no page to render on.
 *   getForYouCandidates      `/dashboard`, Clerk-gated and on the harness's
 *     excluded list.
 *   getDocSlugs              a public collaboration workspace page.
 *   getOutputSummaries       an authenticated workspace page.
 *   getOutputStatuses        a Prisma refresh path, not a render.
 *   createWorkspaceOutputDraft   a server action.
 *   resolveCommentTarget     the comments API, on POST.
 *   getModerationSettings    the same, one layer down.
 *   getEditableEventDoc      the authenticated event edit form.
 *   getEventEditGate / submitEvent / updateEvent   `/api/events/submit`, a POST.
 *   getApprovedEventForRsvp  a server action.
 *   getEventsStartingWithin  a cron route.
 *   fetchDynamicCaseStudies / fetchDynamicLivedExperiences   **zero importers**
 *     anywhere in app/components/lib, as `discovery.ts`'s own header records.
 *
 * Every one of them is covered by the primitive- and descriptor-asserting
 * tests in `lib/__tests__/content-discovery.test.ts`, and by nothing else. **No
 * write was executed against the database** — the three write paths
 * (`submitEvent`, `updateEvent`, `createWorkspaceOutputDraft`) are covered by
 * mocked-primitive tests alone.
 *
 * ---------------------------------------------------------------------------
 * Read the diff, not the exit code
 * ---------------------------------------------------------------------------
 *
 * Every rendered route's flight payload carries React dev-only `D`
 * (debug-info) rows and one Clerk `authPromise` whose value is a promise
 * *index* — an allocation counter that differs between two processes by
 * construction. `render-diff.ts` erases `$<hex>` row references but not
 * `$@<hex>` promise references, so a route can report DIFF on nothing but
 * those. Task 7 owns that; it is noise, and it is the only noise accepted here.
 *
 * Run:
 *   `pnpm exec tsx scripts/parity/discovery-check.ts`
 */
import { createHash } from "node:crypto";
import { compareRoute, shutdown } from "./render-diff";
import { routesForDomain } from "./routes";

const SANITY = `http://127.0.0.1:${process.env.PARITY_PORT_SANITY ?? 3991}`;
const PAYLOAD = `http://127.0.0.1:${process.env.PARITY_PORT_PAYLOAD ?? 3992}`;

/** The six (kind, mode) pairs `lib/dynamic-queries.ts` dispatches on. */
const QUERY_TYPES = [
  "recentNews",
  "featuredNews",
  "recentCaseStudies",
  "featuredCaseStudies",
  "recentLivedExperiences",
  "featuredLivedExperiences",
] as const;

/** `oceania` carries data on two of the three kinds; the others are checked so
 *  an empty answer on one backend and a populated one on the other cannot hide
 *  behind a community that is empty everywhere. */
const COMMUNITIES = ["oceania", "central-and-southern-asia", "sub-saharan-africa"] as const;

let failures = 0;

async function fetchBody(base: string, path: string) {
  const response = await fetch(base + path, { redirect: "manual" });
  const body = Buffer.from(await response.arrayBuffer());
  return {
    status: response.status,
    bytes: body.length,
    text: body.toString("utf8"),
    hash: createHash("sha256").update(body).digest("hex").slice(0, 12),
  };
}

/** Compare a non-HTML response byte for byte, printing the first divergence. */
async function compareJson(path: string, label: string): Promise<void> {
  const [sanity, payload] = await Promise.all([fetchBody(SANITY, path), fetchBody(PAYLOAD, path)]);
  const same = sanity.status === payload.status && sanity.hash === payload.hash;
  if (!same) failures += 1;
  process.stdout.write(
    `${same ? "SAME" : "DIFF"} ${path}   HTTP ${sanity.status}/${payload.status}` +
      `   ${sanity.bytes}b/${payload.bytes}b   (${label})\n`,
  );
  if (!same) {
    // The raw bodies are thousands of bytes of image metadata, so what is
    // printed is the set of JSON PATHS that differ. That is what makes a run
    // readable enough to classify every difference rather than skim it — and
    // it hides nothing: a changed value shows up as its own path.
    for (const line of jsonPathDiff(sanity.text, payload.text)) {
      process.stdout.write(`  ${line}\n`);
    }
  }
}

/** Every leaf path present on one side and not the other, or present on both
 *  with different values. Arrays are indexed, so a reordering shows as a value
 *  difference at each position rather than as nothing. */
function jsonPathDiff(a: string, b: string, limit = 40): string[] {
  const left = flatten(safeParse(a));
  const right = flatten(safeParse(b));
  const lines: string[] = [];
  for (const key of new Set([...left.keys(), ...right.keys()])) {
    const l = left.get(key);
    const r = right.get(key);
    if (l === r) continue;
    if (l === undefined) lines.push(`+ ${key} = ${truncate(r)}`);
    else if (r === undefined) lines.push(`- ${key} = ${truncate(l)}`);
    else lines.push(`~ ${key}: ${truncate(l)} -> ${truncate(r)}`);
  }
  lines.sort();
  return lines.length > limit ? [...lines.slice(0, limit), `  … ${lines.length - limit} more`] : lines;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function flatten(value: unknown, prefix = "", into = new Map<string, string>()): Map<string, string> {
  if (value && typeof value === "object") {
    const entries = Array.isArray(value)
      ? value.map((v, i) => [String(i), v] as const)
      : Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) into.set(prefix, Array.isArray(value) ? "[]" : "{}");
    for (const [key, child] of entries) flatten(child, prefix ? `${prefix}.${key}` : key, into);
    return into;
  }
  into.set(prefix, JSON.stringify(value) ?? "undefined");
  return into;
}

function truncate(value: string | undefined, max = 70): string {
  if (value === undefined) return "<absent>";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

async function compareStatus(path: string, label: string): Promise<void> {
  const [sanity, payload] = await Promise.all([fetchBody(SANITY, path), fetchBody(PAYLOAD, path)]);
  const same = sanity.status === payload.status;
  if (!same) failures += 1;
  process.stdout.write(
    `${same ? "SAME" : "DIFF"} ${path}   HTTP ${sanity.status}/${payload.status}   (${label})\n`,
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
    const routes = routesForDomain("discovery");
    process.stdout.write(
      `booting both dev servers, then comparing ${routes.length} registered route(s) ` +
        `plus ${QUERY_TYPES.length * COMMUNITIES.length + 1} surfaces the route list does not reach\n\n`,
    );

    for (const route of routes) await compareHtml(route.path, "getEvents (list)");

    process.stdout.write("\nthe dynamic-content inserts — a JSON route, compared as bytes\n");
    for (const community of COMMUNITIES) {
      for (const queryType of QUERY_TYPES) {
        await compareJson(
          `/api/dynamic-content?queryType=${queryType}&communitySlug=${community}&count=7`,
          "getDynamicContent",
        );
      }
    }

    process.stdout.write("\nthe event detail page — 0 events, so notFound() on both\n");
    await compareStatus("/en/collaborate/events/no-such-event", "getEvents (slug) — notFound() on both");

    process.stdout.write(
      `\n${failures === 0 ? "all surfaces identical" : `${failures} surface(s) differed`}\n`,
    );
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
