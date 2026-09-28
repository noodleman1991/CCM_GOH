import type { Block } from "payload";
import { cloneFieldList } from "@/payload/fields/block-slot";

/**
 * The section's row header in the admin: its number, its plain name and —
 * for a section in a list every language shares — which translations are
 * missing (payload/components/section-row-label.tsx). Returns a copy with
 * `admin.components.Label` added and its OWN field list: Payload strips
 * `localized` from fields inside a localized list by mutating them, so sharing
 * the originals would strip the flags every other usage (and the homepage move
 * planner) reads. The stored shape doesn't change.
 */
export function withTranslationStatus(block: Block): Block {
  const label = typeof block.labels?.singular === "string" ? block.labels.singular : block.slug;
  return {
    ...block,
    fields: cloneFieldList(block.fields),
    admin: {
      ...block.admin,
      components: {
        ...block.admin?.components,
        Label: { path: "@/payload/components/section-row-label#SectionRowLabel", clientProps: { label } },
      },
    },
  };
}
