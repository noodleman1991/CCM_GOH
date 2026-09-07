/**
 * Task 10b: `generatePageMetadata`, moved from `sanity/lib/metadata.ts`.
 *
 * Small pure formatter — no fetch of its own — so it belongs in lib/content/
 * rather than staying under sanity/lib/ or getting inlined at each of its two
 * call sites (app/[locale]/(main)/page.tsx and .../[...slug]/page.tsx): both
 * need the exact same title/description/OG-image/robots/canonical shaping,
 * and duplicating that logic risks the two call sites drifting.
 *
 * The one Sanity-specific piece it used to have — `urlFor(...).quality(100)`
 * from @/sanity/lib/image — now goes through `imageUrl` (lib/content/images.ts,
 * Task 10a's wrapper), which is why that wrapper grew a `quality` option: the
 * OG image explicitly wants the ceiling, unlike every other call site that
 * left quality at the builder's default.
 *
 * ===========================================================================
 * The Open Graph image under Payload — the decision Task 4 deferred to here
 * ===========================================================================
 *
 * This is the ONE call site in the codebase that genuinely regresses on the
 * swap, and it needed a decision rather than a default. What it resolves to on
 * the Payload arm is: **the stored `max1200x675` WebP derivative, absolutised
 * against `NEXT_PUBLIC_SITE_URL`, with `quality` dropped and the declared
 * dimensions taken from the derivative rather than from the source.** Each
 * half of that, and why.
 *
 * **1. WebP, because this is where WebP was actually lost.**
 * `sanity/lib/image.ts:19` returns `.format("webp").fit("max")`
 * *unconditionally* for every non-SVG, so every image on the site is WebP on
 * the wire today. Task 4 measured what recovers that after the swap and what
 * does not: all twelve dimension-less component call sites render through
 * `next/image` with the default loader, none passing `unoptimized`, and
 * `next.config.mjs` sets `images.formats: ['image/avif','image/webp']` — so
 * the optimizer re-encodes per `Accept` and the browser gets AVIF or WebP
 * whatever the origin stores. The thirteenth is this one, and it has no
 * optimizer in front of it, because a crawler fetches the `og:image` URL
 * directly. `media`'s `max*` sizes pin `formatOptions: { format: "webp" }`, so
 * asking for one restores the format at exactly the site that lost it.
 *
 * **2. `1200x675`, because the alternative is a 3840x2160 PNG.** Exactly one
 * document in the dataset carries an `ogImage` — `page-toolkits-en`, the
 * `/research-and-action/toolkits` page (measured against `production_2`,
 * control `count(*[_type=="agenda"])` = 29; `count(*[defined(ogImage)])` = 1)
 * — and its asset is a **3840x2160 PNG**. Serving that original is
 * multi-megabyte and runs into crawler size ceilings, which is the risk the
 * plan named. `max1200x675` is `fit: inside, withoutEnlargement`, so a 16:9
 * source lands at exactly 1200x675: at or above every major crawler's
 * recommended Open Graph box (1200x630) and far below their limits. It is also
 * not a new size invented for this — it is the site's existing full-bleed lead
 * image, derived from five real call sites.
 *
 * **3. Absolute, and absolutised HERE.** Open Graph requires an absolute URL;
 * `next.config.mjs`'s `images.remotePatterns` lists `cdn.sanity.io` and **no
 * Payload or R2 host**, so a Payload image URL handed to `next/image` must stay
 * same-origin and relative or the twelve component sites break. Those two
 * requirements cannot both be met globally, so absolutising is a per-caller
 * decision, made at the one caller that needs it. `lib/content/images.ts` and
 * `payload-image-source.ts` return what Payload stores and guess no host.
 *
 * **4. `quality` is dropped on the Payload arm, deliberately.** Payload bakes
 * its derivatives at upload with sharp's defaults; there is no request-time
 * quality knob to express `quality: 100` against, which is why
 * `payload-image-source` records it as an `unsupported-quality` miss. Passing
 * it through would fire that miss on every page render and drown the log that
 * exists to catch a genuinely unserved transform. What `quality: 100` bought
 * on Sanity's CDN — no visible artefacts in a shared preview card — is bought
 * here by the size cap instead: a 1200-wide WebP of a 4K source is not
 * quality-limited.
 *
 * **5. The declared dimensions follow the bytes.** `og:image:width`/`height`
 * are declared beside the URL. On Sanity they come from the asset's own
 * metadata and are correct, because `fit("max")` with no width serves the
 * asset at full size. Declaring 3840x2160 while serving a 1200x675 derivative
 * would be a new lie, so the Payload arm reports the box `imageSource` chose.
 *
 * **What the Payload arm does when it cannot resolve the image, and why.**
 * `page.ogImage` is produced by `lib/content/pages.ts`, which does not swap
 * until Task 14. Until then, a deployment with `CONTENT_BACKEND=payload` hands
 * this formatter a *Sanity*-shaped `ogImage`, which `payload-image-source`
 * correctly declines to resolve (`""`). Falling back to the site's default OG
 * image there would silently drop the one page that has one; falling through
 * to the Sanity builder keeps today's output exactly. That is not a backend
 * read — no query is issued, `urlFor` formats a string from an asset id — and
 * the arm dies with Task 14.
 */
import { activeBackend } from "@/lib/content/internal/backend";
import { imageSource } from "@/lib/content/internal/payload-image-source";
import { imageUrl } from "@/lib/content/images";

/**
 * The fields this formatter actually reads, duck-typed against the three
 * page-ish shapes lib/content/pages.ts returns (`Page`, `RegionalCommunityPage`,
 * `Homepage`) — all three already carry these four fields at the top level
 * (see pages.ts's comment on why they're not nested under `seo`), so no
 * import from that module is needed here; a structural match is enough and
 * keeps this module from depending on the page-domain module's full surface.
 *
 * `meta_title` stays a union of string and a locale-keyed map: pages.ts types
 * it as `string | undefined`, but the runtime object-shape check below is
 * kept (as the original was) in case a caller's raw query result carries an
 * un-flattened localized value.
 */
export interface MetadataSource {
  meta_title?: string | Record<string, string | undefined> | null;
  meta_description?: string | null;
  noindex?: boolean | null;
  /**
   * Widened in Phase 3 to admit both stores' shapes, because this formatter
   * outlives the swap and its input does not.
   *
   * Sanity's dereferenced asset carries its pixel box under
   * `metadata.dimensions`; a Payload `media` row carries the same two numbers
   * at the top level, beside the `sizes` map of stored derivatives. Only the
   * `metadata` arm is read *here* — it is the fallback for the declared
   * `og:image:width`/`height` on the Sanity path. The rest is read by
   * `payload-image-source`, which this module hands the whole object to; the
   * fields are named rather than left to an index signature so it is legible
   * which store each one belongs to.
   *
   * Every member is optional, so this is a widening: no existing caller
   * changes, and `pages.ts` can start producing the second shape in Task 14
   * without this interface having to move again.
   */
  ogImage?: {
    asset?: {
      /** Sanity. */
      metadata?: {
        dimensions?: { width?: number | null; height?: number | null } | null;
      } | null;
      /** Payload. */
      url?: string | null;
      width?: number | null;
      height?: number | null;
      sizes?: Record<string, unknown> | null;
    } | null;
  } | null;
}

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

/** The Open Graph box. `media`'s `max1200x675` — see the header. */
const OG_WIDTH = 1200;
const OG_HEIGHT = 675;

/** An absolute URL, as `og:image` requires. Left alone when it already is one
 *  (Sanity's CDN URLs are absolute) or when no site URL is configured, because
 *  a half-built `undefined/payload-api/…` is worse than a relative one. */
function absolute(url: string): string {
  if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) return url;
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * The Open Graph image: its URL and the box it actually occupies.
 *
 * `width`/`height` are `undefined` on the Sanity arm, where the caller's own
 * `ogImage.asset.metadata.dimensions` is the right answer and describes the
 * bytes exactly.
 */
function openGraphImage(ogImage: unknown): { url: string; width?: number; height?: number } {
  if (activeBackend("metadata") === "payload") {
    const resolved = imageSource(ogImage, { width: OG_WIDTH, height: OG_HEIGHT });
    if (resolved.url) {
      return { url: absolute(resolved.url), width: resolved.width, height: resolved.height };
    }
    // A Sanity-shaped ogImage, because pages.ts has not swapped yet (Task 14).
    // See the header: this keeps today's output rather than dropping the one
    // page that has an OG image.
  }
  return { url: imageUrl(ogImage, { quality: 100 }) };
}

export function generatePageMetadata({
  page,
  slug,
  locale = "en",
}: {
  page: MetadataSource | null | undefined;
  slug: string;
  locale?: string;
}) {
  let title = "";

  if (page?.meta_title) {
    if (typeof page.meta_title === "object") {
      title = page.meta_title[locale] || page.meta_title["en"] || "";
    } else {
      title = page.meta_title;
    }
  }

  const og = page?.ogImage ? openGraphImage(page.ogImage) : undefined;

  return {
    title,
    description: page?.meta_description || "",
    openGraph: {
      images: [
        {
          url: og ? og.url : `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.jpg`,
          // The resolved derivative's own box first (Payload), then the
          // source's metadata (Sanity), then the Open Graph default. The
          // declaration has to describe the file that is actually served.
          width: og?.width || page?.ogImage?.asset?.metadata?.dimensions?.width || 1200,
          height: og?.height || page?.ogImage?.asset?.metadata?.dimensions?.height || 630,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    robots: !isProduction
      ? "noindex, nofollow"
      : page?.noindex
        ? "noindex"
        : "index, follow",
    alternates: {
      canonical: `/${slug === "index" ? "" : slug}`,
    },
  };
}
