import createImageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { dataset, projectId } from "../env";

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset });

export const urlFor = (source: SanityImageSource) => {
  const imageBuilder = builder.image(source);

  // Check if it's an object with asset property that has mimeType
  const sourceObj = source as { asset?: { mimeType?: string } };
  const isSvg = sourceObj?.asset?.mimeType === "image/svg+xml";

  if (isSvg) {
    return imageBuilder;
  }

  return imageBuilder.format("webp").fit("max");
};

/** Hotspot-aware crop: requests an exact aspect from the Sanity CDN so the
 *  editor's hotspot/crop is honored instead of CSS center-cropping.
 *  Callers typically pass ~2x the largest rendered width (e.g. 800 for ~400px cards). */
export function urlForCropped(
  source: SanityImageSource,
  width: number,
  height: number
) {
  // SVGs must bypass the CDN transform pipeline or they get rasterized/cropped.
  const sourceObj = source as { asset?: { mimeType?: string } };
  if (sourceObj?.asset?.mimeType === "image/svg+xml") {
    return builder.image(source);
  }

  // auto("format") is deliberate (serves AVIF/WebP per browser) vs urlFor's forced webp.
  return builder
    .image(source)
    .width(width)
    .height(height)
    .fit("crop")
    .auto("format");
}
