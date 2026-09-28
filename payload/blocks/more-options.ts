import type { Field } from "payload";

/** Presentation settings editors rarely need; folded into "More options". */
export const PRESENTATION_FIELDS = [
  "padding",
  "background",
  "sectionWidth",
  "stackAlign",
  "noGap",
  "motionSpeed",
  "imagePosition",
  "cardVariant",
  "gridColumns",
  "initialDisplayCount",
  "indicators",
];

/**
 * A section's essentials first, then one collapsed "More options" group with
 * its presentation settings (CMS project 2, spec §3.5). A collapsible holds no
 * data of its own, so what is stored doesn't change.
 */
export function moreOptions(fields: Field[], names: string[] = PRESENTATION_FIELDS): Field[] {
  const folded = fields.filter((f) => "name" in f && names.includes(f.name));
  if (folded.length === 0) return fields;
  const rest = fields.filter((f) => !folded.includes(f));
  return [...rest, { type: "collapsible", label: "More options", admin: { initCollapsed: true }, fields: folded }];
}
