import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { backgroundOptionField, sectionPaddingField, uploadField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";

/** `carousel-1` — several images you can swipe through (components/blocks/carousel/carousel-1.tsx).
 *  Each image row is an image group in its own right (`asset` + `alt`), the
 *  shape `imageGroup()` reads. */
export const carousel1: Block = {
  slug: "carousel1",
  interfaceName: "Carousel1Block",
  labels: { singular: "Image carousel", plural: "Image carousels" },
  admin: pickerAdmin("image-carousel", "Text & media", "Several images you can swipe through"),
  fields: [
    localizedText("title", { label: "Title (optional)" }),
    localizedTextarea("description", { label: "Intro (optional)" }),
    {
      name: "images",
      label: "Images",
      type: "array",
      minRows: 1,
      labels: { singular: "Image", plural: "Images" },
      fields: [uploadField("asset", "media", { required: true, label: "Image" }), localizedText("alt", { label: "Describe the image" })],
    },
    {
      name: "size",
      label: "How many at a time",
      type: "select",
      defaultValue: "one",
      options: [
        { label: "One at a time", value: "one" },
        { label: "Two at a time", value: "two" },
        { label: "Three at a time", value: "three" },
      ],
    },
    {
      name: "indicators",
      label: "Position marker",
      type: "select",
      defaultValue: "dots",
      options: [
        { label: "None", value: "none" },
        { label: "Dots", value: "dots" },
        { label: "Count (2 / 5)", value: "count" },
      ],
    },
    backgroundOptionField("background"),
    sectionPaddingField("padding"),
  ],
};
