import type { Field, FieldAffectingData, FieldHook, TextField } from "payload";
import { LinkFeature, sanitizeUrl } from "@payloadcms/richtext-lexical";
import type { FeatureProviderServer } from "@payloadcms/richtext-lexical";

/**
 * The element type of the `defaultFeatures` array a `lexicalEditor({ features })`
 * callback is handed. The package types it with `any` parameters (its own
 * `defaultEditorFeatures` mixes differently-propped features in one array), and
 * matching that is what keeps a `LinkFeature()` assignable back into it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFeature = FeatureProviderServer<any, any, any>;

/**
 * The lexical `link` feature, with Payload's URL-mangling `beforeChange` hook
 * replaced.
 *
 * ## What was wrong
 *
 * `@payloadcms/richtext-lexical@3.88.0` gives the link node's `url` field this
 * hook (`dist/features/link/server/baseFields.js`):
 *
 * ```js
 * if (!validateUrl(value)) return encodeURIComponent(value)
 * ```
 *
 * and `validateUrl` (`dist/lexical/utils/url.js`) tests an absolute-URL regex
 * whose fragment clause is `(?:#\w+)?$` plus a relative/anchor regex whose is
 * `(?:#[\w-]+)?`. `\w` is `[A-Za-z0-9_]`, so an in-page anchor whose fragment
 * contains a `:` or a `,` matches neither pattern and the WHOLE href is
 * percent-encoded — `#` becomes `%23` and the link stops resolving.
 *
 * Measured on the imported `docsChapters`: 7 of 72 stored link URLs were
 * mangled this way, all of them Global Agenda in-page anchors such as
 * `#background-context:-climate-change,-mental-health-and-the-need-for-transdisciplinary-research`.
 * Plain `#background-context` was fine, which is why it looked random.
 *
 * The hook runs on EVERY write, so repairing the rows without replacing it
 * would only have them re-corrupted by the next import.
 *
 * ## What replaces it
 *
 * The sanitisation is kept, only its test is widened from "does this look like
 * a URL I can auto-link" to "is this href safe" — which is a question Payload
 * already answers, with `sanitizeUrl` in that same `utils/url.js`. It accepts
 * the `https? | mailto | ftp | tel | file | sms` schemes, base64 image/video/
 * audio data URLs, and anything scheme-less (relative paths, `#fragments`,
 * query strings); it rejects everything else — `javascript:`, `vbscript:`,
 * `data:text/html`, … — by returning `'https://'` instead of the input.
 *
 * So: a value `sanitizeUrl` returns unchanged is stored verbatim; anything
 * else still goes through `encodeURIComponent`, exactly as before, which
 * neutralises a hostile scheme by encoding its colon. The change is strictly
 * that safe fragment and relative hrefs stop being destroyed.
 */
export const keepSafeUrlsVerbatim: FieldHook = ({ value }) => {
  // Same shape as the hook it replaces: returning nothing leaves the value be.
  if (!value) return;
  if (typeof value !== "string") return value;
  // `sanitizeUrl` trims, so a value with surrounding whitespace is not
  // "unchanged" and still gets encoded — as it did before.
  if (sanitizeUrl(value) === value) return value;
  return encodeURIComponent(value);
};

/** True for the link feature's own `url` field. */
function isLinkUrlField(field: Field | FieldAffectingData): field is TextField {
  return "name" in field && field.name === "url" && field.type === "text";
}

/**
 * `LinkFeature` with `keepSafeUrlsVerbatim` swapped in for the stock
 * `beforeChange`. Every other base field — `text`, `linkType`, `doc`, and the
 * internal-link plumbing `enabledCollections` drives — is passed through
 * untouched, so this stays a one-hook override rather than a fork of
 * `getBaseFields`.
 */
export const safeLinkFeature = () =>
  LinkFeature({
    fields: ({ defaultFields }) =>
      defaultFields.map((field) =>
        isLinkUrlField(field)
          ? { ...field, hooks: { ...field.hooks, beforeChange: [keepSafeUrlsVerbatim] } }
          : field,
      ),
  });

/**
 * Every default lexical feature, with the stock `link` replaced by
 * `safeLinkFeature()`.
 *
 * Filtered by key rather than appended: the loader builds its feature map with
 * `new Map(features.map(f => [f.key, f]))`, so an appended duplicate would
 * silently win on value while keeping the default's position — correct, but
 * only by accident. Removing it says what is meant.
 *
 * Must be applied to EVERY lexical editor in the config, not just the top-level
 * one: each `lexicalEditor()` call resolves its own feature set, so a nested
 * editor (`infoBox.content`) built from bare defaults would keep the mangling
 * hook.
 */
export function featuresWithSafeLinks(defaultFeatures: AnyFeature[]): AnyFeature[] {
  return [...defaultFeatures.filter((feature) => feature.key !== "link"), safeLinkFeature()];
}
