import type { Block } from "payload";
import { localizedRichText, localizedText } from "@/payload/fields/localized";
import { sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";
import { moreOptions } from "@/payload/blocks/more-options";

/** `faqs` — questions that open to show their answers (components/blocks/faqs.tsx). */
export const faqs: Block = {
  slug: "faqs",
  interfaceName: "FaqsBlock",
  labels: { singular: "FAQs", plural: "FAQ sections" },
  admin: pickerAdmin("faqs", "Text & media", "Questions that open to show their answers"),
  fields: moreOptions([
    {
      name: "faqs",
      label: "Questions",
      type: "array",
      minRows: 1,
      labels: { singular: "Question", plural: "Questions" },
      fields: [localizedText("title", { required: true, label: "Question" }), localizedRichText("body", { label: "Answer" })],
    },
    sectionPaddingField("padding"),
  ]),
};
