import type { Block, BlocksField, CheckboxField, Field } from "payload";
import { cloneFieldList } from "@/payload/fields/block-slot";
import { withTranslationStatus } from "@/payload/blocks/row-label";

/**
 * The page builder's "Sections" field (spec §3.3): one list of sections that
 * every language shares — only the words are translated — plus a per-page
 * switch to give each language its own list instead.
 *
 * Two lists, not one: Payload's `localized` is a property of the field, so a
 * shared list and a per-language list must be two fields, shown one at a time
 * by the switch. Each list gets its own copy of every block because Payload
 * sanitizes a block's fields in place — and inside a localized list it strips
 * the nested `localized` flags — so sharing one object between the two would
 * leak one list's shape into the other. The `dbName`s keep their tables apart.
 */

const copy = (block: Block, dbName: string): Block =>
  withTranslationStatus({ ...block, dbName, fields: cloneFieldList(block.fields) });

/** A validator that refuses to save a list missing any of the `required` sections. */
export function requiredSectionsValidator(required: string[], labels: Record<string, string>) {
  return (value: unknown): true | string => {
    const present = new Set(
      (Array.isArray(value) ? value : []).map((b) => (b && typeof b === "object" ? (b as { blockType?: unknown }).blockType : undefined)),
    );
    const missing = required.find((slug) => !present.has(slug));
    return missing ? `This page always keeps its ${labels[missing] ?? missing}. You can move it, but not remove it.` : true;
  };
}

export function sectionsField({
  blocks,
  required = [],
  tablePrefix,
}: {
  blocks: Block[];
  /** Block slugs a page of this type can't be saved without. */
  required?: string[];
  /** Short, unique per collection — it names the block tables. */
  tablePrefix: string;
}): Field[] {
  const labels = Object.fromEntries(blocks.map((b) => [b.slug, String(b.labels?.singular ?? b.slug)]));
  const validate = required.length > 0 ? requiredSectionsValidator(required, labels) : undefined;

  const toggle: CheckboxField = {
    name: "layoutPerLanguage",
    type: "checkbox",
    defaultValue: false,
    label: "This page has its own layout in each language",
    admin: { description: "Off: every language shows the same sections, with the words translated. On: each language gets its own list." },
  };
  const shared: BlocksField = {
    name: "sections",
    type: "blocks",
    label: "Sections",
    blocks: blocks.map((b) => copy(b, `${tablePrefix}_s_${b.slug}`)),
    admin: { condition: (data) => !data?.layoutPerLanguage },
    ...(validate ? { validate: (value: unknown) => validate(value) } : {}),
  };
  const perLanguage: BlocksField = {
    name: "sectionsByLanguage",
    type: "blocks",
    localized: true,
    label: "Sections (this language)",
    blocks: blocks.map((b) => copy(b, `${tablePrefix}_l_${b.slug}`)),
    admin: { condition: (data) => Boolean(data?.layoutPerLanguage) },
    ...(validate ? { validate: (value: unknown) => validate(value) } : {}),
  };
  return [toggle, shared, perLanguage];
}
