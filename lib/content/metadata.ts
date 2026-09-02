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
 */
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
  ogImage?: {
    asset?: {
      metadata?: {
        dimensions?: { width?: number | null; height?: number | null } | null;
      } | null;
    } | null;
  } | null;
}

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

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

  return {
    title,
    description: page?.meta_description || "",
    openGraph: {
      images: [
        {
          url: page?.ogImage
            ? imageUrl(page.ogImage, { quality: 100 })
            : `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.jpg`,
          width: page?.ogImage?.asset?.metadata?.dimensions?.width || 1200,
          height: page?.ogImage?.asset?.metadata?.dimensions?.height || 630,
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
