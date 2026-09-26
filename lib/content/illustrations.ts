/**
 * Moved from lib/sanity/hub-illustrations.ts (Task 10). Task 10a converted
 * the direct `@/sanity/lib/image` `urlFor` import here to the plain
 * `imageUrl` function (`@/lib/content/images`), same as every other call
 * site project-wide.
 */
import { activeBackend } from "@/lib/content/internal/backend";
import { safe } from "@/lib/content/internal/safe";
import { query } from "@/lib/content/internal/sanity-source";
import { getHubIllustrations as payloadGetHubIllustrations } from "@/lib/content/internal/payload/illustrations";
import { imageUrl } from "@/lib/content/images";

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
    url: imageUrl(image, { width, height }),
    alt: image.alt ?? "",
    width,
    height,
  };
}

/**
 * CMS-driven decorative header illustrations (Atlas/Search/Collaborate
 * headers + empty states). Never throws into the page — any fetch failure
 * (or an unconfigured singleton) resolves to `{}`, so callers can render
 * `<HeaderIllustration image={illustrations.atlasHeader} />` unconditionally
 * and get today's text-only header when nothing is configured. The original
 * try/catch degrading to `{}` is reproduced via `safe()`.
 *
 * `query` — the original called bare `client.fetch` directly (with its own
 * 300s/`hub-illustrations`-tag cache config). The seam's `query()` uses a
 * 1-hour/`sanity`-tag cache instead: a cache-window change, not a behaviour
 * change — the Sanity webhook already revalidates the `sanity` tag
 * unconditionally on every publish (app/api/webhooks/sanity/route.ts).
 */
export async function getHubIllustrations(): Promise<HubIllustrations> {
  return safe("hub-illustrations", {}, async () => {
    // Inside `safe()`, not above it: a Payload failure must degrade to `{}` in
    // exactly the place a Sanity one does, or the page that renders
    // `<HeaderIllustration image={illustrations.atlasHeader} />`
    // unconditionally starts throwing on one backend and not the other.
    if (activeBackend("illustrations") === "payload") return payloadGetHubIllustrations();
    const data = await query<RawHubIllustrations | null>(HUB_ILLUSTRATIONS_QUERY);
    if (!data) return {};

    return {
      atlasHeader: mapImage(data.atlasHeader),
      searchHeader: mapImage(data.searchHeader),
      collaborateHeader: mapImage(data.collaborateHeader),
      emptyState: mapImage(data.emptyState),
    };
  });
}
