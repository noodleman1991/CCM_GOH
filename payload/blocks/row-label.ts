import type { Block } from "payload";

/**
 * The section's row header in the admin: its number, its plain name and —
 * for a section in a list every language shares — which translations are
 * missing (payload/components/section-row-label.tsx). Returns a copy with only
 * `admin.components.Label` added; fields and slug are untouched, so the stored
 * shape doesn't change.
 */
export function withTranslationStatus(block: Block): Block {
  const label = typeof block.labels?.singular === "string" ? block.labels.singular : block.slug;
  return {
    ...block,
    admin: {
      ...block.admin,
      components: {
        ...block.admin?.components,
        Label: { path: "@/payload/components/section-row-label#SectionRowLabel", clientProps: { label } },
      },
    },
  };
}
