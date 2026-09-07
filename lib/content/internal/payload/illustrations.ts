/**
 * The Payload half of `lib/content/illustrations.ts`.
 *
 * One answer, one unchanged shape. `illustrations.ts` picks between this file
 * and its own GROQ through `activeBackend("illustrations")`; the `safe()`
 * wrapper that keeps a failed fetch from reaching the page stays in the domain
 * module, so a failure degrades to `{}` in exactly the same place on either
 * backend.
 *
 * ---------------------------------------------------------------------------
 * Three differences, none of which changes what renders
 * ---------------------------------------------------------------------------
 *
 * **1. The dimensions come from the media row, not from image metadata.**
 * Sanity projects `asset->{_id, metadata{dimensions{width,height}}}` and
 * `mapImage` drops the slot when either is missing — the width and height are
 * what stop `<HeaderIllustration>` shifting the layout while the image loads.
 * Payload keeps the same two numbers on the `media` row itself, as `width` and
 * `height`. Same facts, one hop shallower.
 *
 * **2. `alt` is localized here and a bare string there.** Sanity declares it
 * `type: "string"`; `payload/blocks/shared.ts`'s `imageField()` declares it
 * with `localizedText()`, because every image alt in this migration is
 * localized and an editor writes that description in their own language.
 * `HubIllustration.alt` is a `string` and `getHubIllustrations()` takes no
 * locale, so one has to be chosen: `en, es, fr, ar` order, first non-empty
 * wins. That is the same rule `payload/regions.ts` uses for `getRegionArt`,
 * and it prefers the default locale rather than whichever key Postgres
 * returned first. The illustrations render `aria-hidden` (the alt is
 * editorial), so this is not a reader-facing choice.
 *
 * **3. `imageUrl` lands on the nearest covering derivative, per asset.**
 * `mapImage` asks for the image at its own natural size, which is an arbitrary
 * box that `media`'s eleven `imageSizes` were not derived from — no call site
 * existed to derive them from, because the singleton has never been
 * configured. `payload-image-source.ts` answers with the smallest derivative
 * that covers the request and records a miss when none does, which is exactly
 * the loud behaviour Task 4 built for this case. A miss here is not a bug to
 * hide: it says an illustration was uploaded at a size `media` does not
 * generate, and the fix is to add the size.
 *
 * ---------------------------------------------------------------------------
 * There is nothing stored to verify against
 * ---------------------------------------------------------------------------
 *
 * `hubIllustrations` holds **zero documents in Sanity** (measured against
 * `production_2`, control `count(*[_type=="agenda"])` = 29) and an empty global
 * in Payload — `findGlobal` returns `{atlasHeader:{}, searchHeader:{},
 * collaborateHeader:{}, emptyState:{}}`, four groups with no upload in them.
 * Both backends therefore resolve every slot to `undefined` today, which is the
 * state `<HeaderIllustration image={…}>` is written for: an empty slot renders
 * null and the Atlas, Search and Collaborate headers look exactly as they do
 * now. The mapping below is covered by unit tests only, and says so.
 */
import "server-only";
import type { LocalizedRaw } from "@/lib/content/internal/localized";
import { imageUrl } from "@/lib/content/internal/payload-image-source";
import { query } from "@/lib/content/internal/payload-source";
import type { HubIllustration, HubIllustrations } from "@/lib/content/illustrations";
import type { PayloadLocale } from "@/lib/content/internal/payload-source";

const LOCALES: PayloadLocale[] = ["en", "es", "fr", "ar"];

interface MediaRow {
  id?: unknown;
  url?: string | null;
  width?: number | null;
  height?: number | null;
}

interface IllustrationSlot {
  asset?: MediaRow | string | null;
  /* `LocalizedRaw` is shared (`internal/localized.ts`), but the `localized()`
   * beside it does not apply here: `HubIllustration.alt` is a `string`, not a
   * locale map, so there is no key order to canonicalise. `altText` picks one
   * locale; the Sanity twin picks `image.alt ?? ""`. The declared `string` arm
   * covers a Sanity-shaped bare alt reaching this type. */
  alt?: LocalizedRaw | string;
}

interface HubIllustrationsGlobal {
  atlasHeader?: IllustrationSlot | null;
  searchHeader?: IllustrationSlot | null;
  collaborateHeader?: IllustrationSlot | null;
  emptyState?: IllustrationSlot | null;
}

/** The first locale that carries text, `en` first. `""` when none does, which
 *  is what the Sanity path produces for an unset `alt` (`image.alt ?? ""`). */
function altText(value: IllustrationSlot["alt"]): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  for (const locale of LOCALES) {
    const text = value[locale];
    if (typeof text === "string" && text.length > 0) return text;
  }
  return "";
}

/**
 * One slot, or `undefined` when it is not configured.
 *
 * The three-way guard mirrors the Sanity path's `if (!image?.asset?._id ||
 * !width || !height) return undefined` exactly: an unresolved upload, or one
 * whose row carries no pixel dimensions, is dropped rather than rendered at a
 * guessed size. At `depth: 0` Payload leaves `asset` as a bare id string, which
 * has neither — so it is dropped too, as an unresolvable Sanity reference is.
 */
function mapImage(slot: IllustrationSlot | null | undefined): HubIllustration | undefined {
  const asset = slot?.asset;
  if (!asset || typeof asset !== "object") return undefined;
  const { width, height } = asset;
  if (typeof width !== "number" || !width || typeof height !== "number" || !height) return undefined;

  const url = imageUrl(asset, { width, height });
  if (!url) return undefined;

  return { url, alt: altText(slot?.alt), width, height };
}

/**
 * The four decorative header illustrations.
 *
 * `query`, not `queryPreviewable` — the Sanity twin calls `query()`, which
 * pins the published perspective, and an editor previewing a draft has never
 * seen an unpublished illustration here. Reproduced rather than "improved":
 * silently widening a read to drafts is the mirror image of the six Phase-1
 * bugs that silently narrowed one.
 */
export async function getHubIllustrations(): Promise<HubIllustrations> {
  const data = await query<HubIllustrationsGlobal | null>({
    type: "global",
    slug: "hubIllustrations",
    locale: "all",
    // The media row behind `asset` carries the url and the pixel dimensions.
    depth: 2,
  });
  if (!data) return {};

  return {
    atlasHeader: mapImage(data.atlasHeader),
    searchHeader: mapImage(data.searchHeader),
    collaborateHeader: mapImage(data.collaborateHeader),
    emptyState: mapImage(data.emptyState),
  };
}
