import type { Block } from "payload";
import { localizedText } from "@/payload/fields/localized";
import { sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";
import { moreOptions } from "@/payload/blocks/more-options";

/** `community-members` — the community's members, filled automatically (components/blocks/community-members.tsx). Community pages only. */
export const communityMembers: Block = {
  slug: "communityMembers",
  interfaceName: "CommunityMembersBlock",
  labels: { singular: "Community members", plural: "Community members sections" },
  admin: pickerAdmin("people", "Content", "The community's members, filled automatically"),
  fields: moreOptions([localizedText("title", { label: "Title (optional)" }), sectionPaddingField("padding")]),
};
