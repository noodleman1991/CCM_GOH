/**
 * Tests for the Phase-3 parity harness (`scripts/parity/`).
 *
 * The harness verifies Tasks 6–14, so what these tests are really for is the
 * one property that makes it worth anything: **it must be able to fail**.
 * Phase 2 shipped a verifier that reported 19/19 while every string in the
 * database could have said "WRONG". So most of what is below is not "does the
 * harness say equal when the pages are equal" — that is the easy half — but
 * "does each normaliser still let a real content change through".
 *
 * They live here rather than beside the harness because `scripts/**` is
 * excluded from the vitest run.
 */
import { describe, expect, it } from "vitest";
import {
  canonicalise,
  diffCanonical,
  diffLines,
  extractFlight,
  mutate,
  restoreTsconfig,
  isImageSizeMissLine,
  type MutationKind,
} from "@/scripts/parity/render-diff";
import { PARITY_ROUTES, EXCLUDED_ROUTES, coveredDomains, routesForDomain } from "@/scripts/parity/routes";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// A page shaped like the real thing
// ---------------------------------------------------------------------------

/**
 * Small, but carrying every feature the normalisers touch: a stylesheet link
 * and metadata in the head, a Suspense boundary whose content arrives
 * out of order behind a skeleton fallback, late-streamed `<title>`/`<meta>`
 * hoisted from the body, a Turbopack chunk URL, a `/_next/image` URL, and an
 * RSC flight payload carrying a string that never reaches the DOM.
 */
function page(options: { heading?: string; items?: string[]; href?: string; img?: string; drawer?: string } = {}) {
  const heading = options.heading ?? "Background Context";
  const items = options.items ?? ["First finding about heat and sleep", "Second finding about drought"];
  const href = options.href ?? "/en/reader/methods";
  const img = options.img ?? "/_next/image?url=%2Fhero.png&w=640&q=75";
  const drawer = options.drawer ?? "Only in the drawer";
  const flight = JSON.stringify(
    `0:{"chunk":"/_next/static/chunks/abcdef._.js"}\n1:{"drawerItems":["${drawer}"]}\n`,
  );
  return `<!doctype html><html lang="en"><head>
<link rel="stylesheet" href="/_next/static/chunks/a.css"/>
<link rel="stylesheet" href="/_next/static/chunks/b.css"/>
</head><body>
<main><h2>${heading}</h2>
<!--$?--><template id="B:1"></template><div class="skeleton">loading</div><!--/$-->
<section><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>
<a href="${href}">Methods</a></section>
</main>
<div hidden id="S:1"><article><p>Streamed body text</p><img src="${img}" alt="Hero"/></article></div>
<script>$RC("B:1","S:1")</script>
<div hidden><title>Background Context | CCM</title><meta property="og:image" content="https://cdn.sanity.io/x.png"/></div>
<script>self.__next_f.push([1,${flight}])</script>
</body></html>`;
}

const baseline = canonicalise(page());

describe("the parity harness's canonicalisation", () => {
  it("splices out-of-order Suspense content into the place the browser would put it", () => {
    // The streamed <article> must land inside <main>, between the heading and
    // the <section> — not at the end of the body where it was transmitted.
    const dom = baseline.dom.join("\n");
    expect(dom).toContain("#text Streamed body text");
    const article = baseline.dom.findIndex((l) => l.includes("#text Streamed body text"));
    const listItem = baseline.dom.findIndex((l) => l.includes("#text First finding about heat"));
    const headingLine = baseline.dom.findIndex((l) => l.includes("#text Background Context"));
    expect(headingLine).toBeLessThan(article);
    expect(article).toBeLessThan(listItem);
  });

  it("drops the pending boundary's fallback, so a slower backend does not render an extra skeleton", () => {
    expect(baseline.dom.join("\n")).not.toContain("skeleton");
  });

  it("hoists late-streamed metadata into the head rather than leaving it in the body", () => {
    const headEnd = baseline.dom.indexOf("<body>");
    const title = baseline.dom.findIndex((l) => l.includes("Background Context | CCM"));
    expect(title).toBeGreaterThan(-1);
    expect(title).toBeLessThan(headEnd);
  });

  it("reports the HTTP status, so a 404 on one backend is not read as a body difference", () => {
    expect(canonicalise(page(), 404).dom[0]).toBe("HTTP 404");
    expect(diffCanonical(baseline, canonicalise(page(), 404))).toContain("HTTP 404");
  });

  it("compares the flight payload, which carries props the DOM never renders", () => {
    expect(baseline.flight.join("\n")).toContain("Only in the drawer");
    expect(baseline.dom.join("\n")).not.toContain("Only in the drawer");
  });

  it("is stable across identical renders", () => {
    expect(diffCanonical(baseline, canonicalise(page()))).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Each normaliser: what it hides, and the change it must NOT hide
// ---------------------------------------------------------------------------

describe("the normalisers hide only what they claim to", () => {
  it("collapses Turbopack's dev chunk names but leaves /_next/image URLs alone", () => {
    const rows = extractFlight(`<script>self.__next_f.push([1,${JSON.stringify(
      '0:"/_next/static/chunks/one_abc._.js"\n1:"/_next/image?url=%2Fa.png&w=640&q=75"\n',
    )}])</script>`);
    expect(rows.join("\n")).toContain("/_next/static/*");
    expect(rows.join("\n")).not.toContain("one_abc");
    // The image URL carries the source asset. It must survive verbatim.
    expect(rows.join("\n")).toContain("/_next/image?url=%2Fa.png&w=640&q=75");
  });

  it("does not let the chunk normaliser swallow a changed image URL", () => {
    const changed = canonicalise(page({ img: "/_next/image?url=%2Fother.png&w=640&q=75" }));
    expect(diffCanonical(baseline, changed)).toContain("other.png");
  });

  it("sorts head metadata but still reports a changed og:image", () => {
    const changed = canonicalise(
      page().replace("https://cdn.sanity.io/x.png", "/payload-api/media/file/x.png"),
    );
    const diff = diffCanonical(baseline, changed);
    expect(diff).toContain("payload-api/media/file/x.png");
  });

  it("keeps stylesheet links in cascade order, because their order is a rendering difference", () => {
    const swapped = canonicalise(
      page()
        .replace('href="/_next/static/chunks/a.css"', 'href="/_next/static/chunks/TMP.css"')
        .replace('href="/_next/static/chunks/b.css"', 'href="/_next/static/chunks/a.css"')
        .replace('href="/_next/static/chunks/TMP.css"', 'href="/_next/static/chunks/b.css"'),
    );
    expect(diffCanonical(baseline, swapped)).not.toBe("");
  });

  it("does not let Suspense reconciliation swallow content that never arrived", () => {
    // The boundary is still pending: no <div hidden id="S:1"> and no $RC.
    const truncated = page()
      .replace(/<div hidden id="S:1">[\s\S]*?<\/div>\s*<script>\$RC\("B:1","S:1"\)<\/script>/, "");
    const diff = diffCanonical(baseline, canonicalise(truncated));
    expect(diff).toContain("Streamed body text");
  });

  it("erases flight row indices, which renumber between renders, but keeps every value", () => {
    const rowsA = extractFlight(
      `<script>self.__next_f.push([1,${JSON.stringify('17a:{"title":"Regional Community"}\n17b:["$17a"]\n')}])</script>`,
    );
    const rowsB = extractFlight(
      // Same values, renumbered — exactly what two renders of the same route
      // were measured doing.
      `<script>self.__next_f.push([1,${JSON.stringify('1b3:{"title":"Regional Community"}\n1b4:["$1b3"]\n')}])</script>`,
    );
    expect(rowsA).toEqual(rowsB);
    // …but a changed value is still a changed row.
    const rowsC = extractFlight(
      `<script>self.__next_f.push([1,${JSON.stringify('1b3:{"title":"Different Community"}\n1b4:["$1b3"]\n')}])</script>`,
    );
    expect(rowsC).not.toEqual(rowsA);
  });

  it("reads a length-prefixed text row whole, instead of gluing the next row's index onto it", () => {
    // `<id>:T<hex byte length>,<bytes>` is not newline-terminated. This app's
    // blurDataURL data URIs arrive this way, and splitting on "\n" leaves the
    // following row's index stuck to the end of the text — where the index
    // normaliser cannot see it, so it reports a difference on every render.
    const text = "data:image/png;base64,AAAA";
    const stream = `1:T${text.length.toString(16)},${text}2ab:["$","div",null,{}]\n`;
    const rows = extractFlight(`<script>self.__next_f.push([1,${JSON.stringify(stream)}])</script>`);
    expect(rows).toContain(`#:T${text.length.toString(16)},${text}`);
    expect(rows.some((r) => r.startsWith('#:["$","div"'))).toBe(true);
    expect(rows.join("\n")).not.toContain("2ab:");
  });

  it("counts a text row's length in bytes, not code units, so RTL content does not shift the split", () => {
    const text = "الأجندة"; // 7 characters, 14 UTF-8 bytes
    const bytes = Buffer.byteLength(text, "utf8");
    const stream = `1:T${bytes.toString(16)},${text}2:["$","p",null,{}]\n`;
    const rows = extractFlight(`<script>self.__next_f.push([1,${JSON.stringify(stream)}])</script>`);
    expect(rows).toContain(`#:T${bytes.toString(16)},${text}`);
  });

  it("erases $-references without touching $undefined or $Sreact.fragment", () => {
    const rows = extractFlight(
      `<script>self.__next_f.push([1,${JSON.stringify('1:{"locale":"$undefined","frag":"$Sreact.fragment","ref":"$1a2"}\n')}])</script>`,
    );
    expect(rows[0]).toContain("$undefined");
    expect(rows[0]).toContain("$Sreact.fragment");
    expect(rows[0]).not.toContain("$1a2");
  });

  it("collapses the harness's own two dist directory names, which differ by construction", () => {
    // The row Task 8 measured: an identical NEXT_REDIRECT on both backends,
    // whose dev stack frame names the dist directory the server was started
    // with. `.next-parity-<backend>` is set by the harness itself.
    const frame = (dir: string) =>
      `<script>self.__next_f.push([1,${JSON.stringify(
        `1:{"digest":"NEXT_REDIRECT;replace;/en/sign-in;307;","stack":"at r (/repo/${dir}/server/chunks/ssr/page.js:12:34)"}\n`,
      )}])</script>`;
    expect(extractFlight(frame(".next-parity-sanity"))).toEqual(
      extractFlight(frame(".next-parity-payload")),
    );
  });

  it("does not let the dist-directory normaliser swallow a real change in the same row", () => {
    const row = (dir: string, target: string) =>
      `<script>self.__next_f.push([1,${JSON.stringify(
        `1:{"digest":"NEXT_REDIRECT;replace;${target};307;","stack":"at r (/repo/${dir}/server/chunks/ssr/page.js:12:34)"}\n`,
      )}])</script>`;
    // Same hidden difference as above, plus one that matters: the redirect
    // target. The row must still differ.
    const diff = diffLines(
      extractFlight(row(".next-parity-sanity", "/en/sign-in")),
      extractFlight(row(".next-parity-payload", "/en/onboarding")),
      "flight",
    );
    expect(diff).toContain("/en/onboarding");
    // And it collapses only the two names it claims: a third dist directory,
    // or any other path segment in the frame, is left exactly as it is.
    const other = extractFlight(row(".next-parity-sanity", "/en/sign-in")).join("\n");
    expect(other).toContain("/repo/.next-parity-*/server/chunks/ssr/page.js:12:34");
    expect(extractFlight(row(".next", "/en/sign-in")).join("\n")).toContain("/repo/.next/server");
  });

  it("still reports a flight row that disappeared entirely", () => {
    const full = extractFlight(
      `<script>self.__next_f.push([1,${JSON.stringify('1:{"a":1}\n2:{"drawerItems":["kept","dropped"]}\n')}])</script>`,
    );
    const short = extractFlight(
      `<script>self.__next_f.push([1,${JSON.stringify('1:{"a":1}\n')}])</script>`,
    );
    expect(diffLines(full, short, "flight")).toContain("drawerItems");
  });

  it("does not let script removal swallow a flight-payload-only difference", () => {
    const changed = canonicalise(page({ drawer: "Something else entirely" }));
    const diff = diffCanonical(baseline, changed);
    expect(diff).toContain("RSC flight payload");
    expect(diff).toContain("Something else entirely");
  });

  it("normalises whitespace inside a text node without merging two of them", () => {
    const a = canonicalise(page({ items: ["First   finding about heat and sleep", "Second finding about drought"] }));
    expect(diffCanonical(baseline, a)).toBe("");
    const b = canonicalise(page({ items: ["First finding about heat and sleepSecond finding about drought"] }));
    expect(diffCanonical(baseline, b)).not.toBe("");
  });
});

// ---------------------------------------------------------------------------
// The five classes of difference the harness exists to catch
// ---------------------------------------------------------------------------

const EXPECTED: Record<MutationKind, string> = {
  "changed-heading": "(mutated)",
  "dropped-list-item": "First finding about heat and sleep",
  "changed-link-href": "/en/reader/methods-mutated",
  "changed-image-url": "&mutated=1",
  "missing-block": "Second finding about drought",
};

describe("the harness reports each class of difference by name", () => {
  for (const [kind, marker] of Object.entries(EXPECTED) as [MutationKind, string][]) {
    it(`catches ${kind}, and the diff names it`, () => {
      const diff = diffCanonical(baseline, canonicalise(mutate(page(), kind)));
      expect(diff, `${kind} produced no diff`).not.toBe("");
      expect(diff).toContain(marker);
    });
  }

  it("names the differing element rather than only reporting inequality", () => {
    const diff = diffCanonical(baseline, canonicalise(mutate(page(), "changed-heading")));
    expect(diff).toMatch(/^--- rendered DOM: sanity$/m);
    expect(diff).toMatch(/^\+ {2}.*#text Background Context \(mutated\)$/m);
  });
});

describe("diffLines", () => {
  it("says nothing when the two sides match", () => {
    expect(diffLines(["a", "b"], ["a", "b"], "x")).toBe("");
  });

  it("reports a removal and an addition with the line they start at", () => {
    const diff = diffLines(["a", "b", "c"], ["a", "z", "c"], "x");
    expect(diff).toContain("@@ line 2 @@");
    expect(diff).toContain("- b");
    expect(diff).toContain("+ z");
  });

  it("caps the report and says how much it withheld", () => {
    const a = Array.from({ length: 200 }, (_, i) => `a${i}`);
    const b = Array.from({ length: 200 }, (_, i) => `b${i}`);
    expect(diffLines(a, b, "x", 5)).toMatch(/further differing lines not shown/);
  });
});

// ---------------------------------------------------------------------------
// The route list
// ---------------------------------------------------------------------------

describe("the parity route list", () => {
  it("covers a route in every locale the site ships", () => {
    for (const locale of ["en", "es", "fr", "ar"]) {
      expect(
        PARITY_ROUTES.some((r) => r.path.startsWith(`/${locale}/`) || r.path === `/${locale}`),
        `no route in ${locale}`,
      ).toBe(true);
    }
  });

  it("names every path with its locale, because the harness does not follow redirects", () => {
    for (const route of PARITY_ROUTES) {
      expect(route.path, route.path).toMatch(/^\/(en|es|fr|ar)(\/|$)/);
    }
  });

  it("keeps /atlas out of the rendered set and says why", () => {
    expect(PARITY_ROUTES.some((r) => r.path.includes("/atlas"))).toBe(false);
    const atlas = EXCLUDED_ROUTES.find((r) => r.path.includes("/atlas"));
    expect(atlas?.reason).toMatch(/ESOCKETTIMEDOUT/);
  });

  it("explains every route it does list", () => {
    for (const route of PARITY_ROUTES) expect(route.why.length, route.path).toBeGreaterThan(40);
  });

  it("filters by domain", () => {
    expect(routesForDomain("news").map((r) => r.path)).toEqual(["/en/news/cop28-centring-mental-health", "/en/news"]);
    expect(routesForDomain("nothing-here")).toEqual([]);
  });

  it("reaches the domains whose remodels are the riskiest", () => {
    expect(coveredDomains()).toEqual(
      expect.arrayContaining(["pages", "case-studies", "lived-experiences", "system", "news", "outputs"]),
    );
  });
});

// ---------------------------------------------------------------------------
// The tsconfig guard
// ---------------------------------------------------------------------------

describe("restoreTsconfig", () => {
  it("removes the harness's dist dirs from include and leaves everything else", () => {
    const dir = mkdtempSync(join(tmpdir(), "parity-"));
    const file = join(dir, "tsconfig.json");
    writeFileSync(
      file,
      ['{', '  "include": [', '    "**/*.ts",', '    ".next/types/**/*.ts",', '    ".next-parity-sanity/types/**/*.ts"', '  ]', '}'].join("\n"),
    );
    restoreTsconfig(file);
    const after = readFileSync(file, "utf8");
    expect(after).not.toContain("next-parity");
    expect(after).toContain('".next/types/**/*.ts"');
    expect(JSON.parse(after).include).toEqual(["**/*.ts", ".next/types/**/*.ts"]);
  });

  it("leaves a file it has nothing to do with untouched", () => {
    const dir = mkdtempSync(join(tmpdir(), "parity-"));
    const file = join(dir, "tsconfig.json");
    const original = '{\n  "include": ["**/*.ts"]\n}';
    writeFileSync(file, original);
    restoreTsconfig(file);
    expect(readFileSync(file, "utf8")).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// The image-size miss channel (Task 4 -> Task 5)
// ---------------------------------------------------------------------------

describe("image-size misses reach the comparison", () => {
  it("recognises the line the Payload image source actually prints", async () => {
    // Not a hand-written sample of the message: the real emitter is invoked, so
    // this fails if `recordMiss`'s wording ever drifts from what the harness
    // scrapes out of the dev server's stdio.
    const { imageUrl, clearImageSizeMisses, getImageSizeMisses } = await import(
      "@/lib/content/internal/payload-image-source"
    );
    clearImageSizeMisses();
    const warned: string[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => void warned.push(args.map(String).join(" "));
    try {
      imageUrl(
        { url: "/payload-api/media/file/x.png", sizes: { max800: { url: "/payload-api/media/file/x-800.webp" } } },
        { width: 9000 },
      );
    } finally {
      console.warn = original;
    }
    expect(getImageSizeMisses()).toHaveLength(1);
    expect(warned).toHaveLength(1);
    expect(isImageSizeMissLine(warned[0])).toBe(true);
    clearImageSizeMisses();
  });

  it("does not mistake an ordinary server log line for a miss", () => {
    expect(isImageSizeMissLine("✓ Compiled /en/news in 412ms")).toBe(false);
  });
});
