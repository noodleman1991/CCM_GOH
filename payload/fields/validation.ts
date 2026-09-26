import type { Validate } from "payload";

/**
 * The Payload half of `sanity/schemas/shared/validation.ts`, so a field ported
 * out of Sanity keeps the rule it was authored with instead of silently losing
 * it. Same shapes, same messages where a message exists.
 *
 * ## Sanity has soft warnings; Payload does not
 *
 * Several Sanity rules are declared `.warning()` — the Studio shows an amber
 * hint and the document still saves. Payload's `Validate` signature is
 * `(value, options) => string | true` (`payload/dist/fields/config/types.d.ts`
 * line 282): the only two outcomes are "valid" and "blocking error". There is
 * no third, warning-shaped return, and no `severity` field anywhere in
 * `FieldBase`. So a Sanity warning has exactly two honest ports — drop it, or
 * harden it — and every rule below that was a warning in Sanity says so at its
 * own definition rather than converting quietly.
 */

/** Sanity's `urlRule`: `rule.uri({ scheme: ["http","https","mailto"], allowRelative: false })`. */
export const urlValidate: Validate<string | null | undefined> = (value) => {
  if (!value) return true;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "Enter a full URL, including https:// (relative links are not allowed here)";
  }
  return ["http:", "https:", "mailto:"].includes(parsed.protocol)
    ? true
    : "Only http, https and mailto links are allowed";
};

/**
 * Sanity's `place.countryCode` rule
 * (`sanity/schemas/objects/place.ts`: `/^[A-Z]{3}$/`).
 *
 * A `.warning()` in Sanity, hard here — see the module note. Zero-risk to
 * harden: it is applied only to `events`/`projects`, which hold 0 documents,
 * so no import can be blocked by it. The `place` groups on `livedExperiences`
 * and `researchOutputs` carry real data and are deliberately left alone.
 */
export const countryCodeValidate: Validate<string | null | undefined> = (value) => {
  if (!value) return true;
  return /^[A-Z]{3}$/.test(value) ? true : "Use a 3-letter ISO code (e.g. KEN)";
};

/**
 * Sanity's `event.endAt` rule
 * (`Rule.min(Rule.valueOfField("startAt")).warning("End should be after start.")`).
 *
 * A `.warning()` in Sanity, hard here — see the module note; `events` holds 0
 * documents, so nothing existing can be blocked. Reads `startAt` off
 * `siblingData`, which for a root-level field is the document itself, falling
 * back to `data` for the case where only the changed subtree is sent.
 */
export const endAfterStartValidate: Validate<
  Date | string | null | undefined,
  { startAt?: Date | string | null },
  { startAt?: Date | string | null }
> = (value, { data, siblingData }) => {
  if (!value) return true;
  const startAt = siblingData?.startAt ?? data?.startAt;
  if (!startAt) return true;
  const end = new Date(value as string).getTime();
  const start = new Date(startAt as string).getTime();
  if (Number.isNaN(end) || Number.isNaN(start)) return true;
  return end >= start ? true : "End should be after start.";
};

/** Sanity's slug `options.maxLength: 96`, expressed as Payload's own `maxLength`. */
export const SLUG_MAX_LENGTH = 96;
