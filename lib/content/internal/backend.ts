/**
 * Which store answers a read — the switch the whole of Phase 3 turns on.
 *
 * Phase 3 moves `lib/content/`'s sixteen domain modules from Sanity to Payload
 * one at a time, each independently revertible. That only works if a single
 * module can flip on its own, in production, without dragging the other
 * fifteen with it — hence the per-domain override below.
 *
 *   CONTENT_BACKEND                 the default for every module
 *   CONTENT_BACKEND_<DOMAIN>        overrides it for one module
 *
 * Unset means `sanity`. The site reads Sanity today, and a deployment that
 * says nothing must keep doing exactly that.
 *
 * ---------------------------------------------------------------------------
 * The browser cannot see any of that, and one module needs it to
 * ---------------------------------------------------------------------------
 *
 * Next inlines only `NEXT_PUBLIC_*` into a client bundle; every other
 * `process.env` read is `undefined` there. That is fine for fifteen of the
 * sixteen domain modules — they run on the server and hand their results down
 * as props — and it is **not** fine for `lib/content/images.ts`, whose
 * `imageUrl()` is called inside five `"use client"` components
 * (`case-study-modal`, `split-info-item`, `lived-experiences-carousel`,
 * `logo-cloud-1`, `grid-section-header`). Those render twice: once on the
 * server, where the flag is visible, and once on hydration, where it is not.
 * A server that answered `payload` and a browser that answered `sanity` would
 * build two different `src` values for the same image, which is a hydration
 * mismatch, not a fallback.
 *
 * So each variable has a public twin, consulted **only when the server-only
 * one says nothing** — which in a browser bundle is always, and on the server
 * is only when nobody set it:
 *
 *   NEXT_PUBLIC_CONTENT_BACKEND             the public twin of CONTENT_BACKEND
 *   NEXT_PUBLIC_CONTENT_BACKEND_<DOMAIN>    the public twin of the override
 *
 * The precedence is deliberate: the server-only variable still wins wherever
 * it is legible, so nothing about an existing server deployment changes, and
 * the public twin is what makes the two halves of one render agree. Setting
 * only the server-only one leaves the browser on `sanity`; `images.ts` says so
 * out loud rather than letting it be discovered as a flickering image.
 */

export type ContentBackend = "sanity" | "payload";

const DEFAULT_BACKEND: ContentBackend = "sanity";

/**
 * `case-studies` (the module's filename), `case_studies` and `caseStudies`
 * all name the same override, `CONTENT_BACKEND_CASE_STUDIES`. Domain names
 * are written differently in different places — a filename, a collection
 * slug, a prose reference — and a variable that only answers to one spelling
 * fails silently, which is the worst way for a rollout switch to fail.
 */
function overrideVariable(domain: string): string {
  const snake = domain
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return `CONTENT_BACKEND_${snake}`;
}

/**
 * The four names, in precedence order.
 *
 * Written as an explicit list rather than two nested lookups so the order is
 * one readable thing: a domain's own opinion outranks the process-wide one,
 * and within each level the server-only variable outranks its public twin.
 */
function candidateVariables(domain?: string): string[] {
  const names: string[] = [];
  if (domain) {
    const override = overrideVariable(domain);
    names.push(override, `NEXT_PUBLIC_${override}`);
  }
  names.push("CONTENT_BACKEND", "NEXT_PUBLIC_CONTENT_BACKEND");
  return names;
}

/**
 * Read one variable. Unset — or set to nothing but whitespace — means "no
 * opinion", so the next level down decides. Anything else must be one of the
 * two backends: a typo like `CONTENT_BACKEND=payl0ad` silently serving Sanity
 * is how a rollout gets declared finished while nothing moved.
 */
function readBackend(name: string): ContentBackend | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const value = raw.trim().toLowerCase();
  if (value === "") return undefined;
  if (value === "sanity" || value === "payload") return value;
  throw new Error(
    `${name} is set to "${raw}", which is neither "sanity" nor "payload". ` +
      `Refusing to guess which content backend to read from.`,
  );
}

/**
 * The backend a domain module should read through.
 *
 * Read at call time rather than module load: a test, a script or a preview
 * deployment can set the variable after this module is imported, and a value
 * frozen at import would ignore it.
 *
 * @param domain the module's own name, e.g. `"case-studies"`. Omit it for the
 *   process-wide default.
 */
export function activeBackend(domain?: string): ContentBackend {
  for (const name of candidateVariables(domain)) {
    const value = readBackend(name);
    if (value) return value;
  }
  return DEFAULT_BACKEND;
}

/**
 * What a **browser** would answer for this domain — the public twins alone.
 *
 * Server code calls this to notice that it is about to render something a
 * client component will then re-render differently. Its only caller is
 * `lib/content/images.ts`, and its only purpose is to make that disagreement
 * loud instead of visual.
 */
export function publicBackend(domain?: string): ContentBackend {
  for (const name of candidateVariables(domain).filter((n) => n.startsWith("NEXT_PUBLIC_"))) {
    const value = readBackend(name);
    if (value) return value;
  }
  return DEFAULT_BACKEND;
}
