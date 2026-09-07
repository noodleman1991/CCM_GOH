/**
 * Render one route on both content backends and diff what comes out.
 *
 * Phase 3 moves sixteen domain modules from Sanity to Payload, and the spec's
 * checkpoint for every one of them is a rendered-page comparison, because a
 * green build is not validation. This file is that comparison. Tasks 6–14 are
 * verified by it, so it has one obligation above all others: **it must be able
 * to fail**. Phase 2 shipped a verifier that reported 19/19 while every string
 * in the database could have said "WRONG" — it compared presence, not value —
 * and a harness that cannot fail is worse than none, because it converts
 * "unverified" into "verified". Every normaliser below is therefore narrow,
 * says what it hides, and is covered by a test proving it does not swallow a
 * real change (`lib/__tests__/parity-harness.test.ts`).
 *
 * ---------------------------------------------------------------------------
 * How two backends get rendered
 * ---------------------------------------------------------------------------
 *
 * **Two `next dev` servers, one per backend, started once and kept alive for
 * the life of the process.** `activeBackend()` reads `process.env` at call
 * time, and `process.env` is process-wide, so one server cannot answer for
 * both backends without racing itself on concurrent requests. That leaves
 * three options:
 *
 *   - *One server, restarted between passes.* Correct, and it costs a Next
 *     boot every time the comparison switches backend — which `compareRoute`
 *     does once per route. Tasks 6–14 call this many times.
 *   - *An in-process render.* The App Router has no supported programmatic
 *     render entry point, and `next({conf})` skips `next.config.mjs`, which
 *     would drop `withPayload`, `next-intl` and the CSP headers — i.e. it
 *     would compare something that is not the site.
 *   - *Two servers.* Chosen. One boot each per process, then every subsequent
 *     comparison is two HTTP fetches. Each keeps its own Turbopack cache, so
 *     the caches stay warm on disk between runs.
 *
 * `pnpm build` is not an option at all: its `postbuild` pushes to a **live**
 * Algolia index.
 *
 * Two dev servers cannot share `.next` — they corrupt each other's Turbopack
 * cache, and a poisoned `.next/dev/cache` in this repo shows up as existing
 * routes 404ing with an HTML body. So each gets its own via `NEXT_DIST_DIR`
 * (`next.config.mjs`), which also keeps the harness clear of whatever dev
 * server the developer already has running. Next rewrites `tsconfig.json`'s
 * `include` when it sees an unfamiliar dist dir; `restoreTsconfig()` takes
 * those entries back out on the way down.
 *
 * ---------------------------------------------------------------------------
 * What is compared
 * ---------------------------------------------------------------------------
 *
 * Two views of the same response, both required to match:
 *
 *   1. **The reconciled DOM.** The markup a browser would end up with after
 *      React splices in its out-of-order Suspense chunks — every heading, list
 *      item, `href`, `src`, attribute and text node, from server *and* client
 *      components (client components are server-rendered into this HTML too).
 *   2. **The RSC flight payload.** Compared as a sorted multiset of its rows.
 *      This exists because the DOM alone has a hole: a prop handed to a client
 *      component that renders nothing until the user interacts — a drawer's
 *      contents, a filter's options, an `initialData` array — never reaches
 *      the HTML, but a swap that dropped it would be a real regression. The
 *      flight payload carries it.
 *
 * The status code is compared first and forms the first line of both views: a
 * 404 on one backend and a 200 on the other is the largest difference there
 * is, and it must not be reported as "the body differs".
 *
 * ---------------------------------------------------------------------------
 * The four normalisers, and what each one hides
 * ---------------------------------------------------------------------------
 *
 * Nothing here was added pre-emptively. Each was added after watching two
 * renders of the same route differ by it, and nothing else was added: no
 * nonce, timestamp or React-id normaliser exists, because across eleven routes
 * and four locales none of those ever differed. (This app sets no CSP nonce —
 * `next.config.mjs` uses `'unsafe-inline'` — and `useId` values are derived
 * from tree position, so they match whenever the trees do.)
 *
 * **1. Suspense reconciliation.** React streams a boundary's content out of
 * order as `<div hidden id="S:n">…</div>` plus an `$RC("B:n","S:n")` call, to
 * be spliced over the `<template id="B:n">` placeholder. Whether a boundary
 * resolves inline or streams depends purely on how fast its data arrived, and
 * it was observed to differ between a cold render and a warm one of the *same*
 * route on the *same* server. This does not hide anything: it *restores*
 * content to the position the browser would put it in. Content that never
 * arrives is not reconciled and stays visibly missing.
 *
 * **2. Scripts, templates and noscript are dropped from the DOM view.** What
 * they hold is React's inline runtime and the flight payload — and the flight
 * payload is not discarded, it is compared separately as view 2. Nothing that
 * only a `<script>` carries goes uncompared.
 *
 * **3. Head hoisting, and ordering within the head.** Late-streamed `<title>`
 * and `<meta>` elements arrive inside a hidden `<div>` in the body and are
 * hoisted into `<head>` by the browser; whether they stream at all is a timing
 * difference, and the two backends will not have identical timing. So head
 * elements are hoisted, and then **`<title>`, `<meta>` and non-stylesheet
 * `<link>` are sorted** — none of them renders in document order. Stylesheet
 * links are deliberately **not** sorted: their order is the CSS cascade, which
 * is a rendering difference. This hides the ordering of metadata only; a
 * changed `og:image`, a changed title, an added or removed `<meta>` all still
 * diff.
 *
 * **4. `/_next/static/…` URLs are collapsed in the flight payload.** Turbopack
 * names its dev chunks per dist dir, so the two servers produce different
 * filenames for byte-identical code (measured: `…_0amgfhw._.js` against
 * `…_0_9_eqb._.js`). Only the `/_next/static/` prefix is collapsed. This
 * cannot mask content: image URLs are `/_next/image?url=…`, a different prefix
 * that is left exactly as it is — which is what makes a changed image URL
 * diff — and media URLs are `cdn.sanity.io/…` or `/payload-api/media/file/…`.
 *
 * **5. Flight-payload row indices are erased.** A flight row is
 * `<index>:<value>`, and values point at other rows by `$<index>`. Those
 * indices are an allocation counter over the order React happened to resolve
 * things in: two renders of `/en/communities/central-and-southern-asia` on the
 * *same* server, warm, emitted the same values under `$17a` and `$1b3`. So the
 * leading index and every `$<index>` reference are replaced by a placeholder,
 * and rows are then compared as a sorted multiset — by content, not by
 * position. What this hides is the *topology* of the flight graph: which row
 * holds which value, and therefore the order rows appear in. What it keeps is
 * every value, so a changed, added or removed prop still changes the multiset.
 * Order is not lost from the comparison as a whole — view 1 compares the
 * rendered tree in full document order, and this view exists only to cover the
 * props view 1 cannot see.
 *
 * ---------------------------------------------------------------------------
 * Settling, and why a single render is not enough
 * ---------------------------------------------------------------------------
 *
 * A cold render and a warm render of the same route on the same server can
 * differ in Suspense flush order in ways reconciliation alone does not settle.
 * So each backend is rendered until two consecutive renders agree, at most
 * `SETTLE_ATTEMPTS` times. A backend that never settles is reported as
 * `stable: false` and the comparison is **not** called equal — instability is
 * a result, not something to retry away. This cannot hide a cross-backend
 * difference: the comparison still runs on real, settled output.
 *
 * ---------------------------------------------------------------------------
 * Image-size misses (Task 4)
 * ---------------------------------------------------------------------------
 *
 * `lib/content/internal/payload-image-source.ts` warns once per distinct
 * unserved transform request, on the server that rendered the page. The
 * harness owns that server's stdio, so it scrapes `[payload-image-source]`
 * lines emitted while a Payload render is in flight and returns them on the
 * result; the CLI exits non-zero on any of them. A size miss must fail loudly
 * during comparison rather than reach production. Note the warning fires once
 * per distinct request per server process, so within a single run a miss is
 * attributed to the first route that provoked it — the run starts both servers
 * fresh, so no miss from an earlier run is ever missing from this one.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import { PARITY_ROUTES, EXCLUDED_ROUTES, routesForDomain, type ParityRoute } from "./routes";

// ===========================================================================
// Canonicalisation — pure, and therefore testable without a server
// ===========================================================================

export interface CanonicalRender {
  /** The reconciled DOM, one node per line, indented by depth. */
  dom: string[];
  /** The RSC flight payload's rows, sorted. */
  flight: string[];
}

/**
 * Splice React's out-of-order Suspense chunks into the tree.
 *
 * `$RC(boundary, holder)` replaces everything between the boundary's
 * `<!--$?-->` and `<!--/$-->` comments with the holder's children. In a parsed
 * document the placeholder `<template id="B:n">` is the anchor, and the
 * fallback markup sits beside it — so the template is replaced by the holder's
 * children and any sibling fallback between the boundary comments is dropped,
 * exactly as the browser would. Nested boundaries need more than one pass.
 */
function reconcileSuspense(doc: Document): void {
  const N = 50;
  for (let pass = 0; pass < N; pass++) {
    const holders = [...doc.querySelectorAll('div[hidden][id^="S:"],div[hidden][id^="P:"]')];
    let moved = 0;
    for (const holder of holders) {
      const template = doc.getElementById(`B:${holder.id.slice(2)}`);
      if (!template?.parentNode) continue;
      dropFallbackAround(template);
      const fragment = doc.createDocumentFragment();
      while (holder.firstChild) fragment.appendChild(holder.firstChild);
      template.parentNode.replaceChild(fragment, template);
      holder.remove();
      moved += 1;
    }
    if (moved === 0) return;
  }
}

/**
 * Remove the pending boundary's fallback — the skeletons between `<!--$?-->`
 * and `<!--/$-->` — so the resolved content replaces it rather than joining
 * it. Leaving both would show a route's loading skeleton as extra content on
 * whichever backend happened to be slower, which is a timing difference
 * masquerading as a content one.
 */
function dropFallbackAround(template: Element): void {
  const COMMENT = 8;
  const doomed: ChildNode[] = [];
  for (let node = template.nextSibling; node; node = node.nextSibling) {
    if (node.nodeType === COMMENT && node.textContent === "/$") break;
    doomed.push(node);
  }
  for (const node of doomed) node.remove();
}

/** Head elements whose position in `<head>` is load-bearing. Stylesheet order
 *  is the CSS cascade; everything else in the head renders nothing. */
function isCascadeBearing(element: Element): boolean {
  return element.tagName === "LINK" && (element.getAttribute("rel") ?? "").toLowerCase() === "stylesheet";
}

function hoistHead(doc: Document): void {
  for (const element of [...doc.body.querySelectorAll("title,meta,link")]) doc.head.appendChild(element);
}

/** One line per node: `<tag attr="…" …>` with attributes sorted by name, and
 *  `#text …` for non-empty text. Attribute *order* is not rendered by any
 *  browser, so sorting it removes serialisation noise without touching a
 *  single value; every value is still compared, verbatim. */
function serialiseTree(node: Node, depth: number, out: string[]): void {
  const TEXT = 3;
  const ELEMENT = 1;
  for (const child of node.childNodes) {
    if (child.nodeType === TEXT) {
      const text = (child.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) out.push(`${"  ".repeat(depth)}#text ${text}`);
    } else if (child.nodeType === ELEMENT) {
      const element = child as Element;
      const attributes = [...element.attributes]
        .map((a) => `${a.name}=${JSON.stringify(a.value.replace(/\s+/g, " ").trim())}`)
        .sort();
      out.push(
        `${"  ".repeat(depth)}<${element.tagName.toLowerCase()}${attributes.length ? ` ${attributes.join(" ")}` : ""}>`,
      );
      serialiseTree(element, depth + 1, out);
    }
  }
}

/**
 * The RSC flight payload, as rows.
 *
 * Next emits it as a sequence of `self.__next_f.push([1,"…"])` string chunks
 * that concatenate into newline-separated rows. Rows are sorted because their
 * emission order is a streaming artefact — two renders of the same route on
 * the same server were observed to emit the same rows in a different order —
 * and no row's meaning depends on where it appears; each names its own index.
 */
export function extractFlight(html: string): string[] {
  const push = /self\.__next_f\.push\(\[1,\s*("(?:[^"\\]|\\.)*")\]\)/g;
  let joined = "";
  for (let m = push.exec(html); m; m = push.exec(html)) joined += JSON.parse(m[1]) as string;
  return splitFlightRows(joined)
    .map((row) =>
      row
        // Normaliser 4. Only the `/_next/static/` prefix; `/_next/image?url=…`,
        // which carries the source image, is untouched.
        .replace(/\/_next\/static\/[^"\\\s]*/g, "/_next/static/*")
        // Normaliser 5, in two halves: a row's own index, and every reference
        // to one. See the header — these are an allocation counter, not
        // content, and they were measured renumbering between two renders of
        // the same route on the same server.
        .replace(/^[0-9a-f]*:/, "#:")
        .replace(/\$L?[0-9a-f]{1,8}(?![0-9a-zA-Z_])/g, "$$#"),
    )
    .sort();
}

/**
 * Split the concatenated flight stream into rows.
 *
 * Rows are `<hex id>:<tag><payload>` and are newline-terminated — **except**
 * `T`, which is length-prefixed: `<id>:T<hex byte length>,<that many bytes>`.
 * Its payload is raw text that may itself contain newlines, and it is where
 * this app's `blurDataURL` data URIs live. Splitting the stream on `\n` glues
 * the *next* row's index onto the end of a `T` row, which then survives the
 * index normaliser and reports a difference on every render — measured, on
 * `/en/communities/central-and-southern-asia`, where two renders on the same
 * server disagreed about nothing but that glued index.
 */
function splitFlightRows(stream: string): string[] {
  const rows: string[] = [];
  let cursor = 0;
  while (cursor < stream.length) {
    const colon = stream.indexOf(":", cursor);
    if (colon < 0) {
      rows.push(stream.slice(cursor));
      break;
    }
    const id = stream.slice(cursor, colon);
    const body = colon + 1;
    if (stream[body] === "T") {
      const comma = stream.indexOf(",", body);
      const length = comma > 0 ? Number.parseInt(stream.slice(body + 1, comma), 16) : Number.NaN;
      if (comma > 0 && Number.isFinite(length)) {
        const end = advanceByBytes(stream, comma + 1, length);
        rows.push(`${id}:${stream.slice(body, end)}`);
        cursor = stream[end] === "\n" ? end + 1 : end;
        continue;
      }
    }
    const newline = stream.indexOf("\n", body);
    const end = newline < 0 ? stream.length : newline;
    if (end > body || id.length > 0) rows.push(`${id}:${stream.slice(body, end)}`);
    cursor = end + 1;
  }
  return rows.filter((row) => row !== ":");
}

/** The offset `bytes` UTF-8 bytes after `from`. React counts bytes; a JS string
 *  index counts UTF-16 code units, and the two part company on any non-ASCII
 *  character — of which the Arabic locale has rather a lot. */
function advanceByBytes(stream: string, from: number, bytes: number): number {
  let remaining = bytes;
  let index = from;
  while (index < stream.length && remaining > 0) {
    const code = stream.codePointAt(index)!;
    const width = code > 0xffff ? 2 : 1;
    remaining -= code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    index += width;
  }
  return index;
}

/** Turn one HTTP response into the two comparable views. */
export function canonicalise(html: string, status = 200): CanonicalRender {
  const doc = new JSDOM(html).window.document;
  reconcileSuspense(doc);
  for (const element of [...doc.querySelectorAll("script,template,noscript")]) element.remove();
  hoistHead(doc);

  // Normaliser 3: sort the head, but keep the cascade. Re-serialise the two
  // groups separately so a stylesheet's position among stylesheets survives.
  const cascade: string[] = [];
  const rest: string[] = [];
  {
    const sheets = [...doc.head.children].filter(isCascadeBearing);
    const others = [...doc.head.children].filter((el) => !isCascadeBearing(el));
    for (const el of sheets) serialiseOne(el, cascade);
    for (const el of others) serialiseOne(el, rest);
    rest.sort();
  }

  const body: string[] = [];
  serialiseTree(doc.body, 1, body);

  return {
    dom: [`HTTP ${status}`, "<head>", ...cascade, ...rest, "<body>", ...body],
    flight: extractFlight(html),
  };
}

function serialiseOne(element: Element, out: string[]): void {
  const holder = element.ownerDocument.createElement("div");
  holder.appendChild(element.cloneNode(true));
  serialiseTree(holder, 1, out);
}

// ===========================================================================
// Diffing
// ===========================================================================

/**
 * A unified-ish line diff over the canonical lines.
 *
 * Common prefix and suffix are trimmed first, which on a real page reduces a
 * thousand-line document to the handful of lines that actually moved; the
 * remaining window gets an LCS so the report names *what* changed rather than
 * where the two sequences fell out of step. Very large windows fall back to a
 * positional comparison rather than allocating an n×m table.
 */
export function diffLines(a: string[], b: string[], label: string, limit = 60): string {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end += 1;
  const left = a.slice(start, a.length - end);
  const right = b.slice(start, b.length - end);
  if (left.length === 0 && right.length === 0) return "";

  const header = `--- ${label}: sanity\n+++ ${label}: payload\n@@ line ${start + 1} @@`;
  const body =
    left.length * right.length > 4_000_000
      ? positionalDiff(left, right, limit)
      : lcsDiff(left, right, limit);
  return `${header}\n${body}`;
}

function lcsDiff(a: string[], b: string[], limit: number): string {
  const n = a.length;
  const m = b.length;
  const table: Uint32Array = new Uint32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * (m + 1) + j] =
        a[i] === b[j]
          ? table[(i + 1) * (m + 1) + j + 1] + 1
          : Math.max(table[(i + 1) * (m + 1) + j], table[i * (m + 1) + j + 1]);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  let shown = 0;
  let suppressed = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
    } else if (table[(i + 1) * (m + 1) + j] >= table[i * (m + 1) + j + 1]) {
      if (shown < limit) { out.push(`- ${a[i]}`); shown += 1; } else suppressed += 1;
      i += 1;
    } else {
      if (shown < limit) { out.push(`+ ${b[j]}`); shown += 1; } else suppressed += 1;
      j += 1;
    }
  }
  for (; i < n; i++) { if (shown < limit) { out.push(`- ${a[i]}`); shown += 1; } else suppressed += 1; }
  for (; j < m; j++) { if (shown < limit) { out.push(`+ ${b[j]}`); shown += 1; } else suppressed += 1; }
  if (suppressed > 0) out.push(`… ${suppressed} further differing lines not shown`);
  return out.join("\n");
}

function positionalDiff(a: string[], b: string[], limit: number): string {
  const out: string[] = [];
  let suppressed = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    if (out.length < limit * 2) {
      if (a[i] !== undefined) out.push(`- ${a[i]}`);
      if (b[i] !== undefined) out.push(`+ ${b[i]}`);
    } else suppressed += 1;
  }
  if (suppressed > 0) out.push(`… ${suppressed} further differing positions not shown`);
  return out.join("\n");
}

/** The whole comparison of two canonical renders: DOM first, then flight. */
export function diffCanonical(a: CanonicalRender, b: CanonicalRender): string {
  const parts = [diffLines(a.dom, b.dom, "rendered DOM"), diffLines(a.flight, b.flight, "RSC flight payload")];
  return parts.filter(Boolean).join("\n\n");
}

// ===========================================================================
// Deliberate mutations — the proof that the harness discriminates
// ===========================================================================

export type MutationKind =
  | "changed-heading"
  | "dropped-list-item"
  | "changed-link-href"
  | "changed-image-url"
  | "missing-block";

/**
 * Corrupt one rendered page in a specific, named way.
 *
 * This is not a test helper bolted on afterwards; it is how the harness earns
 * the right to be believed. `--self-test` runs every mutation against a real
 * rendered route and prints what the diff said, so "it can fail" is a thing
 * anyone can re-run rather than a claim in a report.
 *
 * Mutations are applied to the raw HTML after Suspense reconciliation, so they
 * land on resolved content and travel the whole pipeline — every normaliser
 * gets its chance to swallow them.
 */
export function mutate(html: string, kind: MutationKind): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  reconcileSuspense(doc);

  const fail = (what: string): never => {
    throw new Error(`mutation "${kind}" found no ${what} to change; pick a route that has one`);
  };

  // Mutate the page's *content*, not its chrome. The sidebar, header and
  // footer are on every route and come from the same layout whichever backend
  // is answering, so a mutation that lands on the logo link proves the diff
  // works but says nothing about the content layer. Prefer the article, then
  // main, then whatever there is.
  const root: Element = doc.querySelector("main") ?? doc.body;
  const pick = (selector: string): Element[] => [...root.querySelectorAll(selector)];

  switch (kind) {
    case "changed-heading": {
      const heading = pick("h1,h2,h3")[0] ?? fail("heading");
      heading.textContent = `${heading.textContent ?? ""} (mutated)`;
      break;
    }
    case "dropped-list-item": {
      const item = pick("li")[0] ?? fail("list item");
      item.remove();
      break;
    }
    case "changed-link-href": {
      const link =
        pick("a[href]").find((a) => (a.getAttribute("href") ?? "").startsWith("/")) ??
        fail("internal link");
      link.setAttribute("href", `${link.getAttribute("href")}-mutated`);
      break;
    }
    case "changed-image-url": {
      const image = pick("img[src]")[0] ?? fail("image");
      image.setAttribute("src", `${image.getAttribute("src")}&mutated=1`);
      break;
    }
    case "missing-block": {
      const block =
        pick("section,article,figure").find((el) => (el.textContent ?? "").trim().length > 40) ??
        fail("content block");
      block.remove();
      break;
    }
  }
  return dom.serialize();
}

// ===========================================================================
// The two dev servers
// ===========================================================================

export type Backend = "sanity" | "payload";

const PORTS: Record<Backend, number> = {
  sanity: Number(process.env.PARITY_PORT_SANITY ?? 3991),
  payload: Number(process.env.PARITY_PORT_PAYLOAD ?? 3992),
};

/** A backend never settles in more than a couple of renders in practice; three
 *  attempts means two chances to agree. */
const SETTLE_ATTEMPTS = 3;
const BOOT_TIMEOUT_MS = 120_000;
const RENDER_TIMEOUT_MS = 180_000;

interface Server {
  backend: Backend;
  child: ChildProcess;
  base: string;
  /** `[payload-image-source]` warnings, in the order the server printed them. */
  imageWarnings: string[];
  log: string[];
}

const servers = new Map<Backend, Promise<Server>>();
let tsconfigGuarded = false;

/**
 * Next rewrites `tsconfig.json`'s `include` to add `<distDir>/types/**` the
 * first time it sees a dist dir. That is a tracked file, and the harness's dist
 * dirs have no business in it, so they come back out. Surgical rather than a
 * restore-from-snapshot: another process (the developer's own dev server) may
 * legitimately be editing the same file while we run.
 */
export function restoreTsconfig(path = "tsconfig.json"): void {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return;
  }
  const cleaned = raw
    .split("\n")
    .filter((line) => !/"\.next-parity-[^"]*"/.test(line))
    .join("\n")
    // The removed entries may have been last in the array, leaving a trailing comma.
    .replace(/,(\s*\n\s*])/g, "$1");
  if (cleaned !== raw) writeFileSync(path, cleaned);
}

/**
 * The prefix `lib/content/internal/payload-image-source.ts` warns with, once
 * per distinct unserved transform. It is the only channel out of the render:
 * `getImageSizeMisses()` lives in the dev server's process, and reading it
 * from here would need a dev-only route under `app/`, which this phase does
 * not touch. The warning carries the same fields `recordMiss` records — the
 * reason and the requested box — because it is emitted by that same function.
 */
/**
 * The Sanity dataset both servers read.
 *
 * **Without this the harness compares two different corpora and calls the
 * result a parity failure.** Payload's development database was imported from
 * the Phase-0 archive of `production_2`
 * (`scripts/payload-import/lib/sanity-export.ts`), while `.env.local` — which
 * `next dev` loads ahead of `.env` — sets `NEXT_PUBLIC_SANITY_DATASET` to
 * `development`. Those two datasets are not the same content: measured on
 * 2026-09-07, at the published perspective, `development` holds 39 case
 * studies / 40 tags / 4 tags flagged `useAsTheme`, and `production_2` holds
 * 27 / 67 / 0. A comparison across them reports a difference for every route
 * that renders content, whatever the reader does, and the first thing it
 * reported was four theme chips that exist in one dataset and not the other.
 *
 * So both servers are pinned to the dataset Payload actually mirrors. It goes
 * on BOTH: the Payload server still answers thirteen unswapped domains out of
 * Sanity, and those halves have to match too.
 *
 * `@next/env` does not overwrite a variable already present in the
 * environment, so this wins over `.env.local` without editing it. Override
 * with `PARITY_SANITY_DATASET` if the Payload database is ever re-imported
 * from somewhere else — and if it is, this default is what has to change.
 */
export const PARITY_SANITY_DATASET = process.env.PARITY_SANITY_DATASET ?? "production_2";

export const IMAGE_MISS_MARKER = "[payload-image-source]";

export function isImageSizeMissLine(line: string): boolean {
  return line.includes(IMAGE_MISS_MARKER);
}

async function startServer(backend: Backend): Promise<Server> {
  const port = PORTS[backend];
  const base = `http://127.0.0.1:${port}`;
  if (await isListening(base)) {
    throw new Error(
      `port ${port} is already in use. The parity harness needs it for the ${backend} render. ` +
        `Stop whatever is there, or set PARITY_PORT_${backend.toUpperCase()}.`,
    );
  }

  const child = spawn("pnpm", ["exec", "next", "dev", "--port", String(port)], {
    env: {
      ...process.env,
      CONTENT_BACKEND: backend,
      NEXT_PUBLIC_SANITY_DATASET: PARITY_SANITY_DATASET,
      NEXT_DIST_DIR: `.next-parity-${backend}`,
      NEXT_TELEMETRY_DISABLED: "1",
      FORCE_COLOR: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  tsconfigGuarded = true;

  const server: Server = { backend, child, base, imageWarnings: [], log: [] };
  const consume = (chunk: Buffer) => {
    for (const line of chunk.toString().split("\n")) {
      if (!line.trim()) continue;
      server.log.push(line);
      if (isImageSizeMissLine(line)) server.imageWarnings.push(line.trim());
    }
  };
  child.stdout?.on("data", consume);
  child.stderr?.on("data", consume);

  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`the ${backend} dev server exited during boot:\n${server.log.slice(-20).join("\n")}`);
    }
    if (await isListening(base)) return server;
    await sleep(500);
  }
  throw new Error(`the ${backend} dev server did not start within ${BOOT_TIMEOUT_MS} ms`);
}

async function isListening(base: string): Promise<boolean> {
  try {
    await fetch(base, { signal: AbortSignal.timeout(1_000), redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

function ensureServer(backend: Backend): Promise<Server> {
  let existing = servers.get(backend);
  if (!existing) {
    existing = startServer(backend);
    servers.set(backend, existing);
  }
  return existing;
}

/** Stop both servers and put `tsconfig.json` back. Safe to call twice. */
export async function shutdown(): Promise<void> {
  for (const pending of servers.values()) {
    try {
      const server = await pending;
      // Kill the process group: `next dev` runs the server in a child of its own.
      if (server.child.pid) {
        try {
          process.kill(-server.child.pid, "SIGTERM");
        } catch {
          server.child.kill("SIGTERM");
        }
      }
    } catch {
      // A server that never started has nothing to stop.
    }
  }
  servers.clear();
  if (tsconfigGuarded) restoreTsconfig();
}

// ===========================================================================
// compareRoute
// ===========================================================================

export interface CompareResult {
  path: string;
  /** True only when both backends settled and both views matched. */
  equal: boolean;
  /** Empty when `equal`. Otherwise a readable line diff, DOM first. */
  diff: string;
  /**
   * Distinct `[payload-image-source]` warnings the Payload server printed
   * while this route rendered. Non-empty means a call site asked `media` for a
   * transform it does not store and got the original instead — a production
   * bug in waiting, so the CLI treats it as a failure even when the HTML
   * matched.
   */
  imageSizeMisses: string[];
  /** Whether each backend produced two consecutive identical renders. */
  stable: Record<Backend, boolean>;
}

async function renderOnce(server: Server, path: string): Promise<{ status: number; html: string }> {
  const response = await fetch(server.base + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(RENDER_TIMEOUT_MS),
  });
  return { status: response.status, html: await response.text() };
}

/**
 * Render `path` on one backend until two consecutive renders agree.
 *
 * The first render of a route is also its compile, and a cold flush orders
 * Suspense chunks differently from a warm one. Settling separates "this
 * backend's own output is nondeterministic" from "the two backends disagree",
 * and an unsettled backend is reported, never retried away.
 */
async function settle(
  backend: Backend,
  path: string,
): Promise<{ render: CanonicalRender; stable: boolean; warnings: string[] }> {
  const server = await ensureServer(backend);
  const before = server.imageWarnings.length;
  let previous: CanonicalRender | undefined;
  let current: CanonicalRender | undefined;
  for (let attempt = 0; attempt < SETTLE_ATTEMPTS; attempt++) {
    const { status, html } = await renderOnce(server, path);
    previous = current;
    current = canonicalise(html, status);
    if (previous && sameRender(previous, current)) {
      return { render: current, stable: true, warnings: server.imageWarnings.slice(before) };
    }
  }
  return { render: current!, stable: false, warnings: server.imageWarnings.slice(before) };
}

function sameRender(a: CanonicalRender, b: CanonicalRender): boolean {
  return a.dom.join("\n") === b.dom.join("\n") && a.flight.join("\n") === b.flight.join("\n");
}

/**
 * Render `path` on both backends and diff the result.
 *
 * Starts each server on first use and leaves it running, so the first call in
 * a process pays for two Next boots and every later call costs two fetches.
 * Call `shutdown()` when done.
 */
export async function compareRoute(path: string): Promise<CompareResult> {
  const sanity = await settle("sanity", path);
  const payload = await settle("payload", path);

  const stable = { sanity: sanity.stable, payload: payload.stable };
  const diff = diffCanonical(sanity.render, payload.render);
  const unstable = Object.entries(stable)
    .filter(([, ok]) => !ok)
    .map(([name]) => `the ${name} render never settled: ${SETTLE_ATTEMPTS} renders, no two consecutive alike`);

  return {
    path,
    equal: diff === "" && unstable.length === 0,
    diff: [...unstable, diff].filter(Boolean).join("\n\n"),
    imageSizeMisses: [...new Set(payload.warnings)],
    stable,
  };
}

// ===========================================================================
// CLI
// ===========================================================================

function selectRoutes(argv: string[]): ParityRoute[] {
  const domain = flag(argv, "--domain");
  const route = flag(argv, "--route");
  if (route) return [{ path: route, domain: "ad-hoc", why: "named on the command line" }];
  if (domain) {
    const found = routesForDomain(domain);
    if (found.length === 0) throw new Error(`no parity route is registered for domain "${domain}"`);
    return found;
  }
  return PARITY_ROUTES;
}

function flag(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

async function selfTest(path: string): Promise<number> {
  const server = await ensureServer("sanity");
  process.stdout.write(`self-test on ${path} — proving the harness reports each class of difference\n\n`);
  const { status, html } = await renderOnce(server, path);
  const original = canonicalise(html, status);
  const kinds: MutationKind[] = [
    "changed-heading",
    "dropped-list-item",
    "changed-link-href",
    "changed-image-url",
    "missing-block",
  ];
  let undetected = 0;
  for (const kind of kinds) {
    const mutated = canonicalise(mutate(html, kind), status);
    const diff = diffCanonical(original, mutated);
    if (!diff) {
      undetected += 1;
      process.stdout.write(`FAIL ${kind}: the harness reported no difference\n\n`);
      continue;
    }
    const shown = diff.split("\n").slice(0, 10).join("\n");
    process.stdout.write(`CAUGHT ${kind}\n${shown}\n\n`);
  }
  return undetected;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let failures = 0;
  try {
    if (argv.includes("--self-test")) {
      failures = await selfTest(flag(argv, "--route") ?? "/en/reader/background-context");
      return;
    }
    const routes = selectRoutes(argv);
    process.stdout.write(
      `comparing ${routes.length} route(s) on both backends. ` +
        `Excluded by design: ${EXCLUDED_ROUTES.map((r) => r.path).join(", ")}\n\n`,
    );
    for (const route of routes) {
      const started = Date.now();
      const result = await compareRoute(route.path);
      const seconds = ((Date.now() - started) / 1000).toFixed(0);
      const bad = !result.equal || result.imageSizeMisses.length > 0;
      if (bad) failures += 1;
      process.stdout.write(`${result.equal ? "SAME" : "DIFF"} ${seconds}s ${route.path}\n`);
      if (result.diff) process.stdout.write(`${result.diff}\n`);
      for (const miss of result.imageSizeMisses) process.stdout.write(`  image-size miss: ${miss}\n`);
    }
    process.stdout.write(`\n${failures === 0 ? "all routes identical" : `${failures} route(s) failed`}\n`);
  } finally {
    await shutdown();
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

// `tsx scripts/parity/render-diff.ts` runs it; importing it (the tests, a later
// task's script) does not.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void shutdown().then(() => process.exit(130));
    });
  }
  await main();
}
