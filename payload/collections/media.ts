import type { CollectionConfig, ImageSize } from "payload";
import { editorOrStaticFile, isEditor } from "@/payload/access";
import { randomizeUploadFilename } from "@/payload/hooks/upload-filename";
import { uploadResponseHeaders } from "@/payload/hooks/upload-headers";

/**
 * Images. Mirrors Sanity's `sanity.imageAsset` — 347 of them in production_2
 * (verified 2026-09-03 by GROQ against the dataset: `image/png` 266,
 * `image/jpeg` 42, `image/webp` 38, `image/heif` 1; zero SVGs today, though
 * the schema offers SVG uploads via `background.svgPattern` and the various
 * logo fields, so the SVG path below still has to be right).
 *
 * Task 8 owns this file; it replaces Task 4's deliberate placeholder (which
 * was `upload: true` and nothing else, registered early only so
 * `imageField()`'s `relationTo: "media"` resolved at `buildConfig()` time).
 * Everything that placeholder had — the slug, `isAnyone`/`isEditor` access —
 * is preserved.
 *
 * Files (PDFs, documents, the lived-experience video field) live in the
 * sibling `files` collection: `mimeTypes` here is images-only, so a PDF
 * cannot be uploaded to `media` at all. "Images-only" still includes SVG —
 * `image/*` prefix-matches `image/svg+xml` — which is why
 * `backgroundOption.svgPattern` points here rather than at `files` despite
 * being a `sanity.fileAsset`; see `payload/blocks/shared.ts` for that
 * decision in full.
 *
 * `read: editorOrStaticFile` — there is no moderation field on an asset and
 * no `versions.drafts`, so there is no published/approved pair to gate on,
 * and the file route itself stays open to anonymous callers as Sanity's CDN
 * was. What is NOT open is the listing: this collection was `isAnyone` until
 * 2026-09-16, which made `/payload-api/media?limit=0` an anonymous index of
 * every image, including ones uploaded into private collaboration
 * workspaces. Sanity never offered a listing and named files by content
 * hash; Payload names them after the original, so `randomizeUploadFilename`
 * restores the unguessability for every new upload. Both decisions are
 * argued at `editorOrStaticFile` in payload/access/index.ts.
 */

/**
 * The mime types Payload will actually put through sharp, copied from
 * `payload/dist/uploads/canResizeImage.js`. `image/svg+xml` is absent from
 * that list, which is the mechanism that preserves Phase 1's load-bearing SVG
 * rule (`sanity/lib/image.ts`: "SVGs must bypass the CDN transform pipeline or
 * they get rasterized/cropped") — an uploaded SVG is stored verbatim and gets
 * no `sizes` at all. `lib/__tests__/payload-uploads.test.ts` asserts against
 * Payload's own copy of this list so a future upgrade cannot start
 * rasterizing SVGs silently. Note `image/heif` is also absent: the one HEIF
 * asset in production_2 will likewise carry no derived sizes.
 */
export const RESIZABLE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/tiff",
  "image/avif",
] as const;

/**
 * Every image transform the site actually requests, derived call-site by
 * call-site from `imageUrl()` (`lib/content/images.ts`) — the Phase 1 function
 * every `<Image src=…>` in the app now goes through. Nothing here is invented:
 * each entry cites the call sites that ask for it.
 *
 * The naming is mechanical on purpose — `crop`/`max` + the requested box — so
 * Phase 3's `imageUrl()` can pick a size by building the key straight from its
 * own arguments (`${opts.crop ? "crop" : "max"}${width}${height ? "x" + height : ""}`)
 * instead of carrying a lookup table that can drift.
 *
 * The two formats are deliberately different, mirroring the two Sanity
 * builders exactly (`sanity/lib/image.ts`):
 *   - `max*` (uncropped, `urlFor`) forces `.format("webp").fit("max")` -> sharp
 *     `fit: "inside"` + `formatOptions: { format: "webp" }`.
 *   - `crop*` (hotspot crop, `urlForCropped`) uses `.fit("crop").auto("format")`
 *     — a *per-browser* AVIF/WebP choice the Sanity CDN makes at request time.
 *     Payload writes static derivatives and cannot content-negotiate, so these
 *     entries pin no format at all: the derivative keeps its source format and
 *     the per-browser negotiation `auto("format")` used to do is done by
 *     `next/image`'s optimizer, which every one of these call sites already
 *     renders through. Pinning them to webp would have thrown away the AVIF
 *     half of the behaviour outright.
 *
 * Hotspot parity: `upload.focalPoint` (below) makes Payload crop around the
 * editor's focal point for these `crop*` sizes, which is what `urlForCropped`
 * existed for ("so the editor's hotspot/crop is honored instead of CSS
 * center-cropping").
 *
 * `withoutEnlargement: true` everywhere: Sanity's `fit("max")` never upscales,
 * and for the crop path Payload's default (`undefined`) would emit `null` for
 * any source smaller than the box — 83 of the 347 assets are under 800px wide
 * and 15 are under 400px, so the default would leave real holes. `true` yields
 * a smaller-but-present derivative instead. The one divergence from Sanity:
 * for such an undersized source the crop path returns the image at its own
 * aspect rather than upscaled to the exact box — every call site renders it in
 * a fixed-aspect container with `object-cover`, which crops it the same way.
 */
export const MEDIA_IMAGE_SIZES: ImageSize[] = [
  // --- Cropped: urlForCropped -> fit("crop") + auto("format") -----------------
  {
    // components/blocks/carousel/carousel-2.tsx:118
    name: "crop80x80",
    width: 80,
    height: 80,
    fit: "cover",
    withoutEnlargement: true,
  },
  {
    // components/blocks/grid/team-grid.tsx:208
    name: "crop320x320",
    width: 320,
    height: 320,
    fit: "cover",
    withoutEnlargement: true,
  },
  {
    // The `isWide` branch of every grid card: grid-card.tsx:61,
    // grid-news.tsx:197, grid-agenda.tsx:97, grid-report.tsx:95,
    // grid-external-source.tsx:173. Equals CARD_ASPECT_SOURCE.wide
    // (lib/design-tokens.ts:89).
    name: "crop800x450",
    width: 800,
    height: 450,
    fit: "cover",
    withoutEnlargement: true,
  },
  {
    // The non-`isWide` branch of the same five, plus grid-post.tsx:95 which
    // hard-codes it. Equals CARD_ASPECT_SOURCE.photo.
    name: "crop800x533",
    width: 800,
    height: 533,
    fit: "cover",
    withoutEnlargement: true,
  },
  {
    // components/blocks/inserts/manual-content-block.tsx:91
    name: "crop800x600",
    width: 800,
    height: 600,
    fit: "cover",
    withoutEnlargement: true,
  },

  // --- Uncropped: urlFor -> format("webp") + fit("max") -----------------------
  {
    // grid-lived-experience.tsx:195, case-study-card.tsx:81,
    // lived-experience-card.tsx:60
    name: "max400x225",
    width: 400,
    height: 225,
    fit: "inside",
    withoutEnlargement: true,
    formatOptions: { format: "webp" },
  },
  {
    // components/ui/lived-experience-card.tsx:106
    name: "max600x400",
    width: 600,
    height: 400,
    fit: "inside",
    withoutEnlargement: true,
    formatOptions: { format: "webp" },
  },
  {
    // components/news/featured-news-card.tsx:47 (non-lead) and
    // app/[locale]/(main)/news/[slug]/page.tsx:362 — both pass
    // CARD_ASPECT_SOURCE.wide (800x450) WITHOUT `crop`, so this is the same box
    // as crop800x450 through the other builder. Both are kept: they are
    // genuinely different images.
    name: "max800x450",
    width: 800,
    height: 450,
    fit: "inside",
    withoutEnlargement: true,
    formatOptions: { format: "webp" },
  },
  {
    // components/blocks/carousel/lived-experiences-carousel.tsx:83 — width
    // only, height left to the source aspect.
    name: "max800",
    width: 800,
    fit: "inside",
    withoutEnlargement: true,
    formatOptions: { format: "webp" },
  },
  {
    // components/blocks/split/split-image.tsx:32, hero/hero-1.tsx:167
    name: "max1100",
    width: 1100,
    fit: "inside",
    withoutEnlargement: true,
    formatOptions: { format: "webp" },
  },
  {
    // The full-bleed lead image: case-studies/[slug]/page.tsx:182,
    // research-outputs/[slug]/page.tsx:110, news/[slug]/page.tsx:228,
    // case-study-modal.tsx:164, featured-news-card.tsx:47 (lead variant).
    name: "max1200x675",
    width: 1200,
    height: 675,
    fit: "inside",
    withoutEnlargement: true,
    formatOptions: { format: "webp" },
  },
];

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Media",
    useAsTitle: "filename",
    defaultColumns: ["filename", "mimeType", "filesize", "width", "height"],
  },
  access: {
    read: editorOrStaticFile,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    // Runs before generateFileData reads req.file.name, so the derived
    // imageSizes carry the randomised stem too.
    beforeOperation: [randomizeUploadFilename],
  },
  upload: {
    // Images only. `image/*` admits `image/svg+xml` (and the one `image/heif`
    // asset); Payload's own SVG safety check (`validateSvg`) runs on upload
    // precisely because `mimeTypes` is set. PDFs and documents belong to the
    // `files` collection.
    // SVG sandboxing and Cache-Control — see payload/hooks/upload-headers.ts.
    modifyResponseHeaders: uploadResponseHeaders,
    mimeTypes: ["image/*"],
    // Sanity's hotspot, ported: the crop* sizes above are extracted around it.
    focalPoint: true,
    imageSizes: MEDIA_IMAGE_SIZES,
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      admin: { hidden: true },
      // Sanity's _id (`image-<hash>-<dims>-<ext>`), preserved verbatim so the
      // import is idempotent and every document's asset reference resolves.
    },
    {
      name: "sanityAssetId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        hidden: true,
        description:
          "The originating sanity.imageAsset _id. Unique, so Task 11 can re-run its import without creating a second copy of an asset.",
      },
    },
    {
      name: "lqip",
      type: "text",
      admin: {
        hidden: true,
        description:
          "Sanity's metadata.lqip base64 data URI, copied at import. Live, load-bearing data: 347/347 assets have one and 25 components pass it to next/image as blurDataURL. Payload generates no equivalent, so it has to be carried.",
      },
    },
  ],
};
