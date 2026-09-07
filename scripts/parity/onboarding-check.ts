/**
 * Task 8's checkpoint: what `compareRoute` can say about `onboarding.ts`, and
 * what it cannot.
 *
 * `lib/content/onboarding.ts` has exactly one rendered surface,
 * `/[locale]/onboarding`, and it is **Clerk-gated**: signed out, `page.tsx`
 * redirects at line 99 before either read is issued. Rendered by the harness —
 * which carries no session — both backends therefore return the same redirect
 * and the comparison is real but empty. That is reported here as a 307, not
 * dressed up as content parity, for the same reason `/en/dashboard` sits in
 * `EXCLUDED_ROUTES`.
 *
 * So the module's three exports are verified through the two API routes that
 * are public — `/api/onboarding/content` and `/api/communities` — fetched from
 * the harness's own two dev servers and compared as parsed JSON rather than as
 * bytes. A byte diff of a 12 KB single-line JSON body names nothing; a leaf
 * diff names the path that moved. The third route,
 * `/api/profile/prompts/available`, is `auth()`-gated and 401s signed out, so
 * `getActiveProfilePrompts` is covered by its unit tests and by the ordering
 * measurement in the report, and by nothing rendered. Stated rather than
 * papered over.
 *
 * Run: `pnpm exec tsx scripts/parity/onboarding-check.ts`
 */
import { compareRoute, shutdown } from "./render-diff";

const SANITY = `http://127.0.0.1:${process.env.PARITY_PORT_SANITY ?? 3991}`;
const PAYLOAD = `http://127.0.0.1:${process.env.PARITY_PORT_PAYLOAD ?? 3992}`;

const LOCALES = ["en", "es", "fr", "ar"] as const;

/** Every leaf of a JSON value, as `path -> value`. Arrays keep their index. */
function leaves(value: unknown, path = ""): Map<string, unknown> {
  const out = new Map<string, unknown>();
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      for (const [k, v] of leaves(item, `${path}[${index}]`)) out.set(k, v);
    });
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      for (const [k, v] of leaves(item, path ? `${path}.${key}` : key)) out.set(k, v);
    }
  } else {
    out.set(path, value);
  }
  return out;
}

/** A leaf nobody can read: absent, null, or the empty string. */
function empty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

async function fetchJson(base: string, path: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(base + path, { redirect: "manual" });
  const text = await response.text();
  try {
    return { status: response.status, body: JSON.parse(text) as unknown };
  } catch {
    return { status: response.status, body: text };
  }
}

async function compareJson(path: string): Promise<boolean> {
  const [sanity, payload] = await Promise.all([fetchJson(SANITY, path), fetchJson(PAYLOAD, path)]);
  const a = leaves(sanity.body);
  const b = leaves(payload.body);
  const paths = [...new Set([...a.keys(), ...b.keys()])].sort();

  const differing = paths.filter((p) => JSON.stringify(a.get(p)) !== JSON.stringify(b.get(p)));
  // The distinction this whole check exists to draw: a leaf that is readable
  // on one backend and not the other is a content regression; a leaf that is
  // unreadable on both (absent on Sanity, `null` on Payload, or the reverse)
  // is the shape difference between the two stores and renders identically,
  // because every consumer read is `content?.x?.y || t("…")`.
  const readable = differing.filter((p) => !empty(a.get(p)) || !empty(b.get(p)));
  const shapeOnly = differing.length - readable.length;

  const same = sanity.status === payload.status && readable.length === 0;
  process.stdout.write(
    `${same ? "SAME" : "DIFF"} ${path}  ` +
      `HTTP ${sanity.status}/${payload.status}  ` +
      `${paths.length} leaves, ${readable.length} readable differences, ` +
      `${shapeOnly} unreadable-on-both\n`,
  );
  for (const p of readable.slice(0, 40)) {
    process.stdout.write(`   ${p}\n     sanity  ${JSON.stringify(a.get(p))}\n     payload ${JSON.stringify(b.get(p))}\n`);
  }
  if (readable.length > 40) process.stdout.write(`   … ${readable.length - 40} more\n`);
  return same;
}

async function main(): Promise<void> {
  let failures = 0;
  try {
    process.stdout.write("The one rendered surface, in all four locales (Clerk-gated — expect a redirect):\n\n");
    for (const locale of LOCALES) {
      const path = `/${locale}/onboarding`;
      const started = Date.now();
      const result = await compareRoute(path);
      const seconds = ((Date.now() - started) / 1000).toFixed(0);
      if (!result.equal) failures += 1;
      process.stdout.write(`${result.equal ? "SAME" : "DIFF"} ${seconds}s ${path}\n`);
      if (result.diff) process.stdout.write(`${result.diff}\n`);
    }

    process.stdout.write("\nThe public API routes the three exports feed, compared as parsed JSON:\n\n");
    for (const locale of LOCALES) {
      if (!(await compareJson(`/api/onboarding/content?locale=${locale}`))) failures += 1;
    }
    if (!(await compareJson("/api/communities"))) failures += 1;

    process.stdout.write("\nThe one that cannot be reached signed out:\n\n");
    const prompts = await fetchJson(SANITY, "/api/profile/prompts/available");
    process.stdout.write(
      `SKIP /api/profile/prompts/available  HTTP ${prompts.status} — auth()-gated, ` +
        `so getActiveProfilePrompts has no unauthenticated surface to compare\n`,
    );
  } finally {
    await shutdown();
  }
  process.stdout.write(`\n${failures === 0 ? "no readable difference on any surface" : `${failures} surface(s) differ`}\n`);
  process.exitCode = failures === 0 ? 0 : 1;
}

void main();
