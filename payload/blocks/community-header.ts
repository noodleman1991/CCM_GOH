import type { Block } from "payload";
import { localizedTextarea } from "@/payload/fields/localized";
import { sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";
import { moreOptions } from "@/payload/blocks/more-options";

/** `community-header` — the community's own header (components/blocks/community-header.tsx). Community pages only. */
export const communityHeader: Block = {
  slug: "communityHeader",
  interfaceName: "CommunityHeaderBlock",
  labels: { singular: "Community header", plural: "Community headers" },
  admin: pickerAdmin("community-header", "Openings", "The community's own header: its region, name and ways to join"),
  fields: moreOptions([localizedTextarea("intro", { label: "Intro line (optional)" }), sectionPaddingField("padding")]),
};
