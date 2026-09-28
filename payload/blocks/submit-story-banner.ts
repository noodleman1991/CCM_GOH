import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { imageField, sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";

/** `submit-story-banner` — an invitation to share a story (components/blocks/cta/submit-story-banner.tsx). */
export const submitStoryBanner: Block = {
  slug: "submitStoryBanner",
  interfaceName: "SubmitStoryBannerBlock",
  labels: { singular: "Share-your-story banner", plural: "Share-your-story banners" },
  admin: pickerAdmin("share-story", "Calls to action", "An invitation to share a story, with a button"),
  fields: [
    localizedText("title", { label: "Title" }),
    localizedTextarea("subtitle", { label: "Text under the title" }),
    localizedText("ctaLabel", { label: "Button text" }),
    imageField("illustration"),
    sectionPaddingField("padding"),
  ],
};
