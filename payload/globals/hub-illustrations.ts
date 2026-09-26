import type { GlobalConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { imageField } from "@/payload/blocks/shared";

/**
 * Mirrors sanity/schemas/documents/hub-illustrations.ts. Verified against
 * production_2 (2026-09-03): **0 documents** — no illustration has ever been
 * configured, which is exactly the state `<HeaderIllustration>` is written
 * for (an empty slot renders null and the page looks as it does today). Spec
 * §6 keeps the type for its live code references; it is built here and
 * imports nothing.
 *
 * Four decorative slots, each an image with its own alt text. The alt is
 * editorial only — the illustrations render `aria-hidden` — but it is
 * localized like every other `imageField` alt in this migration, because the
 * Studio description asks editors to describe the image and they write that
 * description in their own language.
 */
export const HubIllustrations: GlobalConfig = {
  slug: "hubIllustrations",
  admin: { group: "Site pages" },
  label: "Hub Illustrations",
  access: {
    read: isAnyone,
    update: isEditor,
  },
  fields: [
    {
      ...imageField("atlasHeader"),
      label: "Atlas header illustration",
      admin: { description: "Decorative illustration shown at the end (RTL-safe) of the Atlas page header." },
    },
    {
      ...imageField("searchHeader"),
      label: "Search header illustration",
      admin: { description: "Decorative illustration shown at the end (RTL-safe) of the Search page header." },
    },
    {
      ...imageField("collaborateHeader"),
      label: "Collaborate header illustration",
      admin: { description: "Decorative illustration shown at the end (RTL-safe) of the Collaborate page header." },
    },
    {
      ...imageField("emptyState"),
      label: "Empty state illustration",
      admin: { description: "Decorative illustration shown alongside empty-state messaging." },
    },
  ],
};
