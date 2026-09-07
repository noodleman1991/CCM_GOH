/**
 * The two cross-backend differences only the RSC flight payload reveals.
 *
 * Task 9 found both by comparing the flight payload rather than the DOM, and
 * both are invisible to `pnpm typecheck` and to every unit test. They are here,
 * once, because five private copies of a rule is how the sixth reader gets it
 * wrong.
 *
 * ---------------------------------------------------------------------------
 * 1. Locale key order
 * ---------------------------------------------------------------------------
 *
 * Sanity's Content Lake serializes an object's keys **alphabetically**. Measured
 * against `production_2` (control `count(*[_type=="agenda"])` = 29) across tags,
 * regionalCommunities and pages, every localized object comes back
 * `ar,en,es,fr`. Payload returns them in `payload.config.ts`'s locale order,
 * `en,es,fr,ar`.
 *
 * Nothing reads key order. But a localized object handed to a client component
 * is serialized into the RSC flight payload **verbatim**, so the two orders are
 * a byte difference the parity harness reports on every localized field on
 * every such route. Canonicalising to Sanity's order costs nothing and makes
 * the two stores agree.
 *
 * The alternative — a harness normaliser that reorders object keys — was
 * rejected: a normaliser that sorts keys could hide a value that moved from one
 * key to another.
 *
 * ---------------------------------------------------------------------------
 * 2. Unset keys
 * ---------------------------------------------------------------------------
 *
 * A GROQ projection emits **every key it names**, with `null` for a field the
 * document does not set. Payload does the opposite in one direction and the
 * mirror of it in the other:
 *
 * - a **document-level** field the document does not set is simply absent from
 *   Payload's row, where GROQ would have emitted `null` — so a projection that
 *   names a field must emit `null`, not nothing. That is `orNull`.
 * - a **localized** field read at `locale: "all"` is spelled out with a `null`
 *   per configured locale (`issue: {en: null}` on all 56 lived experiences),
 *   where Sanity stores and returns only the locales an editor filled in — so
 *   the empty arms have to go. That is `localized`.
 *
 * Both matter for the same reason: React writes an absent value into the flight
 * payload as `"$undefined"`, which is a different byte string from `null`, and
 * `{en: null}` is a different object from `undefined`.
 *
 * ---------------------------------------------------------------------------
 * Where this does and does not apply
 * ---------------------------------------------------------------------------
 *
 * Audited 2026-09-07 across every Payload reader that existed at Task 10:
 *
 * | reader | uses `localized()` | why |
 * |---|---|---|
 * | `payload/taxonomy.ts` | yes | emits `ContentTag.label`, `TaxonomyOption.label`, `Organization.description` |
 * | `payload/system.ts` | yes | emits `SiteAnnouncement.message` and `link.label` |
 * | `payload/onboarding.ts` | yes | emits `ProfilePrompt.prompt` and `OnboardingRegionalCommunity.name`, previously handed straight through with Payload's nulls and Payload's key order |
 * | `payload/lived-experiences.ts` | yes | the reader this rule was discovered in |
 * | `payload/news.ts` | yes | Task 10 |
 * | `payload/regions.ts` | **no, and correctly so** | its one localized output (`getThemeOptions`) is rebuilt key by key as `{en,es,fr,ar}` — and its **Sanity twin does exactly the same**, in the same order, with the same `undefined` arms. Both backends already agree; routing it through `localized()` would make Payload disagree with Sanity rather than agree. |
 * | `payload/illustrations.ts` | **no, and correctly so** | `HubIllustration.alt` is a `string`, not a locale map. It picks one locale (`en` first) and the Sanity twin picks `image.alt ?? ""`. There is no key order to canonicalise. |
 *
 * The plan named five readers that "build locale maps without sorting". Two of
 * those five — `regions` and `illustrations` — do not build a locale map at
 * all, so this file exports the shared `LocalizedRaw` type they use and stops
 * there.
 */
import type { Localized } from "@/lib/content/types";

/**
 * A Payload localized field as it arrives at `locale: "all"`.
 *
 * Every configured locale is present, and any the editor left empty is `null`
 * rather than absent.
 */
export type LocalizedRaw =
  | Partial<Record<keyof Localized & string, string | null>>
  | null
  | undefined;

/**
 * A Payload localized field, as a Sanity projection of the same field.
 *
 * Drops the locale arms Payload spells out as `null`, collapses an object with
 * nothing left to `undefined`, and emits the surviving keys in Sanity's
 * alphabetical order. See the header for why each of those three is load-bearing.
 */
export function localized(value: LocalizedRaw): Localized | undefined {
  if (!value || typeof value !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const locale of Object.keys(value).sort()) {
    const string = value[locale as keyof Localized & string];
    if (typeof string === "string" && string.length > 0) out[locale] = string;
  }
  return Object.keys(out).length > 0 ? (out as Localized) : undefined;
}

/**
 * `undefined` as the `null` a GROQ projection actually returns.
 *
 * Wrap every projected-but-unset field a reader hands back, so a document that
 * sets nothing produces the same object on both backends.
 */
export function orNull<T>(value: T | undefined): T | null {
  return value ?? null;
}
