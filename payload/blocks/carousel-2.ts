import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { relationshipField, sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";
import { moreOptions } from "@/payload/blocks/more-options";

/**
 * sanity/schemas/blocks/carousel/carousel-2.ts. Verified against
 * production_2 (2026-09-03): 4 real instances (the homepage's
 * livedExperiences slot, one per language).
 *
 * `testimonial` — the reference array this block exists to carry — is EMPTY
 * on all 4 instances today; the homepage's testimonial carousel currently
 * renders with zero cards. Not a schema/data disagreement (nothing is
 * malformed), but worth recording: there is no content here to migrate,
 * only the (correct) empty shape.
 *
 * DISAGREEMENT — not ported: all 4 instances also carry `colorVariant`
 * ("accent"), undeclared in any current schema and unread by any renderer —
 * same dead-field pattern documented in split-row.ts.
 *
 * `relationTo: "testimonials"` is a forward reference to Task 5's
 * payload/collections/testimonials.ts, which does not exist yet.
 */
export const carousel2: Block = {
  slug: "carousel2",
  interfaceName: "Carousel2Block",
  labels: { singular: "Testimonials", plural: "Testimonials" },
  admin: pickerAdmin("testimonials", "Logos & quotes", "Quotes from people, one at a time"),
  fields: moreOptions([
    localizedText("title", { required: false, label: "Section Title" }),
    localizedTextarea("description", { required: false, label: "Section Description" }),
    sectionPaddingField("padding"),
    relationshipField("testimonial", "testimonials", { hasMany: true }),
  ]),
};
