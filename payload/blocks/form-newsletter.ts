import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";
import { moreOptions } from "@/payload/blocks/more-options";

/** `form-newsletter` — an email box to join the newsletter (components/blocks/forms/newsletter.tsx). */
export const formNewsletter: Block = {
  slug: "formNewsletter",
  interfaceName: "FormNewsletterBlock",
  labels: { singular: "Newsletter signup", plural: "Newsletter signups" },
  admin: pickerAdmin("newsletter", "Calls to action", "An email box to join the newsletter"),
  fields: moreOptions([
    localizedTextarea("consentText", { label: "Consent note" }),
    localizedText("buttonText", { label: "Button text" }),
    localizedText("successMessage", { label: "Message after signing up" }),
    sectionPaddingField("padding"),
  ]),
};
