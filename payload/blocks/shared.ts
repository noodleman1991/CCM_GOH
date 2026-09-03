import type { ArrayField, CollectionSlug, Condition, Field, GroupField, RelationshipField, UploadField } from "payload";
import { localizedText } from "@/payload/fields/localized";

/**
 * Sub-field builders shared across the twelve blocks (payload/blocks/*),
 * mirroring sanity/schemas/blocks/shared/*.ts one-for-one:
 *   section-padding.ts  -> sectionPaddingField
 *   background-option.ts -> backgroundOptionField
 *   button-variant.ts   -> (inlined into linkFields' buttonVariant group)
 *   link.ts             -> linkField / linksArrayField
 * Not one of "the twelve blocks" itself — same relationship this file has to
 * the blocks as Sanity's own shared/ folder has to its block schemas.
 */

/** `relationTo`/upload's `relationTo` are typed against the CURRENT generated
 * payload-types.ts collections. Tasks 5 (agendas, newsPosts, testimonials)
 * and 8 (media) create those collections; this file names them by the slug
 * those tasks are specified to use. The cast is the deliberate seam — once
 * those collections exist and payload-types.ts regenerates, it keeps
 * type-checking with no code change needed here. */
function collectionSlug(slug: string): CollectionSlug {
  return slug as CollectionSlug;
}

export function sectionPaddingField(name = "padding"): GroupField {
  return {
    name,
    type: "group",
    label: "Padding",
    admin: { description: "Add padding to the section." },
    fields: [
      { name: "top", type: "checkbox", label: "Top Padding" },
      { name: "bottom", type: "checkbox", label: "Bottom Padding" },
    ],
  };
}

/**
 * Mirrors sanity/schemas/blocks/shared/background-option.ts. Verified against
 * real data (hero-1, cta-1, grid-row instances, production_2 dataset,
 * 2026-09-03): `type` is always "none" or unset across all 188 instances —
 * no document has ever chosen ccm-palette/color/gradient/svg/image. Ported
 * in full anyway: it is a live, currently-offered editing feature, not
 * removed/dead like `colorVariant` (see payload/blocks/split-row.ts).
 */
export function backgroundOptionField(name = "background"): GroupField {
  return {
    name,
    type: "group",
    label: "Background",
    fields: [
      {
        name: "type",
        type: "select",
        defaultValue: "none",
        enumName: "enum_bg_type",
        options: [
          { label: "None (inherit)", value: "none" },
          { label: "CCM Color Palette", value: "ccm-palette" },
          { label: "Custom Color", value: "color" },
          { label: "Gradient", value: "gradient" },
          { label: "SVG Pattern", value: "svg" },
          { label: "Image", value: "image" },
        ],
      },
      {
        name: "ccmColor",
        type: "select",
        enumName: "enum_bg_ccm_color",
        options: [
          { label: "CCM Sky", value: "ccm-sky" },
          { label: "CCM Water", value: "ccm-water" },
          { label: "CCM Sea", value: "ccm-sea" },
          { label: "CCM Midnight", value: "ccm-midnight" },
        ],
        admin: { condition: (_, siblingData) => siblingData?.type === "ccm-palette" },
      },
      {
        name: "color",
        type: "text",
        label: "Custom Background Color",
        admin: {
          description: "Hex color code (e.g. #205596)",
          condition: (_, siblingData) => siblingData?.type === "color",
        },
      },
      {
        name: "gradient",
        type: "group",
        admin: { condition: (_, siblingData) => siblingData?.type === "gradient" },
        fields: [
          {
            name: "direction",
            type: "select",
            defaultValue: "to-r",
            enumName: "enum_bg_gradient_direction",
            options: [
              { label: "To Right", value: "to-r" },
              { label: "To Left", value: "to-l" },
              { label: "To Bottom", value: "to-b" },
              { label: "To Top", value: "to-t" },
              { label: "To Bottom Right", value: "to-br" },
              { label: "To Bottom Left", value: "to-bl" },
              { label: "To Top Right", value: "to-tr" },
              { label: "To Top Left", value: "to-tl" },
            ],
          },
          { name: "startColor", type: "text" },
          { name: "endColor", type: "text" },
        ],
      },
      uploadField("svgPattern", "media", { admin: { condition: (_, siblingData) => siblingData?.type === "svg" } }),
      imageField("image", { condition: (_, siblingData) => siblingData?.type === "image" }),
      {
        name: "lightText",
        type: "checkbox",
        label: "Light text for a dark background",
        defaultValue: false,
      },
      {
        name: "blobAccent",
        type: "checkbox",
        label: "Soft blob accent",
        defaultValue: false,
      },
    ],
  };
}

function buttonVariantField(name = "buttonVariant"): GroupField {
  return {
    name,
    type: "group",
    label: "Button Style",
    fields: [
      {
        name: "variant",
        type: "select",
        defaultValue: "default",
        enumName: "enum_btn_variant",
        // "default"/"secondary"/"outline"/"ghost" are the current curated
        // set (sanity/schemas/blocks/shared/button-variant.ts). "link",
        // "invert", "light-invert" and "destructive" are legacy values a
        // pre-curation schema version allowed, still tolerated for read by
        // components/ui/sanity-button.tsx's VARIANT_ALIAS. "primary" is
        // NEITHER — 22 stored links carry it (production_2, 2026-09-03) and
        // it maps to neither list; see task-3-report.md.
        options: [
          "default",
          "secondary",
          "outline",
          "ghost",
          "link",
          "invert",
          "light-invert",
          "destructive",
          "primary",
        ].map((value) => ({ label: value, value })),
      },
      {
        name: "size",
        type: "select",
        defaultValue: "default",
        enumName: "enum_btn_size",
        options: ["default", "lg", "wide", "sm", "thick"].map((value) => ({ label: value, value })),
      },
      {
        name: "stroke",
        type: "select",
        defaultValue: "none",
        enumName: "enum_btn_stroke",
        options: ["none", "light", "midnight"].map((value) => ({ label: value, value })),
      },
    ],
  };
}

function linkFields(): Field[] {
  return [
    { name: "title", type: "text", admin: { description: "Button text." } },
    {
      name: "href",
      type: "text",
      admin: { description: "Full URL (https://…) or an internal path starting with /" },
    },
    { name: "target", type: "checkbox", label: "Open in new tab" },
    buttonVariantField("buttonVariant"),
  ];
}

/** A single link object — sanity/schemas/blocks/shared/link.ts used as a
 * lone field (split-content.link, grid-card.link). */
export function linkField(name = "link"): GroupField {
  return { name, type: "group", fields: linkFields() };
}

/** An array of link objects — hero-1.links / cta-1.links (`Rule.max(2)`). */
export function linksArrayField(name = "links", opts: { maxRows?: number } = {}): ArrayField {
  return {
    name,
    type: "array",
    maxRows: opts.maxRows,
    fields: linkFields(),
  };
}

/** asset + per-usage alt text, mirroring Sanity's `image` field type (which
 * always carries its own `alt` sub-field rather than relying solely on the
 * Media collection's own alt — the same asset can be reused with different
 * alt text per placement). `alt` is localized: Lane A per-language documents
 * stored a plain string per language, which Payload's `localized: true`
 * collapses onto directly. */
export function imageField(
  name: string,
  opts: { condition?: Condition } = {},
): GroupField {
  return {
    name,
    type: "group",
    admin: opts.condition ? { condition: opts.condition } : undefined,
    fields: [uploadField("asset", "media"), localizedText("alt", { required: false })],
  };
}

export function uploadField(
  name: string,
  relationTo: string,
  opts: Partial<Omit<UploadField, "name" | "type" | "relationTo">> = {},
): UploadField {
  return {
    name,
    type: "upload",
    relationTo: collectionSlug(relationTo),
    ...opts,
  } as UploadField;
}

export function relationshipField(
  name: string,
  relationTo: string,
  opts: Partial<Omit<RelationshipField, "name" | "type" | "relationTo">> = {},
): RelationshipField {
  return {
    name,
    type: "relationship",
    relationTo: collectionSlug(relationTo),
    ...opts,
  } as RelationshipField;
}
