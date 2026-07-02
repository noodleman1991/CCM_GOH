import { defineField, defineType } from "sanity";

/**
 * The reusable geotag (spec A2): one coordinate + display text + author-owned
 * precision. `countryCode` (ISO alpha-3) is set by the geocoder / editor and
 * drives the LocaleMap highlight + atlas country breakdown.
 */
export default defineType({
  name: "place",
  title: "Place",
  type: "object",
  fields: [
    defineField({
      name: "point",
      title: "Location (map)",
      type: "geopoint",
      description: "The coordinate. For the map, set this for every geotagged item.",
    }),
    defineField({
      name: "text",
      title: "Displayed as",
      type: "string",
      description: 'Human-readable place shown to readers (e.g. "Nakuru, Kenya").',
    }),
    defineField({
      name: "precision",
      title: "Shown on the map as",
      type: "string",
      options: {
        list: [
          { title: "Exact point", value: "exact" },
          { title: "City", value: "city" },
          { title: "Country", value: "country" },
          { title: "Region only (no pin)", value: "region" },
        ],
        layout: "radio",
      },
      initialValue: "city",
      description:
        "The map never shows finer than this. 'Region only' keeps the item off the pin layer entirely (it still counts in region totals).",
    }),
    defineField({
      name: "countryCode",
      title: "Country code (ISO alpha-3)",
      type: "string",
      description: "Set automatically by the geocoder; editable. Drives the country highlight.",
      validation: (rule) =>
        rule.custom((v) =>
          !v || /^[A-Z]{3}$/.test(v) ? true : "Use a 3-letter ISO code (e.g. KEN)"
        ).warning(),
    }),
  ],
  preview: {
    select: { title: "text", subtitle: "precision" },
  },
});
