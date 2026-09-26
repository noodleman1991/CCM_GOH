import type { Block } from "payload";
import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { featuresWithSafeLinks } from "@/payload/fields/link";

/**
 * The embed vocabulary of Sanity's Portable Text, registered as Payload
 * lexical blocks.
 *
 * `lib/content/internal/lexical.ts` converts every non-`block` Portable Text
 * member into a lexical block node whose `blockType` is the Sanity `_type`
 * verbatim. These definitions are the other half of that identity: without
 * them the converted JSON still stores and reads fine (measured — an
 * unregistered `blockType` survives `parseEditorState` untouched), but the
 * admin renders "block not found" instead of an editor, which is exactly the
 * failure mode Task 9's brief warns about. `lib/__tests__/lexical-converter.test.ts`
 * asserts the two sets never drift apart.
 *
 * Registering blocks on a lexical editor adds NO database tables and needs no
 * migration: `@payloadcms/drizzle`'s schema builder maps `richText` to a single
 * `jsonb` column (schema/traverseFields.js, `case 'richText'`), and the block's
 * data lives inside that column.
 *
 * Field sets mirror the Sanity schemas one-for-one so Task 10 can invert the
 * mapping field by field:
 *   - image        sanity/schemas/blocks/shared/block-content.ts + styled-block-content.ts
 *   - youtube      the same two files
 *   - break        sanity/schemas/blocks/break.ts
 *   - infoBox      sanity/schemas/blocks/info-box.ts
 *   - storyTimeline / storyChart / storyMermaid   sanity/schemas/blocks/story-*.ts
 *
 * Measured occupancy in production_2 (886 documents): `image` 41, `youtube`
 * 36, and **zero** of the other five. They are ported because the spec chose
 * to, and they are covered by unit tests only — there is no stored instance to
 * verify against.
 */

/**
 * Sanity's image is a reference to an asset in Sanity's own CDN
 * (`image-<sha>-<w>x<h>-<ext>`). Task 11 builds the asset-id -> Payload-upload
 * map and Task 12 fills `media` in; `sanityAssetId` is what lets a re-run find
 * the same upload again instead of creating a second one, and it is what makes
 * the conversion reversible before the import has run.
 *
 * `alt` is `text`, not localized: the dataset stores it as a bare string 307
 * times and as `{en: …}` 18 times, so the converter carries whatever it finds
 * and Task 12 flattens the 18.
 */
export const richTextImage: Block = {
  slug: "image",
  interfaceName: "RichTextImageBlock",
  labels: { singular: "Image", plural: "Images" },
  fields: [
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      admin: { description: "The image. Populated by the Sanity import from `sanityAssetId`." },
    },
    {
      name: "sanityAssetId",
      type: "text",
      admin: {
        readOnly: true,
        description: "Source Sanity asset `_ref`. Kept so the import stays idempotent and reversible.",
      },
    },
    { name: "alt", type: "text" },
    { name: "caption", type: "text" },
    {
      name: "credit",
      type: "text",
      admin: { description: "Who took or provided the image (shown after the caption)." },
    },
    {
      name: "placement",
      type: "select",
      defaultValue: "full",
      options: [
        { label: "Full width (default)", value: "full" },
        { label: "Float inline-start (text wraps)", value: "start" },
        { label: "Float inline-end (text wraps)", value: "end" },
        { label: "Centered, intrinsic size", value: "center" },
      ],
    },
    {
      name: "hotspot",
      type: "json",
      admin: { readOnly: true, description: "Sanity crop/hotspot geometry, carried verbatim (2 documents use it)." },
    },
    { name: "crop", type: "json", admin: { readOnly: true } },
  ],
};

export const richTextYoutube: Block = {
  slug: "youtube",
  interfaceName: "RichTextYoutubeBlock",
  labels: { singular: "YouTube", plural: "YouTube embeds" },
  fields: [
    { name: "videoId", type: "text", admin: { description: "YouTube video id (2 of the 36 stored embeds have none)." } },
    { name: "caption", type: "text" },
  ],
};

export const richTextBreak: Block = {
  slug: "break",
  interfaceName: "RichTextBreakBlock",
  labels: { singular: "Break", plural: "Breaks" },
  fields: [
    {
      name: "style",
      type: "select",
      defaultValue: "hr",
      required: true,
      options: [
        { label: "Horizontal Rule", value: "hr" },
        { label: "Read More", value: "readMore" },
        { label: "Section Break", value: "section" },
        { label: "Chapter Break", value: "chapter" },
      ],
    },
  ],
};

export const richTextInfoBox: Block = {
  slug: "infoBox",
  interfaceName: "RichTextInfoBoxBlock",
  labels: { singular: "Info box", plural: "Info boxes" },
  fields: [
    {
      name: "variant",
      type: "select",
      defaultValue: "info",
      required: true,
      options: [
        { label: "Info", value: "info" },
        { label: "Warning", value: "warning" },
        { label: "Success", value: "success" },
      ],
    },
    {
      // Sanity nests a restricted block-content array here. A plain lexical
      // editor (no embeds) is the equivalent: paragraphs, strong/em, links —
      // and no recursion back into this same block set.
      name: "content",
      type: "richText",
      required: true,
      // Defaults, minus the stock link feature: a nested editor resolves its
      // own feature set, so bare `lexicalEditor()` would reinstate the
      // URL-mangling hook payload/fields/link.ts exists to remove.
      editor: lexicalEditor({ features: ({ defaultFeatures }) => featuresWithSafeLinks(defaultFeatures) }),
    },
  ],
};

export const richTextStoryTimeline: Block = {
  slug: "storyTimeline",
  interfaceName: "RichTextStoryTimelineBlock",
  labels: { singular: "Timeline", plural: "Timelines" },
  fields: [
    {
      name: "items",
      type: "array",
      minRows: 1,
      fields: [
        { name: "date", type: "text", admin: { description: "Free-form: a year, a month, or a full date." } },
        { name: "title", type: "text" },
        { name: "text", type: "textarea" },
      ],
    },
  ],
};

export const richTextStoryChart: Block = {
  slug: "storyChart",
  interfaceName: "RichTextStoryChartBlock",
  labels: { singular: "Chart", plural: "Charts" },
  fields: [
    {
      name: "chartType",
      type: "select",
      defaultValue: "bar",
      required: true,
      options: [
        { label: "Bar", value: "bar" },
        { label: "Grouped bars", value: "groupedBar" },
        { label: "Stacked bars", value: "stackedBar" },
        { label: "Line", value: "line" },
        { label: "Area", value: "area" },
        { label: "Pie", value: "pie" },
        { label: "Donut", value: "donut" },
        { label: "Region map", value: "regionMap" },
      ],
    },
    { name: "title", type: "text" },
    { name: "unit", type: "text", admin: { description: "e.g. %, households, °C — shown under the title." } },
    {
      name: "data",
      type: "array",
      label: "Data rows (single series — legacy)",
      fields: [
        { name: "label", type: "text" },
        { name: "value", type: "number" },
      ],
    },
    { name: "labels", type: "text", hasMany: true, label: "Category labels" },
    {
      name: "series",
      type: "array",
      fields: [
        { name: "name", type: "text" },
        { name: "values", type: "number", hasMany: true },
        { name: "highlight", type: "checkbox", defaultValue: false },
      ],
    },
    {
      name: "annotations",
      type: "array",
      fields: [
        { name: "atLabel", type: "text" },
        { name: "text", type: "text", maxLength: 80 },
      ],
    },
    {
      name: "threshold",
      type: "group",
      fields: [
        { name: "value", type: "number" },
        { name: "label", type: "text" },
      ],
    },
    { name: "caption", type: "textarea" },
    { name: "source", type: "text" },
    { name: "sourceUrl", type: "text" },
    { name: "alt", type: "textarea", admin: { description: "What the chart shows, for screen readers." } },
    {
      name: "renderedSvg",
      type: "textarea",
      admin: { readOnly: true, description: "Sanitized SVG produced by the render API at save time. Do not edit." },
    },
    {
      name: "renderStatus",
      type: "select",
      options: ["ok", "failed"],
      admin: { readOnly: true, description: 'Blocks whose status is not "ok" are withheld from the public page.' },
    },
  ],
};

export const richTextStoryMermaid: Block = {
  slug: "storyMermaid",
  interfaceName: "RichTextStoryMermaidBlock",
  labels: { singular: "Diagram (mermaid)", plural: "Diagrams" },
  fields: [
    { name: "code", type: "textarea", admin: { description: "Mermaid diagram source, e.g. `graph TD; A-->B`." } },
    { name: "renderedSvg", type: "textarea", admin: { readOnly: true } },
    {
      name: "renderStatus",
      type: "select",
      options: ["ok", "failed"],
      admin: { readOnly: true },
    },
  ],
};

/**
 * A code block from the story editor (a ``` fence or pasted markdown). The
 * public renderer already draws `{ _type: "code", code, language }`.
 *
 * `code` is deliberately NOT required: an author can leave an empty code block
 * in the story, and a required field would make the whole save fail with an
 * error the author can't place.
 */
export const richTextCode: Block = {
  slug: "code",
  interfaceName: "RichTextCodeBlock",
  labels: { singular: "Code", plural: "Code" },
  fields: [
    { name: "code", type: "textarea" },
    { name: "language", type: "text" },
  ],
};

/**
 * The `footnote` annotation, as an INLINE block.
 *
 * Portable Text marks a span; Lexical has no arbitrary text mark, and an
 * inline block is the only node in the enabled set that can sit between two
 * text nodes carrying arbitrary data. `text` is the note (the Sanity field
 * name, kept so the mapping is one-for-one); `marker` is the span text the
 * annotation was attached to and `markerFormat` its decorator bitmask —
 * three of the 80 stored footnotes are on a `strong` span, and without those
 * two fields the converter would quietly eat both.
 */
export const richTextFootnote: Block = {
  slug: "footnote",
  interfaceName: "RichTextFootnoteBlock",
  labels: { singular: "Footnote", plural: "Footnotes" },
  fields: [
    {
      name: "text",
      type: "textarea",
      required: true,
      admin: { description: "The footnote content (shown in the footnotes accordion)." },
    },
    {
      name: "marker",
      type: "text",
      admin: { description: "The words the footnote was attached to; rendered as the superscript marker." },
    },
    {
      name: "markerFormat",
      type: "number",
      defaultValue: 0,
      admin: { readOnly: true, description: "Lexical text-format bitmask the marker text carried (bold 1, italic 2, …)." },
    },
  ],
};

/** Block-level embeds, in the order the slash menu should offer them. */
export const richTextEmbedBlocks: Block[] = [
  richTextImage,
  richTextYoutube,
  richTextBreak,
  richTextInfoBox,
  richTextStoryTimeline,
  richTextStoryChart,
  richTextStoryMermaid,
  richTextCode,
];

/** Inline embeds. Only the footnote annotation needs one. */
export const richTextInlineBlocks: Block[] = [richTextFootnote];

/**
 * The editor every field that holds converted Portable Text must use.
 *
 * Set once at `payload.config.ts`'s `editor` (so a bare `type: "richText"`
 * field such as `docsChapters.body` inherits it) and once in
 * `payload/fields/localized.ts` (so every `localizedRichText` field does too,
 * including `gridRow.description`, which Task 6 explicitly deferred to here).
 *
 * `featuresWithSafeLinks` rather than `defaultFeatures` directly: the stock
 * link feature percent-encodes any href its narrow `validateUrl` rejects,
 * which destroyed 7 of the 72 in-page anchors in `docsChapters`. See
 * payload/fields/link.ts.
 */
export const richTextEditor = () =>
  lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...featuresWithSafeLinks(defaultFeatures),
      BlocksFeature({ blocks: richTextEmbedBlocks, inlineBlocks: richTextInlineBlocks }),
    ],
  });
