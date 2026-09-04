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
  if (domain) {
    const override = readBackend(overrideVariable(domain));
    if (override) return override;
  }
  return readBackend("CONTENT_BACKEND") ?? DEFAULT_BACKEND;
}
