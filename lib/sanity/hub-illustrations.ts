import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

/** Minimal shape of a Sanity `image` field with alt text, as stored on the
 *  `hubIllustrations` singleton. GROQ's `asset->{...}` dereferences the
 *  reference into the asset document, whose id field is `_id` — `_ref` only
 *  exists on the un-dereferenced reference and is absent here. */
interface RawIllustrationImage {
  asset?: {
    _id?: string;
    metadata?: { dimensions?: { width?: number; height?: number } };
  };
  alt?: string;
}

interface RawHubIllustrations {
  atlasHeader?: RawIllustrationImage | null;
  searchHeader?: RawIllustrationImage | null;
  collaborateHeader?: RawIllustrationImage | null;
  emptyState?: RawIllustrationImage | null;
}

/** Resolved illustration ready for rendering: a CDN URL plus alt text and
 *  natural dimensions (used to preserve aspect ratio / avoid layout shift). */
export interface HubIllustration {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface HubIllustrations {
  atlasHeader?: HubIllustration;
  searchHeader?: HubIllustration;
  collaborateHeader?: HubIllustration;
  emptyState?: HubIllustration;
}

const HUB_ILLUSTRATIONS_QUERY = `*[_type == "hubIllustrations"][0]{
  atlasHeader{ asset->{ _id, metadata { dimensions { width, height } } }, alt },
  searchHeader{ asset->{ _id, metadata { dimensions { width, height } } }, alt },
  collaborateHeader{ asset->{ _id, metadata { dimensions { width, height } } }, alt },
  emptyState{ asset->{ _id, metadata { dimensions { width, height } } }, alt }
}`;

function mapImage(image: RawIllustrationImage | null | undefined): HubIllustration | undefined {
  const width = image?.asset?.metadata?.dimensions?.width;
  const height = image?.asset?.metadata?.dimensions?.height;
  if (!image?.asset?._id || !width || !height) return undefined;

  return {
    url: urlFor(image).width(width).height(height).url(),
    alt: image.alt ?? "",
    width,
    height,
  };
}

/** CMS-driven decorative header illustrations (Atlas/Search/Collaborate
 *  headers + empty states). Never throws into the page — any fetch failure
 *  (or an unconfigured singleton) resolves to `{}`, so callers can render
 *  `<HeaderIllustration image={illustrations.atlasHeader} />` unconditionally
 *  and get today's text-only header when nothing is configured.
 *
 *  ISR 300s: the underlying `client.fetch` call is tagged and revalidated
 *  every 5 minutes via Next's fetch cache (`next: { revalidate, tags }`). */
export async function getHubIllustrations(): Promise<HubIllustrations> {
  try {
    const data = await client.fetch<RawHubIllustrations | null>(
      HUB_ILLUSTRATIONS_QUERY,
      {},
      { next: { revalidate: 300, tags: ["hub-illustrations"] } }
    );
    if (!data) return {};

    return {
      atlasHeader: mapImage(data.atlasHeader),
      searchHeader: mapImage(data.searchHeader),
      collaborateHeader: mapImage(data.collaborateHeader),
      emptyState: mapImage(data.emptyState),
    };
  } catch (error) {
    console.error("[hub-illustrations] getHubIllustrations fetch failed:", error);
    return {};
  }
}
