import type { Block } from "payload";
import { sectionPaddingField } from "@/payload/blocks/shared";
import { splitContent } from "@/payload/blocks/split-content";
import { splitImage } from "@/payload/blocks/split-image";

/**
 * sanity/schemas/blocks/split/split-row.ts. Verified against production_2
 * (2026-09-03): 36 real instances (20 in page.blocks[], 16 across the
 * homepage's four split-row slots). splitColumns only ever holds
 * split-content and split-image in practice (0 split-cards-list, 0
 * split-info-list — the census this whole phase is built on, spec §6),
 * matching the schema's own declared `of` list minus those two.
 *
 * DISAGREEMENT — not ported: every one of the 36 instances (36/36) also
 * carries a `colorVariant` field ("background" | "light" | "default") that
 * NO current schema file declares (grepped the full sanity/schemas tree —
 * zero hits) and NO renderer reads (grepped components/ and lib/ — zero
 * hits; components/blocks/split/split-row.tsx's own props type has no such
 * field). `sanity.types.ts` still has `colorVariant?: ColorVariant` on this
 * and four other block types, which is the tell: it was a real field in an
 * earlier schema revision, removed from the schema and the renderer without
 * a data migration, and 100%-of-instances survives in stored documents as a
 * result. Flagging for Task 12: this is dead weight to drop at import, not
 * data to preserve — porting it would resurrect a feature with no code path
 * left to display it.
 */
export const splitRow: Block = {
  slug: "splitRow",
  interfaceName: "SplitRowBlock",
  fields: [
    sectionPaddingField("padding"),
    { name: "noGap", type: "checkbox", defaultValue: false, admin: { description: "Remove gap between columns" } },
    {
      name: "splitColumns",
      type: "blocks",
      maxRows: 2,
      blocks: [splitContent, splitImage],
    },
  ],
};
