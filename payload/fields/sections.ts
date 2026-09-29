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
 * by the switch.
 *
 * Each list gets its own deep copy of every block, nested blocks included.
 * Payload sanitizes block definitions in place, and when the same block type
 * appears again in a document with a different shape it gives that usage its
 * own table (`…_blocks_hero1_2`) by marking the block object — so the objects
 * must not be shared. Custom `dbName`s are NOT used: Payload's write path
 * finds a block's table by its type name, so two usages with custom names
 * collide on save. Declare this field AFTER any older field that uses the same
 * block types, so the older field keeps its existing tables.
 */

/** Write-context flag that lets a trusted script empty a list with required
 *  sections — the homepage move's `--revert`. Editors can't set it. */
export const SKIP_REQUIRED_SECTIONS = "skipRequiredSections";

const copy = (block: Block): Block => withTranslationStatus({ ...block, fields: cloneFieldList(block.fields) });

/** A validator that refuses to save a list missing a required section. An
 *  inner array is a group: any one of those sections satisfies it. */
export function requiredSectionsValidator(required: Array<string | string[]>, labels: Record<string, string>) {
  return (value: unknown): true | string => {
    const present = new Set(
      (Array.isArray(value) ? value : []).map((b) => (b && typeof b === "object" ? (b as { blockType?: unknown }).blockType : undefined)),
    );
    const missing = required.find((rule) => (Array.isArray(rule) ? !rule.some((slug) => present.has(slug)) : !present.has(rule)));
    if (!missing) return true;
    const first = Array.isArray(missing) ? missing[0] : missing;
    return `This page always keeps its ${labels[first] ?? first}. You can move it, but not remove it.`;
  };
}

export function sectionsField({
  blocks,
  required = [],
}: {
  blocks: Block[];
  /** Block slugs a page of this type can't be saved without; an inner array means any one of them. */
  required?: Array<string | string[]>;
}): Field[] {
  const labels = Object.fromEntries(blocks.map((b) => [b.slug, String(b.labels?.singular ?? b.slug)]));
  const check = required.length > 0 ? requiredSectionsValidator(required, labels) : undefined;
  const validate = check
    ? (value: unknown, options?: { req?: { context?: Record<string, unknown> } }) =>
        options?.req?.context?.[SKIP_REQUIRED_SECTIONS] === true ? true : check(value)
    : undefined;

  // Reads an "Edit this section" link: opens that row with live preview on (editor-experience spec §3.2).
  const focus: Field = {
    name: "sectionFocus",
    type: "ui",
    admin: { components: { Field: "@/payload/components/section-focus#SectionFocus" } },
  };
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
    blocks: blocks.map(copy),
    admin: { condition: (data) => !data?.layoutPerLanguage },
    ...(validate ? { validate } : {}),
  };
  const perLanguage: BlocksField = {
    name: "sectionsByLanguage",
    type: "blocks",
    localized: true,
    label: "Sections (this language)",
    blocks: blocks.map(copy),
    admin: { condition: (data) => Boolean(data?.layoutPerLanguage) },
    ...(validate ? { validate } : {}),
  };
  return [focus, toggle, shared, perLanguage];
}
