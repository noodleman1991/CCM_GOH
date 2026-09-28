import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sectionPaddingField, uploadField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";

/**
 * sanity/schemas/blocks/logo-cloud/logo-cloud-1.ts. Verified against
 * production_2 (2026-09-03): 24 real instances. `layout` is null (defaults
 * to "marquee") or explicitly "marquee" on all 24 — "grid" is offered but
 * never chosen. `motionSpeed` and every `images[].orgType` are unset on all
 * 24 — kept for schema parity (both are live, currently-offered options),
 * not because they are exercised.
 *
 * Per-image `alt`/`label` are plain strings in Sanity (this block only
 * lives in Lane-A per-language documents) — localized here like every other
 * Lane-A text field in this block set, so each language keeps its own alt
 * text for the same shared logo asset.
 */
export const logoCloud1: Block = {
  slug: "logoCloud1",
  interfaceName: "LogoCloud1Block",
  labels: { singular: "Logo strip", plural: "Logo strips" },
  admin: pickerAdmin("logo-strip", "Logos & quotes", "A row of partner logos"),
  fields: [
    sectionPaddingField("padding"),
    localizedText("title", { required: false }),
    localizedTextarea("description", { required: false }),
    {
      name: "layout",
      type: "select",
      defaultValue: "marquee",
      admin: {
        description:
          "Grid gives the logos more space and dignity (recommended for partners/institutions). Marquee is the scrolling strip.",
      },
      options: [
        { label: "Grid — calm, spacious", value: "grid" },
        { label: "Marquee — scrolling strip", value: "marquee" },
      ],
    },
    {
      name: "motionSpeed",
      type: "select",
      label: "Marquee speed",
      defaultValue: "default",
      admin: {
        description: "Only applies to the marquee layout.",
        condition: (_, siblingData) => siblingData?.layout !== "grid",
      },
      options: [
        { label: "Default", value: "default" },
        { label: "Slow", value: "slow" },
      ],
    },
    {
      name: "organizations",
      label: "Partner organisations",
      type: "relationship",
      relationTo: "organizations",
      hasMany: true,
      filterOptions: { showOnSite: { not_equals: false } },
      admin: { description: "Each logo links to the organisation's page on the hub. Drag to reorder." },
    },
    {
      name: "images",
      label: "Other logos (not linked)",
      type: "array",
      admin: { description: "Logos with no organisation on the hub. Prefer Partner organisations." },
      fields: [
        uploadField("asset", "media"),
        localizedText("alt", { required: false }),
        localizedText("label", { required: false, admin: { description: "Shown under the logo in grid layout." } }),
        {
          name: "orgType",
          type: "select",
          admin: { description: "If set on logos, the grid groups them under type headings." },
          options: [
            { label: "NGO", value: "ngo" },
            { label: "Research Institution", value: "research" },
            { label: "University", value: "university" },
            { label: "Government Agency", value: "government" },
            { label: "International Organization", value: "international" },
            { label: "Private Company", value: "company" },
            { label: "Community Organization", value: "community" },
            { label: "Foundation", value: "foundation" },
            { label: "Other", value: "other" },
          ],
        },
      ],
    },
  ],
};
